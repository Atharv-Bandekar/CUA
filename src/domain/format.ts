/**
 * String formatting. Pure TypeScript only — no React, DOM or browser APIs.
 */
import { ratingLabel } from './ratings';
import type {
  JustificationSlice,
  Rating,
  RatingScaleLabels,
  RepeatableItem,
  SourceItem,
} from './types';

export const EMPTY_VALUE = '—';

const LIST_SEPARATOR = '; ';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatItemList(items: readonly RepeatableItem[]): string {
  const values = items
    .map((item) => item.value.trim())
    .filter((value) => value.length > 0);

  return values.length > 0 ? values.join(LIST_SEPARATOR) : EMPTY_VALUE;
}

function formatSource(source: SourceItem): string {
  const label = source.label.trim();
  const url = source.url.trim();

  if (label.length > 0 && url.length > 0) {
    return `${label} (${url})`;
  }

  if (label.length > 0) {
    return label;
  }

  return url.length > 0 ? url : '';
}

function formatSourceList(sources: readonly SourceItem[]): string {
  const values = sources.map(formatSource).filter((value) => value.length > 0);
  return values.length > 0 ? values.join(LIST_SEPARATOR) : EMPTY_VALUE;
}

/** Renders the scale position, e.g. "4 / 5". */
export function formatRating(rating: Rating | null): string {
  return rating === null ? EMPTY_VALUE : `${rating} / 5`;
}

/** Rounds to a whole percent, e.g. "42%". */
export function formatPercent(value: number): string {
  return Number.isFinite(value) ? `${Math.round(value)}%` : EMPTY_VALUE;
}

/** Trims and truncates text, appending an ellipsis inside the limit. */
export function truncateText(text: string, maxLength: number): string {
  if (maxLength <= 0) {
    return '';
  }

  const trimmed = text.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

/** "1 condition", "0 conditions", "2 sources". */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Countdown label for the 5-second undo period, rounded up to whole seconds. */
export function formatSecondsRemaining(remainingMs: number): string {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return '0s';
  }

  return `${Math.ceil(remainingMs / 1000)}s`;
}

/** ISO timestamp as "YYYY-MM-DD HH:mm UTC", or an em dash when invalid. */
export function formatUtcDateTime(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return EMPTY_VALUE;
  }

  return [
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`,
  ].join(' ');
}

/** Plain-text summary of a justification section for the clipboard. */
export function formatJustificationSummary(
  title: string,
  draft: JustificationSlice,
  scale: RatingScaleLabels,
): string {
  const label = draft.rating === null ? '' : ` · ${ratingLabel(draft.rating, scale)}`;

  return [
    `${title} ${EMPTY_VALUE} ${formatRating(draft.rating)}${label}`,
    `Conditions: ${formatItemList(draft.conditions)}`,
    `Sources: ${formatSourceList(draft.sources)}`,
    `Expected: ${formatItemList(draft.expected)}`,
    `Actual: ${formatItemList(draft.actual)}`,
  ].join('\n');
}
