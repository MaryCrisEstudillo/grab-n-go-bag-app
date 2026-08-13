import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BagProvider } from './context/BagContext';
import { Welcome } from './pages/Welcome';
import { Login } from './pages/Login';
import { Categories } from './pages/Categories';
import { CategoryDetail } from './pages/CategoryDetail';
import { Splash } from './components/Splash';

/**
 * Both guards wait on `booting`. The stored token has to be checked against the
 * API before either can answer, and deciding early gets it wrong in both
 * directions — a signed-in user refreshing would be thrown to the login screen,
 * and someone with an expired token would see the app flash before being
 * kicked out of it.
 */
function RequireAuth() {
  const { user, booting } = useAuth();

  if (booting) return <Splash />;
  // Signed out lands on the welcome screen, not the form. The form is what
  // that screen's one button leads to.
  return user ? <Outlet /> : <Navigate to="/welcome" replace />;
}

/** Nobody signed in has any use for the welcome or login screens. */
function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const { user, booting } = useAuth();

  if (booting) return <Splash />;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    /**
     * The router has to know about the same prefix Vite builds against, or on
     * GitHub Pages every path is one level deeper than it thinks and nothing
     * matches. Vite fills `BASE_URL` in from `base`, so the two can't drift.
     */
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <BagProvider>
          <Routes>
            <Route
              path="/welcome"
              element={
                <RedirectIfSignedIn>
                  <Welcome />
                </RedirectIfSignedIn>
              }
            />
            <Route
              path="/login"
              element={
                <RedirectIfSignedIn>
                  <Login />
                </RedirectIfSignedIn>
              }
            />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<Categories />} />
              <Route path="/category/:id" element={<CategoryDetail />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BagProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
