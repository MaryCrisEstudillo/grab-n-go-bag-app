/**
 * The only place that touches `localStorage`. Every read and write is
 * best-effort: private mode and full quotas throw, and losing persistence
 * should never take the app down with it.
 *
 * Since the bag moved to the API, only two things live here — the theme, which
 * has to be readable before first paint, and the session token.
 */

export const STORAGE_KEYS = {
  theme: 'grabngo-theme',
  token: 'grabngo-token',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function readString(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignored — the in-memory state stays authoritative for this session.
  }
}

export function removeKey(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignored — see writeString.
  }
}
