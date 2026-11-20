/**
 * Rating mappings. Pure TypeScript only — no React, DOM or browser APIs.
 */
import type { Rating, RatingScaleLabels } from './types';

export const RATING_VALUES: readonly Rating[] = [1, 2, 3, 4, 5];

export const WORLD_FACT_CORRECTNESS_SCALE: RatingScaleLabels = {
  1: 'Incorrect',
  2: 'Mostly incorrect',
  3: 'Mixed',
  4: 'Mostly correct',
  5: 'Correct',
};

export const ACCOUNT_FACTUALITY_SCALE: RatingScaleLabels = {
  1: 'Not factual',
  2: 'Mostly not factual',
  3: 'Partly factual',
  4: 'Mostly factual',
  5: 'Fully factual',
};

export const TASK_COMPLETION_SCALE: RatingScaleLabels = {
  1: 'Not started',
  2: 'Started',
  3: 'Partially complete',
  4: 'Mostly complete',
  5: 'Complete',
};

export const RESPONSE_EXPERIENCE_SCALE: RatingScaleLabels = {
  1: 'Poor',
  2: 'Below expectations',
  3: 'Acceptable',
  4: 'Good',
  5: 'Excellent',
};

/** True only for the exact integers 1 through 5. */
export function isRating(value: unknown): value is Rating {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

/** Rounds and clamps any number onto the five-point scale. */
export function clampRating(value: number): Rating {
  if (Number.isNaN(value)) {
    return 1;
  }

  const rounded = Math.round(value);

  if (rounded <= 1) {
    return 1;
  }

  if (rounded >= 5) {
    return 5;
  }

  return rounded as Rating;
}

/** Maps a rating to its position on the scale as a percentage (1 → 0%, 5 → 100%). */
export function ratingToPercent(rating: Rating): number {
  return ((rating - 1) / 4) * 100;
}

/** Mean of the set ratings, rounded to one decimal, or null when nothing is set. */
export function averageRating(ratings: readonly (Rating | null)[]): number | null {
  const values = ratings.filter((rating): rating is Rating => rating !== null);

  if (values.length === 0) {
    return null;
  }

  const mean = values.reduce((total, rating) => total + rating, 0) / values.length;
  return Math.round(mean * 10) / 10;
}

/** Human label for a rating position, or an em dash when unset. */
export function ratingLabel(rating: Rating | null, scale: RatingScaleLabels): string {
  return rating === null ? '—' : scale[rating];
}
