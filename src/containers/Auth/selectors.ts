/*
 *
 * Auth selectors
 *
 */

import type { User } from '../../types';
import { initialState, type AuthContainerState } from './reducer';
import type { AuthError } from './actions';

/**
 * Direct selector to the auth state domain
 */
const selectAuthDomain = (state: AuthContainerState) => state || initialState;

const makeSelectUser = () => (state: AuthContainerState): User | null =>
  selectAuthDomain(state).user;

const makeSelectLoggedIn = () => (state: AuthContainerState): boolean =>
  selectAuthDomain(state).user !== null;

const makeSelectLoading = () => (state: AuthContainerState): boolean =>
  selectAuthDomain(state).loading;

const makeSelectError = () => (state: AuthContainerState): AuthError | null =>
  selectAuthDomain(state).error;

export {
  selectAuthDomain,
  makeSelectUser,
  makeSelectLoggedIn,
  makeSelectLoading,
  makeSelectError,
};
