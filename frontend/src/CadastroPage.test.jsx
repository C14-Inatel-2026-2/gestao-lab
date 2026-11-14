import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CadastroPage from './CadastroPage';
import { ApiError, cadastrar } from './api';

/* Testes unitarios COM mock: a chamada de cadastro e dublada. */

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  cadastrar: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('CadastroPage (com mock)', () => {
  it('cadastra e confirma que a conta e de participante', async () => {
    // Arranjo
    const user = userEvent.setup();
    cadastrar.mockResolvedValue({ userId: 7, name: 'Ana', email: 'ana@inatel.br', role: 'PARTICIPANT' });
    render(<CadastroPage onIrParaLogin={jest.fn()} />);

    // Acao
    await user.type(screen.getByLabelText('Nome'), 'Ana Beatriz');
    await user.type(screen.getByLabelText('Email'), 'ana@inatel.br');
    await user.type(screen.getByLabelText('Senha'), 'Senha123');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    // Verificacao: enviou no formato do RegisterRequest e confirmou na tela
    expect(cadastrar).toHaveBeenCalledWith({
      name: 'Ana Beatriz',
      email: 'ana@inatel.br',
      password: 'Senha123',
    });
    expect(await screen.findByText('Cadastro concluido')).toBeInTheDocument();
  });

  // CASO NEGATIVO
  it('mostra a mensagem do backend quando o email ja esta cadastrado', async () => {
    const user = userEvent.setup();
    cadastrar.mockRejectedValue(new ApiError('Email already registered', 409));
    render(<CadastroPage onIrParaLogin={jest.fn()} />);

    await user.type(screen.getByLabelText('Nome'), 'Ana Beatriz');
    await user.type(screen.getByLabelText('Email'), 'ana@inatel.br');
    await user.type(screen.getByLabelText('Senha'), 'Senha123');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered');
    expect(screen.queryByText('Cadastro concluido')).not.toBeInTheDocument();
  });
});
