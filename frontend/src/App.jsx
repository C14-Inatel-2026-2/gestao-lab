import { useState } from 'react';
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import CadastroPage from './CadastroPage';
import Area from './Area';

/**
 * Telas publicas (login e cadastro) e a area autenticada.
 * Sem rotas - alterna conforme a sessao e a tela publica escolhida.
 */
export default function App() {
  const { isAuthenticated } = useAuth();
  const [tela, setTela] = useState('login');

  if (isAuthenticated) return <Area />;
  if (tela === 'cadastro') return <CadastroPage onIrParaLogin={() => setTela('login')} />;
  return <LoginPage onIrParaCadastro={() => setTela('cadastro')} />;
}
