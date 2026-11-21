import { describe, expect, it } from 'vitest';
import {
  CLAIM_ACCURACIES,
  CLAIM_CANNOT_ASSESS_JUSTIFICATIONS,
  CLAIM_JUSTIFICATION_PRESETS,
  FACTUALITY_OPTIONS,
  FACTUALITY_RATINGS,
  FINAL_CANNOT_ASSESS_JUSTIFICATIONS,
  claimJustificationForAccuracy,
  factualityRatingLabel,
  finalJustificationForRating,
  formatClaimSummary,
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

describe('claim accuracy options', () => {
  it('exposes the five accuracy choices in rising order', () => {
    expect(CLAIM_ACCURACIES).toEqual([
      'Inaccurate',
      'Unsupported',
      'Disputed',
      'Accurate',
      "Can't confidently assess",
    ]);
  });
});

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
  it('tallies the claims after they are listed and closes with the final rating', () => {
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
        'The response contains 2 claim(s):',
        '- 1 Inaccurate',
        '- 0 Unsupported',
        '- 0 Disputed',
        '- 1 Accurate',
        "- 0 Can't confidently assess",
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

  it('tallies every accuracy in rising order, zeros included', () => {
    const claims: Claim[] = [
      'Inaccurate',
      'Unsupported',
      'Disputed',
      "Can't confidently assess",
      '',
    ].map((accuracy) => ({
      text: 'claim',
      classification: 'Objective',
      accuracy: accuracy as Claim['accuracy'],
      justification: '',
      sources: [],
    }));

    expect(formatClaimSummary(claims)).toBe(
      [
        'The response contains 5 claim(s):',
        '- 1 Inaccurate',
        '- 1 Unsupported',
        '- 1 Disputed',
        '- 0 Accurate',
        "- 1 Can't confidently assess",
      ].join('\n'),
    );
  });

  it('leaves the tally out when the section has no claims', () => {
    const output = formatJustificationBuilder({
      claims: [],
      finalRating: '5/5',
      finalJustification: 'Nothing claimed.',
    });

    expect(output).not.toContain('claim(s)');
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

describe('predefined claim justifications', () => {
  it('lists the five openers in the specified order', () => {
    expect(CLAIM_JUSTIFICATION_PRESETS).toEqual([
      "Agent's log confirms it.",
      "Agent's log and a screenshot in it confirm it.",
      "Agent's logs and screenshots in them confirm it.",
      "Agent's log and the content in it confirm it.",
      "Agent's logs and the content in them confirm it.",
    ]);
  });

  it('seeds the section-specific justification when nothing can be assessed', () => {
    expect(claimJustificationForAccuracy("Can't confidently assess", 'worldFactCorrectness')).toBe(
      'No world fact can be checked for this claim.',
    );
    expect(claimJustificationForAccuracy("Can't confidently assess", 'accountFactuality')).toBe(
      'No tool call can be checked for this claim.',
    );
  });

  it('leaves the existing justification alone for every other accuracy', () => {
    expect(claimJustificationForAccuracy('Accurate', 'worldFactCorrectness')).toBeNull();
    expect(claimJustificationForAccuracy('', 'accountFactuality')).toBeNull();
  });
});

describe('cannot-assess final justification', () => {
  it('seeds a section-specific final justification for 1/5', () => {
    expect(finalJustificationForRating('1/5', 'worldFactCorrectness')).toBe(
      'No world fact to check here.',
    );
    expect(finalJustificationForRating('1/5', 'accountFactuality')).toBe(
      'No tool call to check here.',
    );
    expect(FINAL_CANNOT_ASSESS_JUSTIFICATIONS.worldFactCorrectness).toBe(
      'No world fact to check here.',
    );
    expect(CLAIM_CANNOT_ASSESS_JUSTIFICATIONS.accountFactuality).toBe(
      'No tool call can be checked for this claim.',
    );
  });

  it('leaves the existing final justification alone for every other rating', () => {
    expect(finalJustificationForRating('5/5', 'worldFactCorrectness')).toBeNull();
    expect(finalJustificationForRating('', 'accountFactuality')).toBeNull();
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
      ['Claim 1: Revenue grew 12%', 'Claim 2: Revenue grew 12% on renewals'].join('\n\n'),
    );
  });

  it('numbers each claim and leaves one blank line between them', () => {
    expect(formatObjectiveClaimsList(claims).split('\n')).toEqual([
      'Claim 1: Revenue grew 12%',
      '',
      'Claim 2: Revenue grew 12% on renewals',
    ]);
  });

  it('returns an empty string when no objective claims exist', () => {
    expect(formatObjectiveClaimsList([])).toBe('');
    expect(formatObjectiveClaimsList([claims[1] as Claim])).toBe('');
  });
});
