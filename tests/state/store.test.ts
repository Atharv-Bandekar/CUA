import { describe, expect, it, vi } from 'vitest';
import { UNDO_WINDOW_MS, createAppStore } from '../../src/state/appStore';
import { STORAGE_KEY } from '../../src/state/storage';
import type { StorageLike } from '../../src/state/storage';

interface MemoryStorage extends StorageLike {
  entries: Map<string, string>;
}

function createMemoryStorage(initial: Record<string, string> = {}): MemoryStorage {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}

function createTestStore(storage: MemoryStorage = createMemoryStorage()) {
  const clock = { value: 1_000 };
  const schedule = vi.fn((_fn: () => void, _ms: number) => 0);
  const store = createAppStore({
    storage,
    now: () => clock.value,
    schedule,
    cancelSchedule: () => undefined,
  });

  return {
    store,
    storage,
    clock,
    schedule,
    advance: (ms: number) => {
      clock.value += ms;
    },
  };
}

describe('createAppStore', () => {
  it('starts with four empty slices', () => {
    const { store } = createTestStore();
    const state = store.getState();

    expect(state.taskCompletion).toEqual({ rating: null, completedTasks: [], notes: '' });
    expect(state.worldFactCorrectness.conditions).toEqual([]);
    expect(state.worldFactCorrectness.rating).toBeNull();
    expect(state.accountFactuality.sources).toEqual([]);
    expect(state.responseExperience).toEqual({ rating: null, comment: '' });
  });

  it('updates one slice without touching the others', () => {
    const { store } = createTestStore();
    store.updateJustification('accountFactuality', { rating: 5 });

    expect(store.getState().accountFactuality.rating).toBe(5);
    expect(store.getState().worldFactCorrectness.rating).toBeNull();
  });

  it('persists updates to storage and reloads them', () => {
    const { store, storage } = createTestStore();
    store.updateJustification('worldFactCorrectness', {
      rating: 4,
      conditions: [{ id: 'c1', value: 'Q3 revenue checked' }],
    });

    expect(storage.getItem(STORAGE_KEY)).toContain('Q3 revenue checked');

    const reloaded = createAppStore({ storage }).getState();
    expect(reloaded.worldFactCorrectness.rating).toBe(4);
    expect(reloaded.worldFactCorrectness.conditions).toHaveLength(1);
  });

  it('ignores corrupt persisted data', () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: '{not json' });
    const store = createAppStore({ storage });

    expect(store.getState()).toEqual(createAppStore({ storage: null }).getState());
  });

  it('notifies subscribers until they unsubscribe', () => {
    const { store } = createTestStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.updateTaskCompletion({ notes: 'first' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(store.getState());

    unsubscribe();
    store.updateTaskCompletion({ notes: 'second' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('resets every slice on clearAll and schedules the undo window', () => {
    const { store, schedule, storage } = createTestStore();
    store.updateTaskCompletion({ notes: 'Checked 12 tasks', rating: 4 });
    store.updateResponseExperience({ comment: 'Clear answer' });

    store.clearAll();

    expect(store.getState().taskCompletion.notes).toBe('');
    expect(store.getState().responseExperience.comment).toBe('');
    expect(store.getUndoState().active).toBe(true);
    expect(schedule).toHaveBeenCalledWith(expect.any(Function), UNDO_WINDOW_MS);
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      taskCompletion: { notes: '' },
    });
  });

  it('restores the snapshot when undo happens inside five seconds', () => {
    const { store, advance } = createTestStore();
    store.updateResponseExperience({ comment: 'Solid answer' });
    store.clearAll();

    advance(UNDO_WINDOW_MS - 1);

    expect(store.undoClear()).toBe(true);
    expect(store.getState().responseExperience.comment).toBe('Solid answer');
    expect(store.getUndoState().active).toBe(false);
  });

  it('refuses undo once the window has elapsed', () => {
    const { store, advance } = createTestStore();
    store.updateTaskCompletion({ notes: 'Checked 12 tasks' });
    store.clearAll();

    advance(UNDO_WINDOW_MS);

    expect(store.getUndoState().active).toBe(false);
    expect(store.undoClear()).toBe(false);
    expect(store.getState().taskCompletion.notes).toBe('');
  });

  it('cancels a pending undo when new work is recorded', () => {
    const { store } = createTestStore();
    store.updateTaskCompletion({ notes: 'Checked 12 tasks' });
    store.clearAll();
    store.updateTaskCompletion({ notes: 'New notes' });

    expect(store.undoClear()).toBe(false);
    expect(store.getState().taskCompletion.notes).toBe('New notes');
  });

  it('reports no undo before anything has been cleared', () => {
    const { store } = createTestStore();
    expect(store.getUndoState()).toEqual({ active: false, expiresAt: null });
    expect(store.undoClear()).toBe(false);
  });
});
