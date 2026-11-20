import { describe, expect, it } from 'vitest';
import {
  TASK_COMPLETION_OPTIONS,
  TASK_COMPLETION_RATINGS,
  formatTaskCompletion,
  taskCompletionRatingLabel,
} from '../../src/domain/taskCompletion';
import type { TaskCompletionState } from '../../src/domain/taskCompletion';

const state: TaskCompletionState = {
  mainGoal: 'Close all Q3 tickets',
  mainGoalStatus: '5/5',
  conditions: [
    { text: 'Check revenue figures', status: '4/5' },
    { text: 'Review churn notes', status: '3/5' },
  ],
  finalRating: '5/5',
  justification: 'All tickets closed and verified.',
};

describe('task completion rating options', () => {
  it('maps every scale position to its output text', () => {
    expect(TASK_COMPLETION_RATINGS).toEqual({
      '5/5': 'Fully Complete',
      '4/5': 'Mostly Complete',
      '3/5': 'Partially Complete',
      '2/5': 'Minimally Complete',
      '1/5': 'Not at all Complete',
    });
  });

  it('exposes options best-first for the UI', () => {
    expect(TASK_COMPLETION_OPTIONS).toEqual([
      { value: '5/5', label: 'Fully Complete' },
      { value: '4/5', label: 'Mostly Complete' },
      { value: '3/5', label: 'Partially Complete' },
      { value: '2/5', label: 'Minimally Complete' },
      { value: '1/5', label: 'Not at all Complete' },
    ]);
  });

  it('renders an explicit fallback for an unselected rating', () => {
    expect(taskCompletionRatingLabel('')).toBe('[Not Rated]');
    expect(taskCompletionRatingLabel('2/5')).toBe('Minimally Complete');
  });
});

describe('formatTaskCompletion', () => {
  it('compiles the main goal, numbered conditions, rating and justification', () => {
    expect(formatTaskCompletion(state)).toBe(
      [
        'Main Goal fulfilled? (Close all Q3 tickets): Fully Complete',
        '',
        'Condition 1 (Check revenue figures): Mostly Complete',
        '',
        'Condition 2 (Review churn notes): Partially Complete',
        '',
        'Final Rating: Fully Complete',
        'Justification: All tickets closed and verified.',
      ].join('\n'),
    );
  });

  it('re-numbers conditions from the array index', () => {
    const output = formatTaskCompletion({
      ...state,
      conditions: [
        { text: 'First', status: '5/5' },
        { text: 'Second', status: '4/5' },
        { text: 'Third', status: '2/5' },
      ],
    });

    expect(output).toContain('Condition 1 (First): Fully Complete');
    expect(output).toContain('Condition 3 (Third): Minimally Complete');
    expect(output).not.toContain('Condition 4');
  });

  it('never outputs the numeric (x/5) rating prefix', () => {
    const output = formatTaskCompletion(state);
    expect(output).not.toMatch(/\d\/5/);
  });

  it('renders unselected statuses and rating as [Not Rated]', () => {
    const output = formatTaskCompletion({
      mainGoal: 'Draft the summary',
      mainGoalStatus: '',
      conditions: [{ text: 'Gather inputs', status: '' }],
      finalRating: '',
      justification: '',
    });

    expect(output).toBe(
      [
        'Main Goal fulfilled? (Draft the summary): [Not Rated]',
        '',
        'Condition 1 (Gather inputs): [Not Rated]',
        '',
        'Final Rating: [Not Rated]',
        'Justification: ',
      ].join('\n'),
    );
  });
});
