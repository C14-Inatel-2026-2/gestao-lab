import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmprestimosPage from './EmprestimosPage';
import { useAuth } from './AuthContext';
import {
  aprovarEmprestimo, ApiError, listarDispositivos, listarEmprestimos, listarLaboratorios,
  registrarDevolucao,
} from './api';

/*
 * Testes unitarios COM mock: as chamadas de rede sao dubladas e as constantes
 * vem do api.js real, para o teste nao passar com um LoanStatus defasado.
 */

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  listarEmprestimos: jest.fn(),
  listarDispositivos: jest.fn(),
  listarLaboratorios: jest.fn(),
  aprovarEmprestimo: jest.fn(),
  rejeitarEmprestimo: jest.fn(),
  registrarDevolucao: jest.fn(),
}));

const LABORATORIOS = [{ id: 1, name: 'Laboratorio de IoT' }, { id: 2, name: 'Laboratorio de Robotica' }];

const DISPOSITIVOS = [
  { id: 1, name: 'ESP32 DevKit v1', status: 'AVAILABLE', laboratoryId: 1, laboratoryName: 'IoT' },
];

const EMPRESTIMOS = [
  { id: 10, userId: 2, laboratoryId: 1, deviceId: 1, status: 'REQUESTED', startDateTime: '2026-12-01T08:00', endDateTime: '2026-12-01T10:00' },
  { id: 11, userId: 2, laboratoryId: 1, deviceId: 1, status: 'APPROVED', startDateTime: '2026-12-02T08:00', endDateTime: '2026-12-02T10:00' },
];

function autenticarComo(role) {
  useAuth.mockReturnValue({ token: 'tk', isAdmin: role === 'ADMIN' });
}

beforeEach(() => {
  listarDispositivos.mockResolvedValue(DISPOSITIVOS);
  listarLaboratorios.mockResolvedValue(LABORATORIOS);
  listarEmprestimos.mockResolvedValue(EMPRESTIMOS);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('EmprestimosPage (com mock)', () => {
  it('lista os emprestimos com o nome do dispositivo e a situacao', async () => {
    autenticarComo('PARTICIPANT');

    render(<EmprestimosPage />);

    expect(await screen.findByText('Solicitado')).toBeInTheDocument();
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
    // O periodo vem do backend em ISO e e exibido em pt-BR
    expect(screen.getByText(/01\/12\/2026 08:00/)).toBeInTheDocument();
    expect(listarEmprestimos).toHaveBeenCalledWith({ token: 'tk' });
  });

  it('participante nao ve acoes de administrador', async () => {
    autenticarComo('PARTICIPANT');

    render(<EmprestimosPage />);
    await screen.findByText('Solicitado');

    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar devolucao' })).not.toBeInTheDocument();
  });

  it('administrador aprova o solicitado e devolve o aprovado, e a lista recarrega', async () => {
    // Arranjo
    autenticarComo('ADMIN');
    aprovarEmprestimo.mockResolvedValue({ ...EMPRESTIMOS[0], status: 'APPROVED' });
    registrarDevolucao.mockResolvedValue({ ...EMPRESTIMOS[1], status: 'RETURNED' });
    render(<EmprestimosPage />);

    // Acao: aprovar o que esta Solicitado
    await userEvent.click(await screen.findByRole('button', { name: 'Aprovar' }));

    // Verificacao
    expect(aprovarEmprestimo).toHaveBeenCalledWith({ token: 'tk', id: 10 });
    await waitFor(() => expect(listarEmprestimos).toHaveBeenCalledTimes(2));

    // Acao: registrar devolucao do que esta Aprovado
    await userEvent.click(screen.getByRole('button', { name: 'Registrar devolucao' }));
    expect(registrarDevolucao).toHaveBeenCalledWith({ token: 'tk', id: 11 });
  });

  // CASO NEGATIVO
  it('mostra a recusa do backend quando a acao e invalida para o status', async () => {
    autenticarComo('ADMIN');
    aprovarEmprestimo.mockRejectedValue(new ApiError('Only requested loans can be approved', 400));

    render(<EmprestimosPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Aprovar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Only requested loans can be approved');
  });
});
