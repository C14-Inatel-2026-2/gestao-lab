import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { login as loginApi, STORAGE_KEYS } from './api';

const AuthContext = createContext(null);

function lerUsuarioSalvo() {
  try {
    const bruto = localStorage.getItem(STORAGE_KEYS.USER);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(lerUsuarioSalvo);
  const [loading, setLoading] = useState(false);

  const entrar = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const dados = await loginApi(email, password);
      try {
        localStorage.setItem(STORAGE_KEYS.TOKEN, dados.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(dados.user));
      } catch {
        /* modo privado do navegador: segue apenas em memoria */
      }
      setUser(dados.user);
      return dados.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const sair = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const valor = useMemo(
    () => ({
      user,
      loading,
      login: entrar,
      logout: sair,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
    }),
    [user, loading, entrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de um AuthProvider');
  return contexto;
}
