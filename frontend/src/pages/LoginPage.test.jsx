import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { renderWithProviders } from '../__tests__/testUtils';
import { resetMockDb } from '../api';
import { STORAGE_KEYS } from '../utils/constants';

beforeEach(() => {
  localStorage.clear();
  resetMockDb();
});

describe('LoginPage', () => {
  it('mostra o formulario de acesso', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('valida os campos obrigatorios antes de chamar a API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe o email institucional.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
  });

  it('valida o formato do email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'nao-e-email');
    await user.type(screen.getByLabelText('Senha'), '123456');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Email invalido.')).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando as credenciais sao invalidas', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'solange@inatel.br');
    await user.type(screen.getByLabelText('Senha'), 'senha-errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha invalidos.');
  });

  it('lista os cinco integrantes da equipe no ambiente de demonstracao', () => {
    renderWithProviders(<LoginPage />);

    ['Solange Ribeiro da Fonseca', 'Mauro Iwama', 'Giovana Franciele Gonçalves Leite', 'Igor Nogueira Olivio', 'Lucas Nolasco Ynoguti'].forEach(
      (nome) => {
        expect(screen.getByText(nome)).toBeInTheDocument();
      },
    );
    expect(screen.getAllByText('Administrador')).toHaveLength(2);
    expect(screen.getAllByText('Participante')).toHaveLength(3);
  });

  it('preenche email e senha ao clicar em um integrante da lista', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByText('Igor Nogueira Olivio'));

    expect(screen.getByLabelText('Email')).toHaveValue('igor@inatel.br');
    expect(screen.getByLabelText('Senha')).toHaveValue('123456');
  });

  it('guarda a sessao apos um login bem sucedido', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'solange@inatel.br');
    await user.type(screen.getByLabelText('Senha'), '123456');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeTruthy();
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)).role).toBe('ADMIN');
  });
});
