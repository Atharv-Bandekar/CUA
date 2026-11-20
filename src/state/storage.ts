/**
 * Storage boundary. The state layer never touches localStorage directly, so it
 * can be tested and run in environments without a browser.
 */

export const STORAGE_KEY = 'ba.review.v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Returns localStorage when available, otherwise null (SSR, privacy mode). */
export function getDefaultStorage(): StorageLike | null {
  try {
    const candidate: unknown = globalThis.localStorage;

    if (
      typeof candidate === 'object' &&
      candidate !== null &&
      typeof (candidate as StorageLike).getItem === 'function' &&
      typeof (candidate as StorageLike).setItem === 'function'
    ) {
      return candidate as StorageLike;
    }

    return null;
  } catch {
    return null;
  }
}
