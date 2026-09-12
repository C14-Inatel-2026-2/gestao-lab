import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { ToastProvider } from '../components/ToastProvider';
import { STORAGE_KEYS } from '../utils/constants';

export const ADMIN_USER = {
  id: 1,
  name: 'Solange Ribeiro da Fonseca',
  email: 'solange@inatel.br',
  role: 'ADMIN',
  registration: 'GEC-1001',
  active: true,
};

export const PARTICIPANT_USER = {
  id: 3,
  name: 'Giovana Franciele Gonçalves Leite',
  email: 'giovana@inatel.br',
  role: 'PARTICIPANT',
  registration: 'GEC-1003',
  active: true,
};

/** Simula uma sessao ja autenticada antes de montar a arvore. */
export function signIn(user = ADMIN_USER) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, `mock-token-${user.id}`);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function renderWithProviders(ui, { route = '/', ...options } = {}) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
