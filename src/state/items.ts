import type { RepeatableItem, SourceItem } from '../domain/types';

let sequence = 0;

/** Stable-enough local id for a repeatable row. */
export function createItemId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

export function createRepeatableItem(value = ''): RepeatableItem {
  return { id: createItemId('item'), value };
}

export function createSourceItem(): SourceItem {
  return { id: createItemId('source'), label: '', url: '' };
}

export function updateItem<T extends { id: string }>(
  items: readonly T[],
  id: string,
  patch: Partial<T>,
): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export function removeItem<T extends { id: string }>(items: readonly T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}
