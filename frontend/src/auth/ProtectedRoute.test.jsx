import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { renderWithProviders, signIn, ADMIN_USER, PARTICIPANT_USER } from '../__tests__/testUtils';

beforeEach(() => {
  localStorage.clear();
});

function Tree() {
  return (
    <Routes>
      <Route path="/login" element={<h1>Tela de login</h1>} />
      <Route path="/" element={<h1>Painel</h1>} />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute adminOnly>
            <h1>Gestao de usuarios</h1>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  it('redireciona visitantes sem sessao para o login', () => {
    renderWithProviders(<Tree />, { route: '/usuarios' });
    expect(screen.getByRole('heading', { name: 'Tela de login' })).toBeInTheDocument();
  });

  it('bloqueia participantes em rotas exclusivas de administrador', () => {
    signIn(PARTICIPANT_USER);
    renderWithProviders(<Tree />, { route: '/usuarios' });
    expect(screen.getByRole('heading', { name: 'Painel' })).toBeInTheDocument();
  });

  it('libera o acesso para administradores', () => {
    signIn(ADMIN_USER);
    renderWithProviders(<Tree />, { route: '/usuarios' });
    expect(screen.getByRole('heading', { name: 'Gestao de usuarios' })).toBeInTheDocument();
  });
});
