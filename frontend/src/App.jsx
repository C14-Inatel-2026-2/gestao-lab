import { useState } from 'react';
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import CadastroPage from './CadastroPage';
import DispositivosPage from './DispositivosPage';

/**
 * Tres telas: login, cadastro e inventario de dispositivos.
 * Sem rotas - alterna conforme a sessao e a tela publica escolhida.
 */
export default function App() {
  const { isAuthenticated } = useAuth();
  const [tela, setTela] = useState('login');

  if (isAuthenticated) return <DispositivosPage />;
  if (tela === 'cadastro') return <CadastroPage onIrParaLogin={() => setTela('login')} />;
  return <LoginPage onIrParaCadastro={() => setTela('cadastro')} />;
}
