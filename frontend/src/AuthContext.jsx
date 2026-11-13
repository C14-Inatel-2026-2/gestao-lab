import { createContext, useContext, useEffect, useState } from 'react';
import { login as loginApi, registrarExpiracao, STORAGE_KEY } from './api';

const AuthContext = createContext(null);

/** Leitura tolerante: modo privado e dados corrompidos caem para sessao ausente. */
function lerSessao() {
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    const sessao = bruto ? JSON.parse(bruto) : null;
    return sessao?.token && sessao?.user ? sessao : null;
  } catch {
    return null;
  }
}

function gravarSessao(sessao) {
  try {
    if (sessao) localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* modo privado do navegador: a sessao segue apenas em memoria */
  }
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessao);
  const [loading, setLoading] = useState(false);
  const [expirada, setExpirada] = useState(false);

  async function entrar(email, password) {
    setLoading(true);
    try {
      // O backend devolve token e usuario no mesmo corpo.
      const { token, userId, name, email: mail, role } = await loginApi(email, password);
      const nova = { token, user: { id: userId, name, email: mail, role } };
      gravarSessao(nova);
      setExpirada(false);
      setSessao(nova);
      return nova.user;
    } finally {
      setLoading(false);
    }
  }

  function sair() {
    gravarSessao(null);
    setExpirada(false);
    setSessao(null);
  }

  // Os tokens do TokenService ficam em memoria e valem uma hora, entao qualquer
  // 401 numa rota autenticada significa sessao encerrada - inclusive apos um
  // reinicio do backend. Aqui isso derruba a sessao e avisa na tela de login.
  useEffect(() => {
    registrarExpiracao(() => {
      gravarSessao(null);
      setExpirada(true);
      setSessao(null);
    });
    return () => registrarExpiracao(null);
  }, []);

  const valor = {
    user: sessao?.user ?? null,
    token: sessao?.token ?? null,
    loading,
    expirada,
    login: entrar,
    logout: sair,
    isAuthenticated: Boolean(sessao?.token),
    isAdmin: sessao?.user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de um AuthProvider');
  return contexto;
}
