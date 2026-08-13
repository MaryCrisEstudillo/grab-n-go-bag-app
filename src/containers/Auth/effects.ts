/*
 *
 * Auth effects
 *
 * The async half of the container — a ggx-pwa `saga.ts` without the generators.
 * The token is written before `_SUCCESS` is dispatched, so any request the UI
 * fires in reaction to signing in already carries an Authorization header.
 *
 */

import { ApiError, apiErrorDetail } from '../../utils/request';
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
  type AuthField,
} from './actions';

export type AuthDispatch = (action: AuthAction) => void;

/**
 * Bad credentials are the expected failure, so 401/422 is reported against a
 * field rather than as a generic banner.
 *
 * The service says which field it means. An unregistered address belongs on
 * the email input, a wrong password on the password one, so its answer wins.
 * Only the two it can name are accepted: `confirmPassword` is a client-side
 * concern the API knows nothing about. The status decides when it named none.
 */
function errorFrom(error: unknown): AuthError {
  if (!(error instanceof ApiError)) {
    return { field: 'email', message: 'Couldn’t reach the server. Try again.' };
  }

  const { message, field } = apiErrorDetail(error);
  const credentials = error.status === 401 || error.status === 422;
  const named: AuthField | undefined =
    field === 'email' || field === 'password' ? field : undefined;

  return {
    field: named ?? (credentials ? 'password' : 'email'),
    message:
      message ||
      (credentials
        ? 'Those details don’t match an account.'
        : `Sign-in failed (${error.status}).`),
  };
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
