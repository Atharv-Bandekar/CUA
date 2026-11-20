import { describe, expect, it } from 'vitest';
import {
  EMPTY_VALUE,
  formatJustificationSummary,
  formatPercent,
  formatRating,
  formatSecondsRemaining,
  formatUtcDateTime,
  pluralize,
  truncateText,
} from '../../src/domain/format';
import { WORLD_FACT_CORRECTNESS_SCALE } from '../../src/domain/ratings';
import type { JustificationSlice, Rating, SourceItem } from '../../src/domain/types';

describe('formatRating', () => {
  it('renders the scale position', () => {
    expect(formatRating(4)).toBe('4 / 5');
    expect(formatRating(1)).toBe('1 / 5');
  });

  it('renders an em dash when unset', () => {
    expect(formatRating(null)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('rounds to a whole percent', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(42.4)).toBe('42%');
    expect(formatPercent(42.5)).toBe('43%');
    expect(formatPercent(100)).toBe('100%');
  });

  it('renders an em dash for non-finite input', () => {
    expect(formatPercent(Number.NaN)).toBe('—');
  });
});

describe('truncateText', () => {
  it('leaves short text untouched and trims it', () => {
    expect(truncateText('  short note  ', 20)).toBe('short note');
  });

  it('truncates with an ellipsis inside the limit', () => {
    expect(truncateText('business analyst', 10)).toBe('business…');
    expect(truncateText('business analyst', 10).length).toBeLessThanOrEqual(10);
  });

  it('returns an empty string for a non-positive limit', () => {
    expect(truncateText('anything', 0)).toBe('');
  });
});

describe('pluralize', () => {
  it('uses the singular form for exactly one', () => {
    expect(pluralize(1, 'condition')).toBe('1 condition');
  });

  it('uses the default or supplied plural form otherwise', () => {
    expect(pluralize(0, 'condition')).toBe('0 conditions');
    expect(pluralize(2, 'source', 'sources')).toBe('2 sources');
  });
});

describe('formatSecondsRemaining', () => {
  it('counts up to the nearest whole second', () => {
    expect(formatSecondsRemaining(4_999)).toBe('5s');
    expect(formatSecondsRemaining(4_001)).toBe('5s');
    expect(formatSecondsRemaining(5_000)).toBe('5s');
  });

  it('never reports a negative countdown', () => {
    expect(formatSecondsRemaining(0)).toBe('0s');
    expect(formatSecondsRemaining(-1_000)).toBe('0s');
  });
});

describe('formatUtcDateTime', () => {
  it('formats an ISO timestamp in UTC', () => {
    expect(formatUtcDateTime('2026-11-20T14:03:00.000Z')).toBe('2026-11-20 14:03 UTC');
  });

  it('renders an em dash for invalid input', () => {
    expect(formatUtcDateTime('not-a-date')).toBe('—');
  });
});

describe('formatJustificationSummary', () => {
  const draft: JustificationSlice = {
    rating: 4 as Rating,
    conditions: [{ id: 'c1', value: 'Report covers Q3 revenue' }],
    sources: [
      { id: 's1', label: '10-K filing', url: 'https://example.com/10k' } satisfies SourceItem,
    ],
    expected: [{ id: 'e1', value: 'Revenue grew 12%' }],
    actual: [{ id: 'a1', value: 'Revenue grew 9%' }],
  };

  it('renders a labeled multi-line summary', () => {
    expect(formatJustificationSummary('World Fact Correctness', draft, WORLD_FACT_CORRECTNESS_SCALE)).toBe(
      [
        'World Fact Correctness — 4 / 5 · Mostly correct',
        'Conditions: Report covers Q3 revenue',
        'Sources: 10-K filing (https://example.com/10k)',
        'Expected: Revenue grew 12%',
        'Actual: Revenue grew 9%',
      ].join('\n'),
    );
  });

  it('joins multiple values and ignores blank ones', () => {
    const summary = formatJustificationSummary(
      'World Fact Correctness',
      {
        ...draft,
        conditions: [
          { id: 'c1', value: 'First check' },
          { id: 'c2', value: '   ' },
          { id: 'c3', value: 'Second check' },
        ],
      },
      WORLD_FACT_CORRECTNESS_SCALE,
    );

    expect(summary).toContain('Conditions: First check; Second check');
  });

  it('uses em dashes for an empty draft', () => {
    const summary = formatJustificationSummary(
      'Account Factuality',
      { rating: null, conditions: [], sources: [], expected: [], actual: [] },
      WORLD_FACT_CORRECTNESS_SCALE,
    );

    expect(summary).toBe(
      [
        `Account Factuality — ${EMPTY_VALUE}`,
        `Conditions: ${EMPTY_VALUE}`,
        `Sources: ${EMPTY_VALUE}`,
        `Expected: ${EMPTY_VALUE}`,
        `Actual: ${EMPTY_VALUE}`,
      ].join('\n'),
    );
  });
});
