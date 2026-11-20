import { describe, expect, it } from 'vitest';
import { formatFinalSummary } from '../../src/domain/finalSummary';
import type { FinalSummaryInput } from '../../src/domain/finalSummary';

const input: FinalSummaryInput = {
  taskCompletion: { finalRating: '4/5' },
  worldFactCorrectness: { finalRating: '5/5' },
  accountFactuality: { finalRating: '3/5' },
  responseExperience: { rating: '3/5' },
};

describe('formatFinalSummary', () => {
  it('compiles the four output labels under response A by default', () => {
    expect(formatFinalSummary(input)).toBe(
      [
        'Response A Scores:',
        '- Task Completion: Mostly Complete',
        '- World Fact Correctness: Completely Accurate',
        '- Account Factuality: Mixed Accuracy',
        '- Response Experience: Okay',
      ].join('\n'),
    );
  });

  it('supports the B response label', () => {
    expect(formatFinalSummary(input, 'B')).toBe(
      [
        'Response B Scores:',
        '- Task Completion: Mostly Complete',
        '- World Fact Correctness: Completely Accurate',
        '- Account Factuality: Mixed Accuracy',
        '- Response Experience: Okay',
      ].join('\n'),
    );
  });

  it('falls back to [Not Rated] for every unselected section', () => {
    const output = formatFinalSummary({
      taskCompletion: { finalRating: '' },
      worldFactCorrectness: { finalRating: '' },
      accountFactuality: { finalRating: '' },
      responseExperience: { rating: '' },
    });

    expect(output).toBe(
      [
        'Response A Scores:',
        '- Task Completion: [Not Rated]',
        '- World Fact Correctness: [Not Rated]',
        '- Account Factuality: [Not Rated]',
        '- Response Experience: [Not Rated]',
      ].join('\n'),
    );
  });

  it('never outputs numeric (x/5) rating prefixes', () => {
    expect(formatFinalSummary(input)).not.toMatch(/\d\/5/);
  });
});
