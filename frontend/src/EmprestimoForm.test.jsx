import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmprestimoForm from './EmprestimoForm';
import { ApiError, solicitarEmprestimo } from './api';

/* Testes unitarios COM mock: o POST /api/loans e dublado. */

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  solicitarEmprestimo: jest.fn(),
}));

const DISPOSITIVOS = [
  { id: 1, name: 'ESP32 DevKit v1', status: 'AVAILABLE', laboratoryId: 1, laboratoryName: 'IoT' },
  { id: 2, name: 'Osciloscopio', status: 'MAINTENANCE', laboratoryId: 1, laboratoryName: 'IoT' },
  { id: 3, name: 'Switch Cisco', status: 'AVAILABLE', laboratoryId: 2, laboratoryName: 'Redes' },
];

afterEach(() => {
  jest.clearAllMocks();
});

describe('EmprestimoForm (com mock)', () => {
  it('envia laboratorio, dispositivo e periodo no formato do LoanRequest', async () => {
    // Arranjo
    const user = userEvent.setup();
    const onSolicitado = jest.fn();
    solicitarEmprestimo.mockResolvedValue({ id: 5, status: 'REQUESTED' });
    render(<EmprestimoForm token="tk" dispositivos={DISPOSITIVOS} onSolicitado={onSolicitado} />);

    // Acao
    await user.selectOptions(screen.getByLabelText('Laboratorio'), '1');
    await user.selectOptions(screen.getByLabelText('Dispositivo'), '1');
    await user.type(screen.getByLabelText('Inicio'), '2026-12-01T08:00');
    await user.type(screen.getByLabelText('Fim'), '2026-12-01T10:00');
    await user.click(screen.getByRole('button', { name: 'Solicitar' }));

    // Verificacao: o solicitante nao vai no corpo, o backend usa o token
    expect(solicitarEmprestimo).toHaveBeenCalledWith({
      token: 'tk',
      laboratoryId: '1',
      deviceId: '1',
      startDateTime: '2026-12-01T08:00',
      endDateTime: '2026-12-01T10:00',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('aguardando aprovacao');
    expect(onSolicitado).toHaveBeenCalledTimes(1);
  });

  it('oferece apenas dispositivos do laboratorio escolhido e fora de manutencao', async () => {
    // O LoanService recusa dispositivo de outro laboratorio e em manutencao,
    // entao esses casos nem chegam a ser oferecidos.
    const user = userEvent.setup();
    render(<EmprestimoForm token="tk" dispositivos={DISPOSITIVOS} />);

    await user.selectOptions(screen.getByLabelText('Laboratorio'), '1');

    const opcoes = screen.getByLabelText('Dispositivo');
    expect(opcoes).toHaveTextContent('ESP32 DevKit v1');
    expect(opcoes).not.toHaveTextContent('Osciloscopio');
    expect(opcoes).not.toHaveTextContent('Switch Cisco');
  });

  // CASO NEGATIVO
  it('barra fim anterior ao inicio sem chamar a API', async () => {
    // Mesma regra do LoanService: endDateTime precisa ser depois de startDateTime
    const user = userEvent.setup();
    render(<EmprestimoForm token="tk" dispositivos={DISPOSITIVOS} />);

    await user.selectOptions(screen.getByLabelText('Laboratorio'), '1');
    await user.selectOptions(screen.getByLabelText('Dispositivo'), '1');
    await user.type(screen.getByLabelText('Inicio'), '2026-12-01T10:00');
    await user.type(screen.getByLabelText('Fim'), '2026-12-01T08:00');
    await user.click(screen.getByRole('button', { name: 'Solicitar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('O fim deve ser depois do inicio.');
    expect(solicitarEmprestimo).not.toHaveBeenCalled();
  });

  // CASO NEGATIVO
  it('mostra a recusa do backend quando o periodo ja esta reservado', async () => {
    const user = userEvent.setup();
    solicitarEmprestimo.mockRejectedValue(new ApiError('Device is already booked for this period', 400));
    render(<EmprestimoForm token="tk" dispositivos={DISPOSITIVOS} />);

    await user.selectOptions(screen.getByLabelText('Laboratorio'), '1');
    await user.selectOptions(screen.getByLabelText('Dispositivo'), '1');
    await user.type(screen.getByLabelText('Inicio'), '2026-12-01T08:00');
    await user.type(screen.getByLabelText('Fim'), '2026-12-01T10:00');
    await user.click(screen.getByRole('button', { name: 'Solicitar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Device is already booked for this period');
  });
});
