import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_FACTUALITY_SCALE,
  RESPONSE_EXPERIENCE_SCALE,
  TASK_COMPLETION_SCALE,
  WORLD_FACT_CORRECTNESS_SCALE,
  averageRating,
  clampRating,
  isRating,
  ratingLabel,
  ratingToPercent,
} from '../../src/domain/ratings';
import type { Rating, RatingScaleLabels } from '../../src/domain/types';

const SCALES: ReadonlyArray<[string, RatingScaleLabels]> = [
  ['world fact correctness', WORLD_FACT_CORRECTNESS_SCALE],
  ['account factuality', ACCOUNT_FACTUALITY_SCALE],
  ['task completion', TASK_COMPLETION_SCALE],
  ['response experience', RESPONSE_EXPERIENCE_SCALE],
];

describe('isRating', () => {
  it('accepts exactly the integers 1 through 5', () => {
    expect([1, 2, 3, 4, 5].every(isRating)).toBe(true);
  });

  it('rejects everything else', () => {
    const rejected: unknown[] = [0, 6, -1, 3.5, '4', null, undefined, Number.NaN];
    expect(rejected.some(isRating)).toBe(false);
  });
});

describe('clampRating', () => {
  it('clamps below the scale to 1', () => {
    expect(clampRating(0)).toBe(1);
    expect(clampRating(-12)).toBe(1);
  });

  it('clamps above the scale to 5', () => {
    expect(clampRating(6)).toBe(5);
    expect(clampRating(99)).toBe(5);
  });

  it('rounds to the nearest whole rating', () => {
    expect(clampRating(3.4)).toBe(3);
    expect(clampRating(4.6)).toBe(5);
  });

  it('falls back to 1 for non-finite input', () => {
    expect(clampRating(Number.NaN)).toBe(1);
    expect(clampRating(Number.POSITIVE_INFINITY)).toBe(5);
  });
});

describe('ratingToPercent', () => {
  it('maps the scale ends to 0% and 100%', () => {
    expect(ratingToPercent(1)).toBe(0);
    expect(ratingToPercent(5)).toBe(100);
  });

  it('maps intermediate ratings linearly', () => {
    expect(ratingToPercent(2)).toBe(25);
    expect(ratingToPercent(3)).toBe(50);
    expect(ratingToPercent(4)).toBe(75);
  });
});

describe('averageRating', () => {
  it('returns null when no rating has been set', () => {
    expect(averageRating([])).toBeNull();
    expect(averageRating([null, null])).toBeNull();
  });

  it('ignores unset ratings', () => {
    expect(averageRating([5, 4, null])).toBe(4.5);
  });

  it('rounds the mean to one decimal place', () => {
    expect(averageRating([4, 5, 5])).toBe(4.7);
    expect(averageRating([5, 5, 5])).toBe(5);
  });
});

describe('rating labels', () => {
  it('labels every rating in every scale', () => {
    for (const [name, scale] of SCALES) {
      for (const value of [1, 2, 3, 4, 5] as const) {
        expect(scale[value].trim(), `${name} at ${value}`).not.toBe('');
      }
    }
  });

  it('uses the documented anchor labels', () => {
    expect(WORLD_FACT_CORRECTNESS_SCALE[5]).toBe('Correct');
    expect(WORLD_FACT_CORRECTNESS_SCALE[1]).toBe('Incorrect');
    expect(ACCOUNT_FACTUALITY_SCALE[5]).toBe('Fully factual');
    expect(ACCOUNT_FACTUALITY_SCALE[1]).toBe('Not factual');
  });

  it('describes a rating with its label and an em dash when unset', () => {
    expect(ratingLabel(4, WORLD_FACT_CORRECTNESS_SCALE)).toBe('Mostly correct');
    expect(ratingLabel(null, WORLD_FACT_CORRECTNESS_SCALE)).toBe('—');
  });

  it('keeps scales ordered from worst to best', () => {
    const scale = WORLD_FACT_CORRECTNESS_SCALE;
    const labels: string[] = [scale[1], scale[2], scale[3], scale[4], scale[5]];
    expect(new Set(labels).size).toBe(5);
  });
});

describe('Rating type usage', () => {
  it('narrows clamped values to the Rating union', () => {
    const value: Rating = clampRating(4.2);
    expect(value).toBe(4);
  });
});
