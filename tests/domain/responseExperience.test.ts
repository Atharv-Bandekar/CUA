import { describe, expect, it } from 'vitest';
import {
  RESPONSE_EXPERIENCE_OPTIONS,
  RESPONSE_EXPERIENCE_RATINGS,
  formatResponseExperience,
  responseExperienceRatingLabel,
} from '../../src/domain/responseExperience';
import type { ResponseExperienceState } from '../../src/domain/responseExperience';

describe('response experience rating options', () => {
  it('maps every scale position to its output text', () => {
    expect(RESPONSE_EXPERIENCE_RATINGS).toEqual({
      '5/5': 'Cannot be improved',
      '4/5': 'Minor room for improvement',
      '3/5': 'Okay',
      '2/5': 'Pretty Bad',
      '1/5': 'Horrible',
    });
  });

  it('exposes options best-first for the UI', () => {
    expect(RESPONSE_EXPERIENCE_OPTIONS[0]).toEqual({
      value: '5/5',
      label: 'Cannot be improved',
    });
    expect(RESPONSE_EXPERIENCE_OPTIONS.map((option) => option.value)).toEqual([
      '5/5',
      '4/5',
      '3/5',
      '2/5',
      '1/5',
    ]);
  });

  it('renders an explicit fallback for an unselected rating', () => {
    expect(responseExperienceRatingLabel('')).toBe('[Not Rated]');
    expect(responseExperienceRatingLabel('2/5')).toBe('Pretty Bad');
  });
});

describe('formatResponseExperience', () => {
  it('prints only the rating and justification for a perfect score', () => {
    const state: ResponseExperienceState = {
      rating: '5/5',
      justification: 'Clear, concise and well structured.',
      expectedPoints: [{ text: 'Ignored for a perfect score' }],
      actualPoints: [{ text: 'Also ignored' }],
    };

    expect(formatResponseExperience(state)).toBe(
      ['Rating: Cannot be improved', 'Justification: Clear, concise and well structured.'].join(
        '\n',
      ),
    );
  });

  it('prints expected and actual bullets for any other rating', () => {
    const state: ResponseExperienceState = {
      rating: '4/5',
      justification: 'Good but not tight enough.',
      expectedPoints: [{ text: 'Add a one-line summary' }, { text: "Use the account's exact naming" }],
      actualPoints: [{ text: 'No summary' }, { text: 'Two naming variants used' }],
    };

    expect(formatResponseExperience(state)).toBe(
      [
        'Rating: Minor room for improvement',
        'Expected:',
        '• Add a one-line summary',
        "• Use the account's exact naming",
        '',
        'Actual:',
        '• No summary',
        '• Two naming variants used',
      ].join('\n'),
    );
  });

  it('never outputs the numeric (x/5) rating prefix', () => {
    const state: ResponseExperienceState = {
      rating: '3/5',
      justification: '',
      expectedPoints: [],
      actualPoints: [],
    };

    expect(formatResponseExperience(state)).not.toMatch(/\d\/5/);
    expect(formatResponseExperience(state)).toContain('Rating: Okay');
  });

  it('falls back to [Not Rated] while keeping the bullet sections', () => {
    const output = formatResponseExperience({
      rating: '',
      justification: '',
      expectedPoints: [{ text: 'Be concise' }],
      actualPoints: [{ text: 'Was verbose' }],
    });

    expect(output).toContain('Rating: [Not Rated]');
    expect(output).toContain('Expected:\n• Be concise');
    expect(output).toContain('Actual:\n• Was verbose');
  });
});
