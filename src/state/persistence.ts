import { isRating } from '../domain/ratings';
import type {
  AppState,
  JustificationSlice,
  RepeatableItem,
  ResponseExperienceSlice,
  SourceItem,
  TaskCompletionSlice,
} from '../domain/types';
import { createEmptyAppState } from './slices';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readItems(value: unknown): RepeatableItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry, index): RepeatableItem[] => {
    if (!isRecord(entry)) {
      return [];
    }

    return [
      {
        id: readString(entry.id) || `loaded-item-${index}`,
        value: readString(entry.value),
      },
    ];
  });
}

function readSources(value: unknown): SourceItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry, index): SourceItem[] => {
    if (!isRecord(entry)) {
      return [];
    }

    return [
      {
        id: readString(entry.id) || `loaded-source-${index}`,
        label: readString(entry.label),
        url: readString(entry.url),
      },
    ];
  });
}

function readJustification(value: unknown): JustificationSlice {
  if (!isRecord(value)) {
    return createEmptyAppState().worldFactCorrectness;
  }

  return {
    rating: isRating(value.rating) ? value.rating : null,
    conditions: readItems(value.conditions),
    sources: readSources(value.sources),
    expected: readItems(value.expected),
    actual: readItems(value.actual),
  };
}

function readTaskCompletion(value: unknown): TaskCompletionSlice {
  if (!isRecord(value)) {
    return createEmptyAppState().taskCompletion;
  }

  return {
    rating: isRating(value.rating) ? value.rating : null,
    completedTasks: readItems(value.completedTasks),
    notes: readString(value.notes),
  };
}

function readResponseExperience(value: unknown): ResponseExperienceSlice {
  if (!isRecord(value)) {
    return createEmptyAppState().responseExperience;
  }

  return {
    rating: isRating(value.rating) ? value.rating : null,
    comment: readString(value.comment),
  };
}

/** Parses persisted JSON, falling back to an empty worksheet for bad data. */
export function parseStoredState(raw: string | null): AppState | null {
  if (raw === null) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  return {
    taskCompletion: readTaskCompletion(parsed.taskCompletion),
    worldFactCorrectness: readJustification(parsed.worldFactCorrectness),
    accountFactuality: readJustification(parsed.accountFactuality),
    responseExperience: readResponseExperience(parsed.responseExperience),
  };
}

export function serializeState(state: AppState): string {
  return JSON.stringify(state);
}
