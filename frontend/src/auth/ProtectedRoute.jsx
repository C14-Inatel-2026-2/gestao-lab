import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ROLES } from '../utils/constants';

/**
 * Bloqueia rotas sem sessao e, quando `adminOnly`, restringe ao perfil Administrador.
 */
export default function ProtectedRoute({ adminOnly = false, children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && user?.role !== ROLES.ADMIN) {
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
}
