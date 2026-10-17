import { render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DispositivosPage from './DispositivosPage';
import { useAuth } from './AuthContext';
import { listarDispositivos } from './api';

/*
 * Testes unitarios COM mock.
 *
 * A tela e testada isolada: o modulo api.js e o useAuth sao substituidos por
 * dubles. Isso permite verificar com quais filtros a API foi chamada e simular
 * falhas sob demanda - mesmo papel do Mockito no backend.
 */

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));

jest.mock('./api', () => ({
  listarDispositivos: jest.fn(),
  ROLE_LABELS: { ADMIN: 'Administrador', PARTICIPANT: 'Participante' },
  STATUS_LABELS: { AVAILABLE: 'Disponivel', LOANED: 'Emprestado', MAINTENANCE: 'Em manutencao' },
  initials: (nome) => String(nome).slice(0, 2).toUpperCase(),
}));

const ADMIN = { id: 1, name: 'Solange Ribeiro da Fonseca', email: 'solange@inatel.br', role: 'ADMIN' };
const PARTICIPANTE = { ...ADMIN, id: 4, name: 'Igor Nogueira Olivio', role: 'PARTICIPANT' };

const ITENS = [
  { id: 1, nome: 'Raspberry Pi 4 Model B', patrimonio: 'IOT-0001', categoria: 'Placa', laboratorio: 'Laboratorio de IoT', status: 'LOANED' },
  { id: 2, nome: 'ESP32 DevKit v1', patrimonio: 'IOT-0002', categoria: 'Placa', laboratorio: 'Laboratorio de IoT', status: 'AVAILABLE' },
  { id: 3, nome: 'Sensor BME280', patrimonio: 'IOT-0003', categoria: 'Sensor', laboratorio: 'Laboratorio de IoT', status: 'AVAILABLE' },
];

let logoutSimulado;

beforeEach(() => {
  logoutSimulado = jest.fn();
  useAuth.mockReturnValue({ user: ADMIN, logout: logoutSimulado, isAdmin: true });
  listarDispositivos.mockResolvedValue(ITENS);
});

afterEach(() => {
  jest.clearAllMocks();
});

async function montar() {
  render(<DispositivosPage />);
  await waitForElementToBeRemoved(() => screen.queryByText('Carregando inventario...'));
}

describe('DispositivosPage - cabecalho', () => {
  it('mostra o nome e o perfil de quem entrou', async () => {
    await montar();

    expect(screen.getByRole('heading', { name: /Ola, Solange/ })).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('encerra a sessao ao clicar em sair', async () => {
    const user = userEvent.setup();
    await montar();

    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(logoutSimulado).toHaveBeenCalledTimes(1);
  });

  it('mostra orientacao diferente para participante', async () => {
    useAuth.mockReturnValue({ user: PARTICIPANTE, logout: logoutSimulado, isAdmin: false });
    await montar();

    expect(screen.getByText(/pode solicitar emprestimos/)).toBeInTheDocument();
    expect(screen.queryByText(/cadastrar itens/)).not.toBeInTheDocument();
  });
});

describe('DispositivosPage - listagem', () => {
  it('exibe o estado de carregando antes da resposta', () => {
    render(<DispositivosPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando inventario...');
  });

  it('lista os dispositivos com patrimonio e situacao', async () => {
    await montar();

    // Restrito a tabela: as situacoes tambem aparecem nas opcoes do filtro.
    const tabela = within(screen.getByRole('table'));
    expect(tabela.getByText('Raspberry Pi 4 Model B')).toBeInTheDocument();
    expect(tabela.getByText('IOT-0002')).toBeInTheDocument();
    expect(tabela.getByText('Emprestado')).toBeInTheDocument();
    expect(tabela.getAllByText('Disponivel')).toHaveLength(2);
  });

  it('resume o total e quantos estao disponiveis', async () => {
    await montar();

    expect(screen.getByText(/3 dispositivo\(s\)/)).toBeInTheDocument();
    const resumo = screen.getByText(/dispositivo\(s\)/);
    expect(within(resumo).getByText('2')).toBeInTheDocument();
  });

  it('busca o inventario completo na primeira carga', async () => {
    await montar();

    expect(listarDispositivos).toHaveBeenCalledTimes(1);
    expect(listarDispositivos).toHaveBeenCalledWith({ q: '', status: '' });
  });

  it('avisa quando nenhum item e encontrado', async () => {
    listarDispositivos.mockResolvedValue([]);
    await montar();

    expect(screen.getByText('Nenhum dispositivo encontrado.')).toBeInTheDocument();
  });
});

describe('DispositivosPage - filtros', () => {
  it('repassa o termo digitado para a API', async () => {
    const user = userEvent.setup();
    await montar();

    await user.type(screen.getByLabelText('Buscar'), 'esp32');

    await waitFor(() => {
      expect(listarDispositivos).toHaveBeenLastCalledWith({ q: 'esp32', status: '' });
    });
  });

  it('repassa a situacao escolhida para a API', async () => {
    const user = userEvent.setup();
    await montar();

    await user.selectOptions(screen.getByLabelText('Situacao'), 'AVAILABLE');

    await waitFor(() => {
      expect(listarDispositivos).toHaveBeenLastCalledWith({ q: '', status: 'AVAILABLE' });
    });
  });

  it('oferece todas as situacoes possiveis no filtro', async () => {
    await montar();

    const select = screen.getByLabelText('Situacao');
    expect(within(select).getByRole('option', { name: 'Todas' })).toBeInTheDocument();
    expect(within(select).getByRole('option', { name: 'Disponivel' })).toBeInTheDocument();
    expect(within(select).getByRole('option', { name: 'Emprestado' })).toBeInTheDocument();
    expect(within(select).getByRole('option', { name: 'Em manutencao' })).toBeInTheDocument();
  });
});

describe('DispositivosPage - caso negativo', () => {
  it('mostra a mensagem de erro quando a API falha', async () => {
    listarDispositivos.mockRejectedValue(new Error('Nao foi possivel carregar o inventario.'));
    render(<DispositivosPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Nao foi possivel carregar o inventario.');
  });

  it('nao mostra a tabela quando a API falha', async () => {
    listarDispositivos.mockRejectedValue(new Error('Falha de rede'));
    render(<DispositivosPage />);

    await screen.findByRole('alert');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('encerra o carregamento mesmo quando a API falha', async () => {
    listarDispositivos.mockRejectedValue(new Error('Falha de rede'));
    render(<DispositivosPage />);

    await screen.findByRole('alert');
    expect(screen.queryByText('Carregando inventario...')).not.toBeInTheDocument();
  });
});
