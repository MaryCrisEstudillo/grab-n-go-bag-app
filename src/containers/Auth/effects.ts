/*
 *
 * Auth effects
 *
 * The async half of the container — a ggx-pwa `saga.ts` without the generators.
 * The token is written before `_SUCCESS` is dispatched, so any request the UI
 * fires in reaction to signing in already carries an Authorization header.
 *
 */

import { ApiError } from '../../utils/request';
import { writeString, removeKey, STORAGE_KEYS } from '../../lib/storage';
import {
  getCurrentUserAPI,
  registerAPI,
  signInAPI,
  signOutAPI,
} from '../../gateways/AuthApiGateway';
import {
  checkAuthAction,
  checkAuthFailAction,
  checkAuthSuccessAction,
  registerAction,
  registerFailAction,
  registerSuccessAction,
  signInAction,
  signInFailAction,
  signInSuccessAction,
  signOutAction,
  signOutSuccessAction,
  type AuthAction,
  type AuthError,
} from './actions';

export type AuthDispatch = (action: AuthAction) => void;

/**
 * Bad credentials are the expected failure, so 401/422 is reported against the
 * password field rather than as a generic banner.
 */
function errorFrom(error: unknown): AuthError {
  if (error instanceof ApiError) {
    const { body, status } = error;
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message?: unknown }).message ?? '')
        : '';

    if (status === 401 || status === 422) {
      return {
        field: 'password',
        message: message || 'Those details don’t match an account.',
      };
    }
    return { field: 'email', message: message || `Sign-in failed (${status}).` };
  }
  return { field: 'email', message: 'Couldn’t reach the server. Try again.' };
}

/** Restores the session on boot from a token that may since have expired. */
export async function checkAuth(dispatch: AuthDispatch): Promise<void> {
  dispatch(checkAuthAction());

  try {
    dispatch(checkAuthSuccessAction(await getCurrentUserAPI()));
  } catch {
    removeKey(STORAGE_KEYS.token);
    dispatch(checkAuthFailAction());
  }
}

export async function signIn(
  dispatch: AuthDispatch,
  email: string,
  password: string,
): Promise<void> {
  dispatch(signInAction());

  try {
    const session = await signInAPI({ email: email.trim(), password });
    writeString(STORAGE_KEYS.token, session.token);
    dispatch(signInSuccessAction(session.user));
  } catch (error) {
    dispatch(signInFailAction(errorFrom(error)));
  }
}

export async function register(
  dispatch: AuthDispatch,
  email: string,
  password: string,
  confirmPassword: string,
): Promise<void> {
  // Checked here rather than server-side — the second field is a client concern.
  if (password !== confirmPassword) {
    dispatch(
      registerFailAction({
        field: 'confirmPassword',
        message: "Passwords don't match.",
      }),
    );
    return;
  }

  dispatch(registerAction());

  try {
    const session = await registerAPI({ email: email.trim(), password });
    writeString(STORAGE_KEYS.token, session.token);
    dispatch(registerSuccessAction(session.user));
  } catch (error) {
    dispatch(registerFailAction(errorFrom(error)));
  }
}

export async function signOut(dispatch: AuthDispatch): Promise<void> {
  dispatch(signOutAction());

  try {
    await signOutAPI();
  } catch {
    // Ignored on purpose — see the reducer's SIGN_OUT_SUCCESS note.
  } finally {
    removeKey(STORAGE_KEYS.token);
    dispatch(signOutSuccessAction());
  }
}
