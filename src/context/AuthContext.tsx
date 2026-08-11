import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import { readString, STORAGE_KEYS } from '../lib/storage';
import authReducer, {
  initialState,
  type AuthContainerState,
} from '../containers/Auth/reducer';
import { clearErrorAction } from '../containers/Auth/actions';
import * as effects from '../containers/Auth/effects';

/**
 * Session state, backed by the API.
 *
 * The container owns every transition; this provider is the wiring. Actions are
 * dispatched by the effects rather than from here, so a component never sees a
 * half-applied sign-in.
 */

interface AuthContextValue extends AuthContainerState {
  /**
   * True while the stored token is being checked on first paint. The route
   * guard has to wait for it — without this, a signed-in user refreshing the
   * page is bounced to the login screen for the length of one request.
   */
  booting: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    confirmPassword: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // No token means nothing to restore, so don't make anyone wait on a request
  // that can only fail.
  const [booting, setBooting] = useState(() => Boolean(readString(STORAGE_KEYS.token)));

  useEffect(() => {
    if (!booting) return;

    let cancelled = false;
    void effects.checkAuth(dispatch).finally(() => {
      if (!cancelled) setBooting(false);
    });

    return () => {
      cancelled = true;
    };
    // Runs once: `booting` only ever goes true → false.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(
    (email: string, password: string) => effects.signIn(dispatch, email, password),
    [],
  );

  const register = useCallback(
    (email: string, password: string, confirmPassword: string) =>
      effects.register(dispatch, email, password, confirmPassword),
    [],
  );

  const signOut = useCallback(() => effects.signOut(dispatch), []);

  const clearError = useCallback(() => dispatch(clearErrorAction()), []);

  const value = useMemo(
    () => ({ ...state, booting, signIn, register, signOut, clearError }),
    [state, booting, signIn, register, signOut, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
