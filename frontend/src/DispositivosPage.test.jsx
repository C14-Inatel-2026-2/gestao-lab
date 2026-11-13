import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DispositivosPage from './DispositivosPage';
import { useAuth } from './AuthContext';
import { alterarStatus, listarDispositivos } from './api';

/*
 * Testes unitarios COM mock.
 *
 * A tela e testada isolada: as funcoes de rede de api.js e o useAuth sao
 * substituidos por dubles. Isso permite verificar com quais filtros a API foi
 * chamada e simular falhas sob demanda - mesmo papel do Mockito no backend.
 *
 * As constantes vem do api.js real (requireActual), para o teste nao passar com
 * um enum defasado se DeviceStatus mudar no backend.
 */

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  listarDispositivos: jest.fn(),
  alterarStatus: jest.fn(),
}));

const ITENS = [
  { id: 1, name: 'ESP32 DevKit v1', description: 'Placa', status: 'AVAILABLE', laboratoryId: 1, laboratoryName: 'Laboratorio de IoT' },
  { id: 2, name: 'Servo Motor MG996R', description: 'Atuador', status: 'BORROWED', laboratoryId: 2, laboratoryName: 'Laboratorio de Robotica' },
];

function autenticarComo(role) {
  useAuth.mockReturnValue({
    user: { id: 1, name: 'Solange Ribeiro da Fonseca', role },
    token: 'token-de-teste',
    logout: jest.fn(),
    isAdmin: role === 'ADMIN',
  });
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('DispositivosPage (com mock)', () => {
  it('busca o inventario com o token e lista os dispositivos', async () => {
    // Arranjo: a API simulada devolve dois itens
    autenticarComo('PARTICIPANT');
    listarDispositivos.mockResolvedValue(ITENS);

    // Acao
    render(<DispositivosPage />);

    // Verificacao: chamou com o token e sem filtros, e exibiu o resultado
    expect(listarDispositivos).toHaveBeenCalledWith({
      token: 'token-de-teste',
      laboratoryId: '',
      status: '',
    });

    expect(await screen.findByText('ESP32 DevKit v1')).toBeInTheDocument();
    // getByRole('cell') evita casar com a <option> do filtro de laboratorio
    expect(screen.getByRole('cell', { name: 'Laboratorio de IoT' })).toBeInTheDocument();
    expect(screen.getByText(/2 dispositivo\(s\)/)).toBeInTheDocument();
  });

  // CASO NEGATIVO
  it('mostra mensagem de erro e nenhuma tabela quando a API falha', async () => {
    autenticarComo('PARTICIPANT');
    listarDispositivos.mockRejectedValue(new Error('Authentication required'));

    render(<DispositivosPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Authentication required');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('participante ve a situacao como texto; administrador pode alterar', async () => {
    // Arranjo: participante primeiro
    autenticarComo('PARTICIPANT');
    listarDispositivos.mockResolvedValue(ITENS);

    const { unmount } = render(<DispositivosPage />);
    expect(await screen.findByText('Disponivel')).toBeInTheDocument();
    expect(screen.queryByLabelText('Situacao de ESP32 DevKit v1')).not.toBeInTheDocument();
    unmount();

    // Acao: agora como administrador, trocando a situacao de um item
    autenticarComo('ADMIN');
    alterarStatus.mockResolvedValue({ ...ITENS[0], status: 'MAINTENANCE' });
    render(<DispositivosPage />);

    const seletor = await screen.findByLabelText('Situacao de ESP32 DevKit v1');
    await userEvent.selectOptions(seletor, 'MAINTENANCE');

    // Verificacao
    expect(alterarStatus).toHaveBeenCalledWith({
      token: 'token-de-teste',
      id: 1,
      status: 'MAINTENANCE',
    });
  });
});
