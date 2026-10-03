import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { useAuth } from './AuthContext';

/*
 * Teste unitario da LoginPage.
 *
 * O componente e testado isolado: as duas dependencias dele sao simuladas,
 * entao nada de AuthProvider, de localStorage ou da camada de API real.
 * E o equivalente ao que o Mockito faz no backend - substituir o colaborador
 * por um dublê e verificar como o codigo sob teste conversa com ele.
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

async function preencherEEnviar(email, senha) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (senha) await user.type(screen.getByLabelText('Senha'), senha);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  return user;
}

describe('LoginPage (unitario)', () => {
  it('renderiza os campos e o botao de acesso', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  it('nao chama o login quando os campos estao vazios', async () => {
    render(<LoginPage />);

    await preencherEEnviar('', '');

    expect(screen.getByText('Informe o email institucional.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
    expect(loginSimulado).not.toHaveBeenCalled();
  });

  it('nao chama o login quando o email tem formato invalido', async () => {
    render(<LoginPage />);

    await preencherEEnviar('solange.inatel.br', '123456');

    expect(screen.getByText('Email invalido.')).toBeInTheDocument();
    expect(loginSimulado).not.toHaveBeenCalled();
  });

  it('chama o login uma vez, com email e senha digitados', async () => {
    render(<LoginPage />);

    await preencherEEnviar('solange@inatel.br', '123456');

    expect(loginSimulado).toHaveBeenCalledTimes(1);
    expect(loginSimulado).toHaveBeenCalledWith('solange@inatel.br', '123456');
  });

  it('ignora espacos em volta do email ao validar', async () => {
    render(<LoginPage />);

    await preencherEEnviar('  solange@inatel.br  ', '123456');

    expect(screen.queryByText('Email invalido.')).not.toBeInTheDocument();
    expect(loginSimulado).toHaveBeenCalledTimes(1);
  });

  it('mostra a mensagem de erro devolvida pelo login', async () => {
    loginSimulado.mockRejectedValue(new Error('Email ou senha invalidos.'));
    render(<LoginPage />);

    await preencherEEnviar('solange@inatel.br', 'errada');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha invalidos.');
  });

  it('usa uma mensagem padrao quando a falha nao traz texto', async () => {
    loginSimulado.mockRejectedValue(new Error(''));
    render(<LoginPage />);

    await preencherEEnviar('solange@inatel.br', '123456');

    expect(await screen.findByRole('alert')).toHaveTextContent('Nao foi possivel entrar.');
  });

  it('desabilita o botao e avisa enquanto o login esta em andamento', () => {
    useAuth.mockReturnValue({ login: loginSimulado, loading: true });
    render(<LoginPage />);

    const botao = screen.getByRole('button', { name: 'Entrando...' });
    expect(botao).toBeDisabled();
  });

  it('preenche os campos ao clicar em um integrante, sem disparar o login', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByText('Igor Nogueira Olivio'));

    expect(screen.getByLabelText('Email')).toHaveValue('igor@inatel.br');
    expect(screen.getByLabelText('Senha')).toHaveValue('123456');
    expect(loginSimulado).not.toHaveBeenCalled();
  });

  it('limpa o erro anterior ao enviar de novo', async () => {
    loginSimulado.mockRejectedValueOnce(new Error('Email ou senha invalidos.'));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'solange@inatel.br');
    await user.type(screen.getByLabelText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(loginSimulado).toHaveBeenCalledTimes(2);
  });
});
