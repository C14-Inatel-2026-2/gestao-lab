import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { listarDispositivos, STORAGE_KEY } from './api';

/*
 * Testes do contexto de sessao SEM dublar o api.js: o fetch global e que e
 * substituido. Assim o caminho real de api.js (montagem do Bearer, leitura do
 * corpo de erro, disparo da expiracao) entra no teste junto com o contexto.
 */

function respostaJson(status, corpo) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(corpo) });
}

function Sonda() {
  const { user, token, isAdmin, isAuthenticated, expirada, login } = useAuth();
  return (
    <div>
      <span data-testid="estado">{isAuthenticated ? `${user.name}|${token}|${isAdmin}` : 'anonimo'}</span>
      {expirada && <span role="status">Sessao expirada</span>}
      <button type="button" onClick={() => login('admin@inatel.br', 'Senha123')}>entrar</button>
      <button type="button" onClick={() => listarDispositivos({ token }).catch(() => {})}>listar</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
  delete global.fetch;
});

describe('AuthContext', () => {
  it('guarda token e perfil do login e reconhece o administrador', async () => {
    // Arranjo: o backend devolve token e usuario no mesmo corpo do login
    global.fetch.mockReturnValue(respostaJson(200, {
      token: 'token-abc', userId: 1, name: 'Admin', email: 'admin@inatel.br', role: 'ADMIN',
    }));
    render(<AuthProvider><Sonda /></AuthProvider>);

    // Acao
    await userEvent.click(screen.getByRole('button', { name: 'entrar' }));

    // Verificacao: estado em memoria, perfil reconhecido e sessao persistida
    expect(await screen.findByTestId('estado')).toHaveTextContent('Admin|token-abc|true');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).token).toBe('token-abc');

    const [, opcoes] = global.fetch.mock.calls[0];
    expect(opcoes.method).toBe('POST');
    expect(JSON.parse(opcoes.body)).toEqual({ email: 'admin@inatel.br', password: 'Senha123' });
  });

  // CASO NEGATIVO
  it('encerra a sessao quando uma rota autenticada responde 401', async () => {
    // Arranjo: login valido, e a chamada seguinte com token expirado
    global.fetch
      .mockReturnValueOnce(respostaJson(200, {
        token: 'token-abc', userId: 2, name: 'Ana', email: 'ana@inatel.br', role: 'PARTICIPANT',
      }))
      .mockReturnValueOnce(respostaJson(401, { message: 'Authentication required' }));

    render(<AuthProvider><Sonda /></AuthProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'entrar' }));
    expect(await screen.findByTestId('estado')).toHaveTextContent('Ana');

    // Acao: o token vai no header e o backend recusa
    await userEvent.click(screen.getByRole('button', { name: 'listar' }));

    // Verificacao: sessao derrubada, aviso ligado e localStorage limpo
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('anonimo'));
    expect(screen.getByRole('status')).toHaveTextContent('Sessao expirada');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    const [, opcoes] = global.fetch.mock.calls[1];
    expect(opcoes.headers.Authorization).toBe('Bearer token-abc');
  });
});
