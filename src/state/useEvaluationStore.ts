/**
 * Global evaluation store for the five-tab worksheet. Persists to
 * localStorage and exposes a 5-second undo for Clear All.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  FACTUALITY_OPTIONS,
  type Claim,
  type ClaimAccuracy,
  type ClaimClassification,
  type ClaimSource,
  type FactualAccuracyState,
  type FactualityRating,
} from '../domain/factualAccuracy';
import {
  RESPONSE_EXPERIENCE_OPTIONS,
  type ResponseExperiencePoint,
  type ResponseExperienceRating,
  type ResponseExperienceState,
} from '../domain/responseExperience';
import {
  TASK_COMPLETION_OPTIONS,
  type TaskCompletionCondition,
  type TaskCompletionRating,
  type TaskCompletionState,
} from '../domain/taskCompletion';
import { getDefaultStorage, type StorageLike } from './storage';

export const EVALUATION_STORAGE_KEY = 'ba.evaluation.v1';
export const UNDO_WINDOW_MS = 5_000;

export type FactualitySectionKey = 'worldFactCorrectness' | 'accountFactuality';

export interface EvaluationState {
  taskCompletion: TaskCompletionState;
  worldFactCorrectness: FactualAccuracyState;
  accountFactuality: FactualAccuracyState;
  responseExperience: ResponseExperienceState;
}

export interface UndoState {
  active: boolean;
  expiresAt: number | null;
}

export interface EvaluationStore {
  getState(): EvaluationState;
  getUndoState(): UndoState;
  subscribe(listener: (state: EvaluationState) => void): () => void;
  updateTaskCompletion(patch: Partial<TaskCompletionState>): void;
  updateFactuality(section: FactualitySectionKey, patch: Partial<FactualAccuracyState>): void;
  updateResponseExperience(patch: Partial<ResponseExperienceState>): void;
  clearAll(): void;
  undoClear(): boolean;
  /** Drops the undo snapshot and returns to an empty worksheet (test/dev). */
  reset(): void;
}

export interface EvaluationStoreOptions {
  storage?: StorageLike | null;
  now?: () => number;
  schedule?: (callback: () => void, delayMs: number) => number;
  cancelSchedule?: (handle: number) => void;
}

export function createEmptyTaskCompletionState(): TaskCompletionState {
  return {
    mainGoal: '',
    mainGoalStatus: '',
    conditions: [],
    finalRating: '',
    justification: '',
  };
}

export function createEmptyFactualAccuracyState(): FactualAccuracyState {
  return {
    claims: [],
    finalRating: '',
    finalJustification: '',
  };
}

export function createEmptyResponseExperienceState(): ResponseExperienceState {
  return {
    rating: '',
    justification: '',
    expectedPoints: [],
    actualPoints: [],
  };
}

export function createEmptyEvaluationState(): EvaluationState {
  return {
    taskCompletion: createEmptyTaskCompletionState(),
    worldFactCorrectness: createEmptyFactualAccuracyState(),
    accountFactuality: createEmptyFactualAccuracyState(),
    responseExperience: createEmptyResponseExperienceState(),
  };
}

const TASK_COMPLETION_VALUES: readonly TaskCompletionRating[] = TASK_COMPLETION_OPTIONS.map(
  (option) => option.value,
);
const FACTUALITY_VALUES: readonly FactualityRating[] = FACTUALITY_OPTIONS.map(
  (option) => option.value,
);
const RESPONSE_EXPERIENCE_VALUES: readonly ResponseExperienceRating[] =
  RESPONSE_EXPERIENCE_OPTIONS.map((option) => option.value);

const CLASSIFICATIONS: readonly ClaimClassification[] = ['Objective', 'Subjective'];
const ACCURACIES: readonly ClaimAccuracy[] = [
  'Accurate',
  'Inaccurate',
  'Partially Accurate',
  'Cannot Confidently Assess',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function readSources(value: unknown): ClaimSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry): ClaimSource[] =>
    isRecord(entry) ? [{ text: readString(entry.text) }] : [],
  );
}

function readClaims(value: unknown): Claim[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry): Claim[] => {
    if (!isRecord(entry)) {
      return [];
    }

    return [
      {
        text: readString(entry.text),
        classification: isOneOf(entry.classification, CLASSIFICATIONS)
          ? entry.classification
          : '',
        accuracy: isOneOf(entry.accuracy, ACCURACIES) ? entry.accuracy : '',
        justification: readString(entry.justification),
        sources: readSources(entry.sources),
      },
    ];
  });
}

function readConditions(value: unknown): TaskCompletionCondition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry): TaskCompletionCondition[] => {
    if (!isRecord(entry)) {
      return [];
    }

    return [
      {
        text: readString(entry.text),
        status: isOneOf(entry.status, TASK_COMPLETION_VALUES) ? entry.status : '',
      },
    ];
  });
}

function readTaskCompletion(value: unknown): TaskCompletionState {
  if (!isRecord(value)) {
    return createEmptyTaskCompletionState();
  }

  return {
    mainGoal: readString(value.mainGoal),
    mainGoalStatus: isOneOf(value.mainGoalStatus, TASK_COMPLETION_VALUES)
      ? value.mainGoalStatus
      : '',
    conditions: readConditions(value.conditions),
    finalRating: isOneOf(value.finalRating, TASK_COMPLETION_VALUES) ? value.finalRating : '',
    justification: readString(value.justification),
  };
}

