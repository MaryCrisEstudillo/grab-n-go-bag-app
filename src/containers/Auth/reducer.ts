/*
 *
 * Auth reducer
 *
 */

import type { User } from '../../types';
import type { AuthAction, AuthError } from './actions';
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

export interface AuthContainerState {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
}

export const initialState: AuthContainerState = {
  user: null,
  loading: false,
  error: null,
};

const authReducer = (
  state: AuthContainerState = initialState,
  action: AuthAction,
): AuthContainerState => {
  switch (action.type) {
    case CHECK_AUTH:
    case SIGN_IN:
    case REGISTER:
      return { ...state, loading: true, error: null };

    case CHECK_AUTH_SUCCESS:
    case SIGN_IN_SUCCESS:
    case REGISTER_SUCCESS:
      return { user: action.user, loading: false, error: null };

    case SIGN_IN_FAIL:
    case REGISTER_FAIL:
      return { user: null, loading: false, error: action.error };

    // Not being signed in is the resting state, not a failure worth reporting.
    case CHECK_AUTH_FAIL:
      return { user: null, loading: false, error: null };

    case SIGN_OUT:
      return { ...state, loading: true };

    /**
     * The session is dropped locally either way. A server that refuses the
     * logout must not be able to strand someone in a signed-in shell.
     */
    case SIGN_OUT_SUCCESS:
      return initialState;

    case SIGN_OUT_FAIL:
      return { user: null, loading: false, error: action.error };

    case CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

export default authReducer;
