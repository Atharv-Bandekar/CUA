/**
 * Framework-agnostic reactive store. No React imports belong in this layer.
 */
import type {
  AppState,
  JustificationSlice,
  JustificationSliceKey,
  ResponseExperienceSlice,
  TaskCompletionSlice,
} from '../domain/types';
import { parseStoredState, serializeState } from './persistence';
import { createEmptyAppState } from './slices';
import { STORAGE_KEY, getDefaultStorage, type StorageLike } from './storage';

/** How long the undo action stays available after clearAll(). */
export const UNDO_WINDOW_MS = 5_000;

export interface UndoState {
  active: boolean;
  expiresAt: number | null;
}

export interface AppStore {
  getState(): AppState;
  getUndoState(): UndoState;
  subscribe(listener: (state: AppState) => void): () => void;
  updateTaskCompletion(patch: Partial<TaskCompletionSlice>): void;
  updateJustification(slice: JustificationSliceKey, patch: Partial<JustificationSlice>): void;
  updateResponseExperience(patch: Partial<ResponseExperienceSlice>): void;
  clearAll(): void;
  undoClear(): boolean;
}

export interface AppStoreOptions {
  /** Defaults to localStorage when present; pass null to disable persistence. */
  storage?: StorageLike | null;
  now?: () => number;
  schedule?: (callback: () => void, delayMs: number) => number;
  cancelSchedule?: (handle: number) => void;
}

export function createAppStore(options: AppStoreOptions = {}): AppStore {
  const storage: StorageLike | null =
    options.storage === undefined ? getDefaultStorage() : options.storage;
  const now = options.now ?? (() => Date.now());
  const schedule =
    options.schedule ?? ((callback: () => void, delayMs: number) => setTimeout(callback, delayMs));
  const cancelSchedule = options.cancelSchedule ?? ((handle: number) => clearTimeout(handle));

  const listeners = new Set<(state: AppState) => void>();

  let state: AppState =
    parseStoredState(storage === null ? null : storage.getItem(STORAGE_KEY)) ??
    createEmptyAppState();
  let undoSnapshot: AppState | null = null;
  let undoExpiresAt: number | null = null;
  let undoHandle: number | null = null;

  function notify(): void {
    for (const listener of listeners) {
      listener(state);
    }
  }

  function persist(): void {
    if (storage !== null) {
      storage.setItem(STORAGE_KEY, serializeState(state));
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

  function commit(next: AppState): void {
    dropUndo();
    state = next;
    persist();
    notify();
  }

  function getState(): AppState {
    return state;
  }

  function getUndoState(): UndoState {
    if (undoSnapshot === null || undoExpiresAt === null || now() >= undoExpiresAt) {
      return { active: false, expiresAt: null };
    }

    return { active: true, expiresAt: undoExpiresAt };
  }

  function subscribe(listener: (state: AppState) => void): () => void {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  function updateTaskCompletion(patch: Partial<TaskCompletionSlice>): void {
    commit({ ...state, taskCompletion: { ...state.taskCompletion, ...patch } });
  }

  function updateJustification(
    slice: JustificationSliceKey,
    patch: Partial<JustificationSlice>,
  ): void {
    const next: AppState =
      slice === 'worldFactCorrectness'
        ? {
            ...state,
            worldFactCorrectness: { ...state.worldFactCorrectness, ...patch },
          }
        : {
            ...state,
            accountFactuality: { ...state.accountFactuality, ...patch },
          };

    commit(next);
  }

  function updateResponseExperience(patch: Partial<ResponseExperienceSlice>): void {
    commit({ ...state, responseExperience: { ...state.responseExperience, ...patch } });
  }

  function clearAll(): void {
    clearUndoTimer();
    undoSnapshot = state;
    undoExpiresAt = now() + UNDO_WINDOW_MS;
    state = createEmptyAppState();
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

  return {
    getState,
    getUndoState,
    subscribe,
    updateTaskCompletion,
    updateJustification,
    updateResponseExperience,
    clearAll,
    undoClear,
  };
}

/** Singleton used by the UI. */
export const appStore = createAppStore();
