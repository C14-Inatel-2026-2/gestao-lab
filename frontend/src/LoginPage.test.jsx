import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AuthProvider } from './AuthContext';
import { resetUsuarios, STORAGE_KEYS } from './api';

function renderizar() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  resetUsuarios();
});

describe('Tela de login', () => {
  it('mostra o formulario de acesso', () => {
    renderizar();
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('valida os campos obrigatorios antes de chamar a API', async () => {
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe o email institucional.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
  });

  it('valida o formato do email', async () => {
    const user = userEvent.setup();
    renderizar();

    await user.type(screen.getByLabelText('Email'), 'nao-e-email');
    await user.type(screen.getByLabelText('Senha'), '123456');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Email invalido.')).toBeInTheDocument();
  });

  it('avisa quando a senha esta errada', async () => {
    const user = userEvent.setup();
    renderizar();

    await user.type(screen.getByLabelText('Email'), 'solange@inatel.br');
    await user.type(screen.getByLabelText('Senha'), 'senha-errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha invalidos.');
  });

  it('bloqueia usuario inativo', async () => {
    const user = userEvent.setup();
    renderizar();

    await user.type(screen.getByLabelText('Email'), 'ana@inatel.br');
    await user.type(screen.getByLabelText('Senha'), '123456');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario inativo');
  });

  it('preenche os campos ao clicar em um integrante da lista', async () => {
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByText('Igor Nogueira Olivio'));

    expect(screen.getByLabelText('Email')).toHaveValue('igor@inatel.br');
    expect(screen.getByLabelText('Senha')).toHaveValue('123456');
  });

  it('entra e mostra a confirmacao com o perfil correto', async () => {
    const user = userEvent.setup();
    renderizar();

    await user.type(screen.getByLabelText('Email'), 'solange@inatel.br');
    await user.type(screen.getByLabelText('Senha'), '123456');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: /Ola, Solange/ })).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeTruthy();
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)).role).toBe('ADMIN');
  });

  it('encerra a sessao ao clicar em sair', async () => {
    const user = userEvent.setup();
    renderizar();

    await user.type(screen.getByLabelText('Email'), 'giovana@inatel.br');
    await user.type(screen.getByLabelText('Senha'), '123456');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await user.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
  });
});
