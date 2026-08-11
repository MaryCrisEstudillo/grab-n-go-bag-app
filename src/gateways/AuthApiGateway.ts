/**
 * Gateway for the Auth service
 */

import request from '../utils/request';
import type { User } from '../types';
import { readString, STORAGE_KEYS } from '../lib/storage';

const authHeader = () => {
  const token = readString(STORAGE_KEYS.token);

  return {
    Authorization: token ?? '',
  };
};

/** What the service hands back once credentials check out. */
export interface AuthSession {
  token: string;
  user: User;
}

export interface CredentialsBody {
  email: string;
  password: string;
}

/**
 * Sign in an existing user
 * @param {Object} requestBody
 * @returns {Promise<AuthSession>}
 */
export function signInAPI(requestBody: CredentialsBody) {
  const url = `${import.meta.env.VITE_AUTH_URL}/sessions`;

  const requestParams = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  } as const;

  return request<AuthSession>(url, requestParams);
}

/**
 * Register a new user
 * @param {Object} requestBody
 * @returns {Promise<AuthSession>}
 */
export function registerAPI(requestBody: CredentialsBody) {
  const url = `${import.meta.env.VITE_AUTH_URL}/users`;

  const requestParams = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  } as const;

  return request<AuthSession>(url, requestParams);
}

/**
 * Sign out the current session
 * @returns {Promise<null>}
 */
export function signOutAPI() {
  const url = `${import.meta.env.VITE_AUTH_URL}/sessions`;

  const requestParams = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
  } as const;

  return request<null>(url, requestParams);
}

/**
 * Get the user behind the current token
 * @returns {Promise<User>}
 */
export function getCurrentUserAPI() {
  const url = `${import.meta.env.VITE_AUTH_URL}/users/me`;

  const requestParams = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
  } as const;

  return request<User>(url, requestParams);
}
