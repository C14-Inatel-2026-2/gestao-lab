import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { useAuth } from './AuthContext';

/* Ciclo TDD fechado: nasceu vermelho quando a tela nao barrava senha curta e
 * virou verde com a validacao em validar(), em LoginPage.jsx. Agora cobre as
 * regras reais do backend (8 caracteres, uma maiuscula e um digito), que
 * substituiram o minimo de 6 usado enquanto o front rodava em dados falsos.
 */

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));

let loginSimulado;

beforeEach(() => {
  loginSimulado = jest.fn().mockResolvedValue({ id: 1, name: 'Solange' });
  useAuth.mockReturnValue({ login: loginSimulado, loading: false, expirada: false });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('LoginPage - validacao antes de chamar a API', () => {
  it('recusa senha fora das regras do backend, sem chamar a API', async () => {
    // Arranjo
    const user = userEvent.setup();
    render(<LoginPage />);

    // Acao: sete caracteres, abaixo do minimo do UserService
    await user.type(screen.getByLabelText('Email'), 'solange@inatel.br');
    await user.type(screen.getByLabelText('Senha'), 'Senha1');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    // Verificacao: a tela barra antes de chegar na API
    expect(screen.getByText('A senha deve ter no minimo 8 caracteres.')).toBeInTheDocument();
    expect(loginSimulado).not.toHaveBeenCalled();
  });

  it('envia as credenciais quando email e senha sao validos', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'solange@inatel.br');
    await user.type(screen.getByLabelText('Senha'), 'Senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(loginSimulado).toHaveBeenCalledWith('solange@inatel.br', 'Senha123');
  });
});
