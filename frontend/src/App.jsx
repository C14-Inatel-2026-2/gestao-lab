import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import DispositivosPage from './DispositivosPage';

/**
 * Duas telas: login e inventario de dispositivos.
 * Sem rotas - alterna conforme a sessao.
 */
export default function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <DispositivosPage /> : <LoginPage />;
}
