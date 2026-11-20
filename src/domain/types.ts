/**
 * Domain types. Pure TypeScript only — no React, DOM or browser APIs.
 */

/** Five-point rating shared by every review scale. */
export type Rating = 1 | 2 | 3 | 4 | 5;

/** Labels for each position on a five-point scale. */
export type RatingScaleLabels = Record<Rating, string>;

/** A single editable bullet (condition, expected value, actual value, task). */
export interface RepeatableItem {
  id: string;
  value: string;
}

/** A citation backing a world-fact or account-fact check. */
export interface SourceItem {
  id: string;
  label: string;
  url: string;
}

/** Task completion slice: how much of the assigned work was delivered. */
export interface TaskCompletionSlice {
  rating: Rating | null;
  completedTasks: RepeatableItem[];
  notes: string;
}

/** Shared evidence shape for the two justification builders. */
export interface JustificationSlice {
  rating: Rating | null;
  conditions: RepeatableItem[];
  sources: SourceItem[];
  expected: RepeatableItem[];
  actual: RepeatableItem[];
}

/** Response experience slice: quality of the written answer itself. */
export interface ResponseExperienceSlice {
  rating: Rating | null;
  comment: string;
}

/** Full worksheet state, one key per persisted slice. */
export interface AppState {
  taskCompletion: TaskCompletionSlice;
  worldFactCorrectness: JustificationSlice;
  accountFactuality: JustificationSlice;
  responseExperience: ResponseExperienceSlice;
}

/** The two sections that share the parameterised justification builder. */
export type JustificationSliceKey = 'worldFactCorrectness' | 'accountFactuality';
