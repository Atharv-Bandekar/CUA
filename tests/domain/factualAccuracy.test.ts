import { describe, expect, it } from 'vitest';
import {
  FACTUALITY_OPTIONS,
  FACTUALITY_RATINGS,
  factualityRatingLabel,
  formatJustificationBuilder,
  formatObjectiveClaimsList,
} from '../../src/domain/factualAccuracy';
import type { Claim, FactualAccuracyState } from '../../src/domain/factualAccuracy';

const state: FactualAccuracyState = {
  claims: [
    {
      text: 'Q3 revenue grew 12%',
      classification: 'Objective',
      accuracy: 'Accurate',
      justification: 'Matches the 10-K filing.',
      sources: [{ text: '10-K filing' }, { text: 'Earnings call' }],
    },
    {
      text: 'Churn improved',
      classification: 'Subjective',
      accuracy: 'Inaccurate',
      justification: 'Churn was flat quarter over quarter.',
      sources: [{ text: 'CRM export' }],
    },
  ],
  finalRating: '4/5',
  finalJustification: 'One claim was off.',
};

describe('factuality rating options', () => {
  it('maps every scale position to its output text', () => {
    expect(FACTUALITY_RATINGS).toEqual({
      '5/5': 'Completely Accurate',
      '4/5': 'Mostly Accurate',
      '3/5': 'Mixed Accuracy',
      '2/5': 'Inaccurate',
      '1/5': 'Cannot Confidently Assess',
    });
  });

  it('exposes options best-first for the UI', () => {
    expect(FACTUALITY_OPTIONS.map((option) => option.value)).toEqual([
      '5/5',
      '4/5',
      '3/5',
      '2/5',
      '1/5',
    ]);
    expect(FACTUALITY_OPTIONS[0]).toEqual({ value: '5/5', label: 'Completely Accurate' });
  });

  it('renders an explicit fallback for an unselected rating', () => {
    expect(factualityRatingLabel('')).toBe('[Not Rated]');
    expect(factualityRatingLabel('1/5')).toBe('Cannot Confidently Assess');
  });
});

describe('formatJustificationBuilder', () => {
  it('numbers claims and sources by index and closes with the final rating', () => {
    expect(formatJustificationBuilder(state)).toBe(
      [
        'Claim 1: Q3 revenue grew 12%',
        '',
        'Objective - Accurate',
        'Justification: Matches the 10-K filing.',
        'Source 1: 10-K filing',
        'Source 2: Earnings call',
        '',
        'Claim 2: Churn improved',
        '',
        'Subjective - Inaccurate',
        'Justification: Churn was flat quarter over quarter.',
        'Source 1: CRM export',
        '',
        'Final Rating: Mostly Accurate',
        'Final Justification: One claim was off.',
      ].join('\n'),
    );
  });

  it('renumbers claims dynamically from the array index', () => {
    const output = formatJustificationBuilder({
      ...state,
      claims: [
        state.claims[0],
        { ...state.claims[0], text: 'Second claim' },
        { ...state.claims[0], text: 'Third claim' },
      ].filter((claim): claim is Claim => claim !== undefined),
    });

    expect(output).toContain('Claim 1: Q3 revenue grew 12%');
    expect(output).toContain('Claim 3: Third claim');
    expect(output).not.toContain('Claim 4');
  });

  it('never outputs the numeric (x/5) rating prefix', () => {
    expect(formatJustificationBuilder(state)).not.toMatch(/\d\/5/);
  });

  it('falls back to [Not Rated] when no final rating is selected', () => {
    const output = formatJustificationBuilder({
      claims: [],
      finalRating: '',
      finalJustification: '',
    });

    expect(output).toBe(['Final Rating: [Not Rated]', 'Final Justification: '].join('\n'));
  });

  it('omits source lines for a claim without sources', () => {
    const output = formatJustificationBuilder({
      claims: [
        {
          text: 'No sources yet',
          classification: 'Objective',
          accuracy: 'Accurate',
          justification: 'Pending verification.',
          sources: [],
        },
      ],
      finalRating: '5/5',
      finalJustification: 'Verified.',
    });

    expect(output).not.toContain('Source 1:');
    expect(output).toContain('Final Rating: Completely Accurate');
  });
});

describe('formatObjectiveClaimsList', () => {
  const claims: Claim[] = [
    {
      text: 'Revenue grew 12%',
      classification: 'Objective',
      accuracy: 'Accurate',
      justification: '',
      sources: [],
    },
    {
      text: 'Churn fell sharply',
      classification: 'Subjective',
      accuracy: 'Accurate',
      justification: '',
      sources: [],
    },
    {
      text: '   ',
      classification: 'Objective',
      accuracy: 'Accurate',
      justification: '',
      sources: [],
    },
    {
      text: 'Revenue\n  grew   12% on renewals',
      classification: 'Objective',
      accuracy: 'Accurate',
      justification: '',
      sources: [],
    },
  ];

  it('keeps only objective claims with non-blank text', () => {
    expect(formatObjectiveClaimsList(claims)).toBe(
      ['• Revenue grew 12%', '• Revenue grew 12% on renewals'].join('\n'),
    );
  });

  it('normalizes each bullet to a single line', () => {
    const output = formatObjectiveClaimsList(claims);
    expect(output.split('\n')).toHaveLength(2);
    expect(output).not.toContain('\n\n');
  });

  it('returns an empty string when no objective claims exist', () => {
    expect(formatObjectiveClaimsList([])).toBe('');
    expect(formatObjectiveClaimsList([claims[1] as Claim])).toBe('');
  });
});
