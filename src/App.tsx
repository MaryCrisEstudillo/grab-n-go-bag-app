import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BagProvider } from './context/BagContext';
import { Login } from './pages/Login';
import { Categories } from './pages/Categories';
import { CategoryDetail } from './pages/CategoryDetail';

function RequireAuth() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function RedirectIfSignedIn() {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BagProvider>
          <Routes>
            <Route path="/login" element={<RedirectIfSignedIn />} />
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
