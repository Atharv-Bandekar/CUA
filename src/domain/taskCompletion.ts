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
  /**
   * How many characters of the typed justification come before this issue's
   * line. New issues are recorded after the text that already exists, so the
   * field reads as one chronological flow instead of every new issue jumping
   * above what was written.
   */
  at: number;
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

/** Appends text to the field, keeping generated lines and typed text on separate rows. */
function appendFieldText(out: string, text: string): string {
  if (text === '') {
    return out;
  }

  if (out !== '' && !out.endsWith('\n') && !text.startsWith('\n')) {
    return `${out}\n${text}`;
  }

  return `${out}${text}`;
}

/**
 * Value of the justification field. With a combined justification each issue
 * line is spliced into the typed text at its own position, so the field reads
 * as the sequence the reviewer built — an issue added after some text lands
 * below that text. With a separate list the field holds the typed text only.
 */
export function justificationFieldText(
  issues: readonly InfrastructureIssue[],
  typed: string,
  separateList: boolean,
): string {
  if (separateList) {
    return typed;
  }

  let out = '';
  let cursor = 0;
  let placed = false;

  for (const issue of issues) {
    const line = formatInfrastructureIssue(issue);

    if (line === '') {
      continue;
    }

    const at = Math.min(Math.max(issue.at, cursor), typed.length);
    out = appendFieldText(out, typed.slice(cursor, at));
    out = appendFieldText(out, line);
    cursor = at;
    placed = true;
  }

  const rest = typed.slice(cursor);
  out = appendFieldText(out, rest);

  // An issue line that ends the field keeps a trailing newline, so typing
  // straight after it starts on a fresh line instead of gluing onto it.
  return placed && rest === '' ? `${out}\n` : out;
}

export interface JustificationDraft {
  /** Text the reviewer typed, with the generated issue lines removed. */
  typed: string;
  /** The issues, with their positions re-read from the field. */
  issues: InfrastructureIssue[];
}

/** The newline between a generated line and its neighbours is ours, not typed. */
function dropLeadingNewline(text: string): string {
  return text.startsWith('\n') ? text.slice(1) : text;
}

/** A typed segment loses the generated newline on either side of an issue line. */
function trimSeparators(text: string): string {
  const trimmed = dropLeadingNewline(text);
  return trimmed.endsWith('\n') ? trimmed.slice(0, -1) : trimmed;
}

/** Index of the line starting with `line` at or after `from`, or -1. */
function findLine(value: string, line: string, from: number): number {
  let index = from;

  while (index <= value.length) {
    const end = value.indexOf('\n', index);
    const lineEnd = end === -1 ? value.length : end;

    if (value.slice(index, lineEnd) === line) {
      return index;
    }

    if (end === -1) {
      return -1;
    }

    index = end + 1;
  }

  return -1;
}

/**
 * Inverse of `justificationFieldText`: finds each generated issue line in the
 * field, removes it, and records where it sat so the remaining typed text and
 * the issue order stay exactly as the reviewer left them.
 */
export function justificationDraft(
  fieldValue: string,
  issues: readonly InfrastructureIssue[],
  separateList: boolean,
): JustificationDraft {
  if (separateList) {
    return { typed: fieldValue, issues: [...issues] };
  }

  const next: InfrastructureIssue[] = [];
  let typed = '';
  let cursor = 0;

  for (const issue of issues) {
    const line = formatInfrastructureIssue(issue);

    if (line === '') {
      next.push({ ...issue });
      continue;
    }

    const found = findLine(fieldValue, line, cursor);

    if (found === -1) {
      // The reviewer removed the generated line itself; the row keeps its place
      // and the line comes back on the next render.
      next.push({ ...issue });
      continue;
    }

    typed += trimSeparators(fieldValue.slice(cursor, found));
    next.push({ ...issue, at: typed.length });
    cursor = found + line.length;
  }

  typed += dropLeadingNewline(fieldValue.slice(cursor));

  return { typed, issues: next };
}

/**
 * Compiles the task completion block. Conditions are numbered from their array
 * index (`index + 1`), so inserting or removing a row renumbers the rest. Goal
 * and condition statuses print as Yes / No, while the final rating prints its
 * scale label. Infrastructure issues either sit inside the justification text
 * in the order the reviewer built it, or follow it as their own bulleted block,
 * depending on the separate-list answer. The folded text is the field value
 * itself, so the output matches what the reviewer sees.
 */
export function formatTaskCompletion(state: TaskCompletionState): string {
  const issueLines = infrastructureIssueLines(state.infrastructureIssues);
  const separateIssues = state.separateInfrastructureList && issueLines.length > 0;
  const folded = justificationFieldText(
    state.infrastructureIssues,
    state.justification,
    state.separateInfrastructureList,
  );

  const justificationText = (separateIssues ? [state.justification.trim()] : [folded.trim()])
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
