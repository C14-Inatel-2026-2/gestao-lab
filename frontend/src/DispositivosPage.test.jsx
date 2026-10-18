import { render, screen } from '@testing-library/react';
import DispositivosPage from './DispositivosPage';
import { useAuth } from './AuthContext';
import { listarDispositivos } from './api';

/*
 * Testes unitarios COM mock.
 *
 * A tela e testada isolada: api.js e useAuth sao substituidos por dubles.
 * Isso permite verificar com quais filtros a API foi chamada e simular
 * falhas sob demanda - mesmo papel do Mockito no backend.
 */

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));

jest.mock('./api', () => ({
  listarDispositivos: jest.fn(),
  ROLE_LABELS: { ADMIN: 'Administrador', PARTICIPANT: 'Participante' },
  STATUS_LABELS: { AVAILABLE: 'Disponivel', LOANED: 'Emprestado', MAINTENANCE: 'Em manutencao' },
  initials: () => 'SF',
}));

const ITENS = [
  { id: 1, nome: 'ESP32 DevKit v1', patrimonio: 'IOT-0002', categoria: 'Placa', laboratorio: 'Laboratorio de IoT', status: 'AVAILABLE' },
  { id: 2, nome: 'Servo Motor MG996R', patrimonio: 'ROB-0001', categoria: 'Atuador', laboratorio: 'Laboratorio de Robotica', status: 'LOANED' },
];

beforeEach(() => {
  useAuth.mockReturnValue({
    user: { name: 'Solange Ribeiro da Fonseca', role: 'ADMIN' },
    logout: jest.fn(),
    isAdmin: true,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('DispositivosPage (com mock)', () => {
  it('busca o inventario na API e lista os dispositivos', async () => {
    // Arranjo: a API simulada devolve dois itens
    listarDispositivos.mockResolvedValue(ITENS);

    // Acao
    render(<DispositivosPage />);

    // Verificacao: chamou a API uma vez, sem filtros, e exibiu o resultado
    expect(listarDispositivos).toHaveBeenCalledTimes(1);
    expect(listarDispositivos).toHaveBeenCalledWith({ q: '', status: '' });

    expect(await screen.findByText('ESP32 DevKit v1')).toBeInTheDocument();
    expect(screen.getByText('IOT-0002')).toBeInTheDocument();
    expect(screen.getByText(/2 dispositivo\(s\)/)).toBeInTheDocument();
  });

  // CASO NEGATIVO
  it('mostra mensagem de erro e nenhuma tabela quando a API falha', async () => {
    // Arranjo: a API simulada recusa a requisicao
    listarDispositivos.mockRejectedValue(new Error('Nao foi possivel carregar o inventario.'));

    // Acao
    render(<DispositivosPage />);

    // Verificacao
    expect(await screen.findByRole('alert')).toHaveTextContent('Nao foi possivel carregar o inventario.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
