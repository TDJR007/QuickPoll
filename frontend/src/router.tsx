import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PollPage from './pages/PollPage';
import RateLimitPage from './pages/RateLimitPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/rate-limit', element: <RateLimitPage /> },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  { path: '/poll/:id', element: <PollPage /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);