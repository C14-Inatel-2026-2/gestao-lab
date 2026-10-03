import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { useAuth } from './AuthContext';

/*
 * ============================================================================
 * ESTE TESTE FALHA DE PROPOSITO.
 * ============================================================================
 *
 * Ele nao esta quebrado: ele documenta um requisito de seguranca que a tela
 * ainda NAO implementa. E o estado "vermelho" do ciclo do TDD - primeiro
 * escreve-se o teste que descreve o comportamento desejado, depois o codigo
 * que o satisfaz.
 *
 * REQUISITO: a tela deve recusar senhas com menos de 6 caracteres, sem chegar
 * a chamar a API.
 *
 * COMPORTAMENTO ATUAL: a funcao validar() da LoginPage so verifica se a senha
 * esta vazia (`if (!senha)`), entao "123" passa e o login e chamado.
 *
 * PARA FICAR VERDE, basta acrescentar em validar(), em src/LoginPage.jsx:
 *
 *     if (!senha) novos.senha = 'Informe a senha.';
 *     else if (senha.length < 6) novos.senha = 'A senha deve ter no minimo 6 caracteres.';
 *
 * Mantido vermelho de proposito para evidenciar a lacuna.
 * ============================================================================
 */

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));

jest.mock('./api', () => ({
  USE_MOCK: true,
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
