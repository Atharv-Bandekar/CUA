import { useEffect, useState, useSyncExternalStore } from 'react';
import type { AppState } from '../domain/types';
import { type UndoState, appStore } from '../state/appStore';

/** Subscribes the component tree to the store snapshot. */
export function useAppState(): AppState {
  return useSyncExternalStore(appStore.subscribe, appStore.getState, appStore.getState);
}

/** Tracks the 5-second undo window for the banner. */
export function useUndoState(): UndoState {
  const [undo, setUndo] = useState<UndoState>(() => appStore.getUndoState());

  useEffect(
    () => appStore.subscribe(() => setUndo(appStore.getUndoState())),
    [],
  );

  return undo;
}
