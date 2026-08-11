/**
 * The only place that touches `localStorage`. Every read and write is
 * best-effort: private mode and full quotas throw, and losing persistence
 * should never take the app down with it.
 */

export const STORAGE_KEYS = {
  theme: 'grabngo-theme',
  bag: 'grabngo-bag',
  auth: 'grabngo-auth',
  token: 'grabngo-token',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function readJSON<T>(key: StorageKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: StorageKey, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignored — the in-memory state stays authoritative for this session.
  }
}

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
    // Ignored — see writeJSON.
  }
}

export function removeKey(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignored — see writeJSON.
  }
}