function readFactualAccuracy(value: unknown): FactualAccuracyState {
  if (!isRecord(value)) {
    return createEmptyFactualAccuracyState();
  }

  return {
    claims: readClaims(value.claims),
    finalRating: isOneOf(value.finalRating, FACTUALITY_VALUES) ? value.finalRating : '',
    finalJustification: readString(value.finalJustification),
  };
}

function readPoints(value: unknown): ResponseExperiencePoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry): ResponseExperiencePoint[] =>
    isRecord(entry) ? [{ text: readString(entry.text) }] : [],
  );
}

function readResponseExperience(value: unknown): ResponseExperienceState {
  if (!isRecord(value)) {
    return createEmptyResponseExperienceState();
  }

  return {
    rating: isOneOf(value.rating, RESPONSE_EXPERIENCE_VALUES) ? value.rating : '',
    justification: readString(value.justification),
    expectedPoints: readPoints(value.expectedPoints),
    actualPoints: readPoints(value.actualPoints),
  };
}

function parseStoredEvaluation(raw: string | null): EvaluationState | null {
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
    worldFactCorrectness: readFactualAccuracy(parsed.worldFactCorrectness),
    accountFactuality: readFactualAccuracy(parsed.accountFactuality),
    responseExperience: readResponseExperience(parsed.responseExperience),
  };
}

export function createEvaluationStore(options: EvaluationStoreOptions = {}): EvaluationStore {
  const storage: StorageLike | null =
    options.storage === undefined ? getDefaultStorage() : options.storage;
  const now = options.now ?? (() => Date.now());
  const schedule =
    options.schedule ?? ((callback: () => void, delayMs: number) => setTimeout(callback, delayMs));
  const cancelSchedule = options.cancelSchedule ?? ((handle: number) => clearTimeout(handle));

  const listeners = new Set<(state: EvaluationState) => void>();

  let state: EvaluationState =
    parseStoredEvaluation(storage === null ? null : storage.getItem(EVALUATION_STORAGE_KEY)) ??
    createEmptyEvaluationState();
  let undoSnapshot: EvaluationState | null = null;
  let undoExpiresAt: number | null = null;
  let undoHandle: number | null = null;

  function notify(): void {
    for (const listener of listeners) {
      listener(state);
    }
  }

  function persist(): void {
    if (storage !== null) {
      storage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(state));
    }
  }

  function clearUndoTimer(): void {
    if (undoHandle !== null) {
      cancelSchedule(undoHandle);
      undoHandle = null;
    }
  }

  function dropUndo(): void {
    clearUndoTimer();
    undoSnapshot = null;
    undoExpiresAt = null;
  }

  function getState(): EvaluationState {
    return state;
  }

  function getUndoState(): UndoState {
    if (undoSnapshot === null || undoExpiresAt === null || now() >= undoExpiresAt) {
      return { active: false, expiresAt: null };
    }

    return { active: true, expiresAt: undoExpiresAt };
  }

  function subscribe(listener: (state: EvaluationState) => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function commit(next: EvaluationState): void {
    dropUndo();
    state = next;
    persist();
    notify();
  }

  function updateTaskCompletion(patch: Partial<TaskCompletionState>): void {
    commit({ ...state, taskCompletion: { ...state.taskCompletion, ...patch } });
  }

  function updateFactuality(
    section: FactualitySectionKey,
    patch: Partial<FactualAccuracyState>,
  ): void {
    if (section === 'worldFactCorrectness') {
      commit({
        ...state,
        worldFactCorrectness: { ...state.worldFactCorrectness, ...patch },
      });
      return;
    }

    commit({
      ...state,
      accountFactuality: { ...state.accountFactuality, ...patch },
    });
  }

  function updateResponseExperience(patch: Partial<ResponseExperienceState>): void {
    commit({ ...state, responseExperience: { ...state.responseExperience, ...patch } });
  }

  function clearAll(): void {
    clearUndoTimer();
    undoSnapshot = state;
    undoExpiresAt = now() + UNDO_WINDOW_MS;
    state = createEmptyEvaluationState();
    persist();
    notify();

    undoHandle = schedule(() => {
      undoHandle = null;
      undoSnapshot = null;
      undoExpiresAt = null;
      notify();
    }, UNDO_WINDOW_MS);
  }

  function undoClear(): boolean {
    if (undoSnapshot === null || undoExpiresAt === null || now() >= undoExpiresAt) {
      dropUndo();
      return false;
    }

    const restored = undoSnapshot;
    dropUndo();
    state = restored;
    persist();
    notify();
    return true;
  }

  function reset(): void {
    dropUndo();
    state = createEmptyEvaluationState();
    persist();
    notify();
  }

  return {
    getState,
    getUndoState,
    subscribe,
    updateTaskCompletion,
    updateFactuality,
    updateResponseExperience,
    clearAll,
    undoClear,
    reset,
  };
}

export const evaluationStore = createEvaluationStore();

export function useEvaluationStore(): EvaluationState {
  return useSyncExternalStore(
    evaluationStore.subscribe,
    evaluationStore.getState,
    evaluationStore.getState,
  );
}

/** Subscribes the undo toast to the store's 5-second window. */
export function useUndoState(): UndoState {
  const [undo, setUndo] = useState<UndoState>(() => evaluationStore.getUndoState());

  useEffect(() => evaluationStore.subscribe(() => setUndo(evaluationStore.getUndoState())), []);

  return undo;
}
