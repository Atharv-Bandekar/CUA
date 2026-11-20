/**
 * Shared helpers for the string-based output rating scales.
 * Pure TypeScript only — no React, DOM or browser APIs.
 */

export const NOT_RATED = '[Not Rated]';

export interface RatingOption<T extends string> {
  /** Stored scale value, e.g. "5/5". Never printed. */
  value: T;
  /** Human output text, e.g. "Fully Complete". */
  label: string;
}

/** Builds a best-first option list for a UI select. */
export function ratingOptions<T extends string>(
  labels: Record<T, string>,
  order: readonly T[],
): readonly RatingOption<T>[] {
  return order.map((value) => ({ value, label: labels[value] }));
}

/** Output text for a stored rating, or the explicit fallback when unselected. */
export function ratingOptionLabel<T extends string>(
  labels: Record<T, string>,
  value: T | '',
): string {
  return value === '' ? NOT_RATED : labels[value];
}
