import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import Area from './Area';
import { useAuth } from './AuthContext';
import { listarDispositivos, listarEmprestimos } from './api';

/* Testes unitarios COM mock: navegacao entre as abas e porta de entrada do App. */

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  listarDispositivos: jest.fn(),
  listarEmprestimos: jest.fn(),
}));

const DISPOSITIVOS = [
  { id: 1, name: 'ESP32 DevKit v1', description: 'Placa', status: 'AVAILABLE', laboratoryId: 1, laboratoryName: 'Laboratorio de IoT' },
];

beforeEach(() => {
  listarDispositivos.mockResolvedValue(DISPOSITIVOS);
  listarEmprestimos.mockResolvedValue([]);
  useAuth.mockReturnValue({
    user: { id: 1, name: 'Solange Ribeiro da Fonseca', role: 'PARTICIPANT' },
    token: 'tk',
    logout: jest.fn(),
    isAdmin: false,
    isAuthenticated: true,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Area (com mock)', () => {
  it('abre no inventario e mostra o perfil do usuario', async () => {
    render(<Area />);

    expect(screen.getByText('Participante')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ola, Solange' })).toBeInTheDocument();
    expect(await screen.findByText('ESP32 DevKit v1')).toBeInTheDocument();
    expect(listarEmprestimos).not.toHaveBeenCalled();
  });

  it('troca para a aba de emprestimos', async () => {
    render(<Area />);
    await screen.findByText('ESP32 DevKit v1');

    // Acao
    await userEvent.click(screen.getByRole('button', { name: 'Emprestimos' }));

    // Verificacao: a secao trocou e a listagem de emprestimos foi buscada
    expect(await screen.findByText('Voce ainda nao solicitou emprestimos.')).toBeInTheDocument();
    expect(listarEmprestimos).toHaveBeenCalledWith({ token: 'tk' });
    expect(screen.queryByText('ESP32 DevKit v1')).not.toBeInTheDocument();
  });
});

describe('App (com mock)', () => {
  it('mostra a area autenticada quando ha sessao', async () => {
    render(<App />);

    expect(await screen.findByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  // CASO NEGATIVO
  it('sem sessao, mostra o login e permite ir para o cadastro', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false, expirada: false, login: jest.fn() });

    render(<App />);
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Criar uma conta' }));

    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeInTheDocument();
  });
});
