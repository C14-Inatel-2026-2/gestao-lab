import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NovoDispositivo from './NovoDispositivo';
import { ApiError, criarDispositivo } from './api';

/* Testes unitarios COM mock: o POST /api/devices e dublado. */

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  criarDispositivo: jest.fn(),
}));

const LABS = [{ id: 1, nome: 'Laboratorio de IoT' }];

afterEach(() => {
  jest.clearAllMocks();
});

describe('NovoDispositivo (com mock)', () => {
  it('cadastra o dispositivo no formato do DeviceRequest e recarrega a lista', async () => {
    // Arranjo
    const user = userEvent.setup();
    const onCriado = jest.fn();
    criarDispositivo.mockResolvedValue({ id: 9, name: 'ESP32', status: 'AVAILABLE' });
    render(<NovoDispositivo token="tk" laboratorios={LABS} onCriado={onCriado} />);

    // Acao
    await user.click(screen.getByRole('button', { name: 'Cadastrar dispositivo' }));
    await user.type(screen.getByLabelText('Nome'), 'ESP32');
    await user.type(screen.getByLabelText('Descricao'), 'Placa');
    await user.selectOptions(screen.getByLabelText('Laboratorio'), '1');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    // Verificacao
    expect(criarDispositivo).toHaveBeenCalledWith({
      token: 'tk', name: 'ESP32', description: 'Placa', laboratoryId: '1',
    });
    expect(onCriado).toHaveBeenCalledTimes(1);
  });

  // CASO NEGATIVO
  it('mostra o 403 do backend e nao recarrega a lista', async () => {
    const user = userEvent.setup();
    const onCriado = jest.fn();
    criarDispositivo.mockRejectedValue(new ApiError('Access denied', 403));
    render(<NovoDispositivo token="tk" laboratorios={LABS} onCriado={onCriado} />);

    await user.click(screen.getByRole('button', { name: 'Cadastrar dispositivo' }));
    await user.type(screen.getByLabelText('Nome'), 'ESP32');
    await user.selectOptions(screen.getByLabelText('Laboratorio'), '1');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
    expect(onCriado).not.toHaveBeenCalled();
  });
});
