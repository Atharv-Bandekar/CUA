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

/**
 * Stored value → output text for the Yes / No goal and condition pills. The
 * full scale is mapped so persisted legacy values stay printable.
 */
export const TASK_COMPLETION_STATUS_RATINGS: Record<TaskCompletionRating, string> = {
  '5/5': 'Yes',
  '4/5': 'Yes',
  '3/5': 'Partial',
  '2/5': 'No',
  '1/5': 'No',
};

const TASK_COMPLETION_STATUS_ORDER: readonly TaskCompletionRating[] = ['5/5', '1/5'];

export const TASK_COMPLETION_STATUSES: readonly RatingOption<TaskCompletionRating>[] =
  ratingOptions(TASK_COMPLETION_STATUS_RATINGS, TASK_COMPLETION_STATUS_ORDER);

export interface TaskCompletionCondition {
  text: string;
  status: TaskCompletionRating | '';
}

export interface InfrastructureIssue {
  /** Text after "Agent tries to". */
  action: string;
  /** Text after "but". */
  failure: string;
}

export interface TaskCompletionState {
  mainGoal: string;
  mainGoalStatus: TaskCompletionRating | '';
  conditions: TaskCompletionCondition[];
  finalRating: TaskCompletionRating | '';
  justification: string;
  /**
   * true prints the issues as their own bulleted block below the justification;
   * false folds them into the justification text itself.
   */
  separateInfrastructureList: boolean;
  infrastructureIssues: InfrastructureIssue[];
}

/** Heading printed above the standalone issue list. */
export const INFRASTRUCTURE_ISSUES_HEADING = 'Infrastructure/tool call issues:';

export function taskCompletionRatingLabel(rating: TaskCompletionRating | ''): string {
  return ratingOptionLabel(TASK_COMPLETION_RATINGS, rating);
}

/** Yes / No text for the main goal and condition statuses. */
export function taskCompletionStatusLabel(status: TaskCompletionRating | ''): string {
  return ratingOptionLabel(TASK_COMPLETION_STATUS_RATINGS, status);
}

/**
 * `Agent tries to <action> but <failure>`. The label words are fixed; blank
 * slots are dropped so a half-filled row never prints doubled spaces. A row
 * where both fields are empty renders as an empty string and is not printed.
 */
export function formatInfrastructureIssue(issue: InfrastructureIssue): string {
  const action = issue.action.trim();
  const failure = issue.failure.trim();

  if (action === '' && failure === '') {
    return '';
  }

  return ['Agent tries to', action, 'but', failure].filter((part) => part !== '').join(' ');
}

/**
 * Printable `Agent tries to … but …` lines, in row order. Empty rows are
 * dropped so numbering never leaves a hole in the output.
 */
export function infrastructureIssueLines(issues: readonly InfrastructureIssue[]): string[] {
  return issues.map(formatInfrastructureIssue).filter((line) => line !== '');
}

/**
 * Value of the justification field. With a combined justification the issue
 * lines are shown inside the field above the typed text, so the reviewer sees
 * exactly the order the output prints; with a separate list the field holds the
 * typed text only.
 */
export function justificationFieldText(
  issues: readonly InfrastructureIssue[],
  typed: string,
  separateList: boolean,
): string {
  const lines = separateList ? [] : infrastructureIssueLines(issues);

  if (lines.length === 0) {
    return typed;
  }

  // The typed text always starts on its own line, so pressing Enter at the end
  // of the generated issue lines starts a new line instead of being swallowed.
  return `${lines.join('\n')}\n${typed}`;
}

/**
 * Inverse of `justificationFieldText`: drops the generated issue lines the field
 * starts with, leaving the text the reviewer typed. Lines are compared one by
 * one so an edit further down the field never loses typed text.
 */
export function typedJustification(
  fieldValue: string,
  issues: readonly InfrastructureIssue[],
  separateList: boolean,
): string {
  const lines = separateList ? [] : infrastructureIssueLines(issues);

  if (lines.length === 0) {
    return fieldValue;
  }

  const parts = fieldValue.split('\n');
  let generated = 0;

  while (generated < lines.length && parts[generated] === lines[generated]) {
    generated += 1;
  }

  return parts.slice(generated).join('\n');
}

/**
 * Compiles the task completion block. Conditions are numbered from their array
 * index (`index + 1`), so inserting or removing a row renumbers the rest. Goal
 * and condition statuses print as Yes / No, while the final rating prints its
 * scale label. Infrastructure issues either open the justification text or
 * follow it as their own bulleted block, depending on the separate-list answer.
 * A combined justification keeps the issues first, so the order matches the
 * order the issues were recorded in before the justification was written.
 */
export function formatTaskCompletion(state: TaskCompletionState): string {
  const issueLines = infrastructureIssueLines(state.infrastructureIssues);
  const separateIssues = state.separateInfrastructureList && issueLines.length > 0;

  const justificationText = (separateIssues ? [state.justification.trim()] : [
    ...issueLines,
    state.justification.trim(),
  ])
    .filter((part) => part !== '')
    .join('\n');

  const blocks: string[] = [
    `Main Goal fulfilled? (${state.mainGoal}): ${taskCompletionStatusLabel(state.mainGoalStatus)}`,
    ...state.conditions.map(
      (condition, index) =>
        `Condition ${index + 1} (${condition.text}): ${taskCompletionStatusLabel(condition.status)}`,
    ),
    [
      `Final Rating: ${taskCompletionRatingLabel(state.finalRating)}`,
      `Justification: ${justificationText}`,
    ].join('\n'),
  ];

  if (separateIssues) {
    blocks.push(
      [INFRASTRUCTURE_ISSUES_HEADING, ...issueLines.map((line) => `• ${line}`)].join('\n'),
    );
  }

  return blocks.join('\n\n');
}
