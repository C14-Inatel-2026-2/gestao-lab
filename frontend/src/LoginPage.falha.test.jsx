import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { useAuth } from './AuthContext';

/* CICLO TDD FECHADO: este teste foi escrito vermelho e agora esta verde.
 *
 * Ele nasceu como o estado "vermelho" do ciclo do TDD, documentando um
 * requisito de seguranca que a tela ainda nao implementava: recusar senhas
 * com menos de SENHA_MIN caracteres sem chegar a chamar a API.
 *
 * A validacao foi implementada em validar(), em src/LoginPage.jsx, e o teste
 * passou a ser o teste de regressao desse requisito: se a regra for removida
 * ou afrouxada, ele volta a falhar.
 *
 * O nome do arquivo foi mantido para preservar a rastreabilidade com a
 * entrega de testes, em que ele constava como o caso vermelho.
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

describe('LoginPage - requisito pendente (teste vermelho)', () => {
  it('deve recusar senha com menos de 6 caracteres, sem chamar a API', async () => {
    // Arranjo
    const user = userEvent.setup();
    render(<LoginPage />);

    // Acao: senha curta demais para o requisito de seguranca
    await user.type(screen.getByLabelText('Email'), 'solange@inatel.br');
    await user.type(screen.getByLabelText('Senha'), '123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    // Verificacao: a tela deveria barrar antes de chegar na API
    expect(screen.getByText('A senha deve ter no minimo 6 caracteres.')).toBeInTheDocument();
    expect(loginSimulado).not.toHaveBeenCalled();
  });
});
