import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import * as auth from '../lib/auth';
import authReducer, {
  initialState,
  type AuthContainerState,
} from '../containers/Auth/reducer';
import {
  clearErrorAction,
  registerFailAction,
  registerSuccessAction,
  signInFailAction,
  signInSuccessAction,
  signOutSuccessAction,
} from '../containers/Auth/actions';

/**
 * ─── SWAP POINT ──────────────────────────────────────────────────────────────
 * Session state lives in `containers/Auth`; the credential check still runs
 * through the stub in `lib/auth.ts`, which answers synchronously. That is why
 * `signIn` and `register` return an `AuthResult` — the form reads it directly.
 *
 * Against the real service, call `containers/Auth/effects.ts` instead and read
 * the outcome off `error` rather than a return value; the reducer already
 * handles the loading and failure states those effects dispatch.
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface AuthContextValue extends AuthContainerState {
  signIn: (email: string, password: string) => auth.AuthResult;
  register: (
    email: string,
    password: string,
    confirmPassword: string,
  ) => auth.AuthResult;
  signOut: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** A session already in storage means the user never sees the login screen. */
function initState(): AuthContainerState {
  return { ...initialState, user: auth.currentUser() };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, undefined, initState);

  const signIn = useCallback((email: string, password: string) => {
    const result = auth.signIn(email, password);

    if (result.ok) {
      dispatch(signInSuccessAction(result.user));
    } else {
      dispatch(signInFailAction({ field: result.field, message: result.message }));
    }
    return result;
  }, []);

  const register = useCallback(
    (email: string, password: string, confirmPassword: string) => {
      const result = auth.register(email, password, confirmPassword);

      if (result.ok) {
        dispatch(registerSuccessAction(result.user));
      } else {
        dispatch(registerFailAction({ field: result.field, message: result.message }));
      }
      return result;
    },
    [],
  );

  const signOut = useCallback(() => {
    auth.signOut();
    dispatch(signOutSuccessAction());
  }, []);

  const clearError = useCallback(() => dispatch(clearErrorAction()), []);

  const value = useMemo(
    () => ({ ...state, signIn, register, signOut, clearError }),
    [state, signIn, register, signOut, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
