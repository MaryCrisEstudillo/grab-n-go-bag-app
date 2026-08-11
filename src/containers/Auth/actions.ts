/*
 *
 * Auth actions
 *
 */

import type { User } from '../../types';
import {
  CHECK_AUTH,
  CHECK_AUTH_FAIL,
  CHECK_AUTH_SUCCESS,
  CLEAR_ERROR,
  REGISTER,
  REGISTER_FAIL,
  REGISTER_SUCCESS,
  SIGN_IN,
  SIGN_IN_FAIL,
  SIGN_IN_SUCCESS,
  SIGN_OUT,
  SIGN_OUT_FAIL,
  SIGN_OUT_SUCCESS,
} from './constants';

/** Errors are attributed to a field so the form can point at the right input. */
export type AuthField = 'email' | 'password' | 'confirmPassword';

export interface AuthError {
  field: AuthField;
  message: string;
}

export function checkAuthAction() {
  return { type: CHECK_AUTH } as const;
}

export function checkAuthSuccessAction(user: User) {
  return { type: CHECK_AUTH_SUCCESS, user } as const;
}

export function checkAuthFailAction() {
  return { type: CHECK_AUTH_FAIL } as const;
}

export function signInAction() {
  return { type: SIGN_IN } as const;
}

export function signInSuccessAction(user: User) {
  return { type: SIGN_IN_SUCCESS, user } as const;
}

export function signInFailAction(error: AuthError) {
  return { type: SIGN_IN_FAIL, error } as const;
}

export function registerAction() {
  return { type: REGISTER } as const;
}

export function registerSuccessAction(user: User) {
  return { type: REGISTER_SUCCESS, user } as const;
}

export function registerFailAction(error: AuthError) {
  return { type: REGISTER_FAIL, error } as const;
}

export function signOutAction() {
  return { type: SIGN_OUT } as const;
}

export function signOutSuccessAction() {
  return { type: SIGN_OUT_SUCCESS } as const;
}

export function signOutFailAction(error: AuthError) {
  return { type: SIGN_OUT_FAIL, error } as const;
}

export function clearErrorAction() {
  return { type: CLEAR_ERROR } as const;
}

export type AuthAction =
  | ReturnType<typeof checkAuthAction>
  | ReturnType<typeof checkAuthSuccessAction>
  | ReturnType<typeof checkAuthFailAction>
  | ReturnType<typeof signInAction>
  | ReturnType<typeof signInSuccessAction>
  | ReturnType<typeof signInFailAction>
  | ReturnType<typeof registerAction>
  | ReturnType<typeof registerSuccessAction>
  | ReturnType<typeof registerFailAction>
  | ReturnType<typeof signOutAction>
  | ReturnType<typeof signOutSuccessAction>
  | ReturnType<typeof signOutFailAction>
  | ReturnType<typeof clearErrorAction>;
