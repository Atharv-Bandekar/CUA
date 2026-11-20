/**
 * Task completion domain: rating options and the compiled output block.
 * Pure TypeScript only — no React, DOM or browser APIs.
 */
import { type RatingOption, ratingOptionLabel, ratingOptions } from './ratingOptions';

export type TaskCompletionRating = '1/5' | '2/5' | '3/5' | '4/5' | '5/5';

/** Stored value → output text. The (x/5) prefix is never printed. */
export const TASK_COMPLETION_RATINGS: Record<TaskCompletionRating, string> = {
  '5/5': 'Fully Complete',
  '4/5': 'Mostly Complete',
  '3/5': 'Partially Complete',
  '2/5': 'Minimally Complete',
  '1/5': 'Not at all Complete',
};

const TASK_COMPLETION_ORDER: readonly TaskCompletionRating[] = ['5/5', '4/5', '3/5', '2/5', '1/5'];

export const TASK_COMPLETION_OPTIONS: readonly RatingOption<TaskCompletionRating>[] = ratingOptions(
  TASK_COMPLETION_RATINGS,
  TASK_COMPLETION_ORDER,
);

export interface TaskCompletionCondition {
  text: string;
  status: TaskCompletionRating | '';
}

export interface TaskCompletionState {
  mainGoal: string;
  mainGoalStatus: TaskCompletionRating | '';
  conditions: TaskCompletionCondition[];
  finalRating: TaskCompletionRating | '';
  justification: string;
}

export function taskCompletionRatingLabel(rating: TaskCompletionRating | ''): string {
  return ratingOptionLabel(TASK_COMPLETION_RATINGS, rating);
}

/**
 * Compiles the task completion block. Conditions are numbered from their array
 * index (`index + 1`), so inserting or removing a row renumbers the rest.
 */
export function formatTaskCompletion(state: TaskCompletionState): string {
  const blocks: string[] = [
    `Main Goal fulfilled? (${state.mainGoal}): ${taskCompletionRatingLabel(state.mainGoalStatus)}`,
    ...state.conditions.map(
      (condition, index) =>
        `Condition ${index + 1} (${condition.text}): ${taskCompletionRatingLabel(condition.status)}`,
    ),
    [
      `Final Rating: ${taskCompletionRatingLabel(state.finalRating)}`,
      `Justification: ${state.justification}`,
    ].join('\n'),
  ];

  return blocks.join('\n\n');
}
