import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { useAuth } from './AuthContext';

/* Ciclo TDD fechado: nasceu vermelho (senha curta nao era barrada) e virou verde
 * com a validacao em validar(), em LoginPage.jsx. Hoje e o teste de regressao
 * dessa regra. O nome do arquivo foi mantido para rastrear a entrega de testes.
 */

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));

jest.mock('./api', () => ({
  USE_MOCK: true,
  SENHA_PADRAO: '123456',
  ROLE_LABELS: { ADMIN: 'Administrador', PARTICIPANT: 'Participante' },
  CONTAS_DEMO: [
    { name: 'Solange Ribeiro da Fonseca', email: 'solange@inatel.br', role: 'ADMIN' },
    { name: 'Mauro Iwama', email: 'mauro@inatel.br', role: 'ADMIN' },
    { name: 'Giovana Franciele Gonçalves Leite', email: 'giovana@inatel.br', role: 'PARTICIPANT' },
    { name: 'Igor Nogueira Olivio', email: 'igor@inatel.br', role: 'PARTICIPANT' },
    { name: 'Lucas Nolasco Ynoguti', email: 'lucas@inatel.br', role: 'PARTICIPANT' },
  ],
}));

let loginSimulado;

beforeEach(() => {
  loginSimulado = jest.fn().mockResolvedValue({ id: 1, name: 'Solange' });
  useAuth.mockReturnValue({ login: loginSimulado, loading: false });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('LoginPage - validacao de senha minima', () => {
  it('deve recusar senha com menos de 6 caracteres, sem chamar a API', async () => {
    // Arranjo
    const user = userEvent.setup();
    render(<LoginPage />);

    // Acao: senha curta demais para o requisito de seguranca
    await user.type(screen.getByLabelText('Email'), 'solange@inatel.br');
    await user.type(screen.getByLabelText('Senha'), '123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    // Verificacao: a tela barra antes de chegar na API
    expect(screen.getByText('A senha deve ter no minimo 6 caracteres.')).toBeInTheDocument();
    expect(loginSimulado).not.toHaveBeenCalled();
  });
});
