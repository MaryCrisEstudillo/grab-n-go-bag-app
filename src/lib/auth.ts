import type { User } from '../types';
import { readJSON, removeKey, writeJSON, STORAGE_KEYS } from './storage';

/**
 * ─── SWAP POINT ──────────────────────────────────────────────────────────────
 * Auth is stubbed. There is no backend yet, so any well-formed email with an
 * 8+ character password is accepted and the session is a `localStorage` entry.
 *
 * When the real API lands, replace the bodies of `signIn` / `register` /
 * `signOut` with network calls and store a token instead of a bare email.
 * Nothing outside this file knows how auth works.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const MIN_PASSWORD_LENGTH = 8;

// Deliberately loose: shape-checking only, since the real check is server-side.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; field: 'email' | 'password' | 'confirmPassword'; message: string };

export function isValidEmail(email: string): boolean {
  return EMAIL.test(email.trim());
}

export function signIn(email: string, password: string): AuthResult {
  if (!isValidEmail(email)) {
    return { ok: false, field: 'email', message: 'Enter a valid email address.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      field: 'password',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  const user: User = { email: email.trim().toLowerCase() };
  writeJSON(STORAGE_KEYS.auth, user);
  return { ok: true, user };
}

export function register(
  email: string,
  password: string,
  confirmPassword: string,
): AuthResult {
  if (password !== confirmPassword) {
    return { ok: false, field: 'confirmPassword', message: "Passwords don't match." };
  }
  return signIn(email, password);
}

export function signOut(): void {
  removeKey(STORAGE_KEYS.auth);
}

export function currentUser(): User | null {
  const stored = readJSON<User | null>(STORAGE_KEYS.auth, null);
  if (!stored || typeof stored.email !== 'string') return null;
  return stored;
}
