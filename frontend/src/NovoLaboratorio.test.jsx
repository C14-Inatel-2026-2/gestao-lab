import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NovoLaboratorio from './NovoLaboratorio';
import { ApiError, criarLaboratorio } from './api';

/* Testes unitarios COM mock: o POST /api/labs e dublado. */

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  criarLaboratorio: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('NovoLaboratorio (com mock)', () => {
  it('cadastra o laboratorio, confirma na tela e recarrega a lista', async () => {
    // Arranjo
    const user = userEvent.setup();
    const onCriado = jest.fn();
    criarLaboratorio.mockResolvedValue({ id: 3, name: 'Laboratorio de IoT' });
    render(<NovoLaboratorio token="tk" onCriado={onCriado} />);

    // Acao
    await user.click(screen.getByRole('button', { name: 'Cadastrar laboratorio' }));
    await user.type(screen.getByLabelText('Nome do laboratorio'), 'Laboratorio de IoT');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    // Verificacao: enviou no formato do LaboratoryRequest e confirmou
    expect(criarLaboratorio).toHaveBeenCalledWith({ token: 'tk', name: 'Laboratorio de IoT' });
    expect(await screen.findByRole('status')).toHaveTextContent('Laboratorio de IoT" cadastrado.');
    expect(onCriado).toHaveBeenCalledTimes(1);
  });

  // CASO NEGATIVO
  it('barra nome em branco sem chamar a API', async () => {
    // Mesma regra do LaboratoryService: nome obrigatorio e nao so espacos
    const user = userEvent.setup();
    render(<NovoLaboratorio token="tk" onCriado={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cadastrar laboratorio' }));
    await user.type(screen.getByLabelText('Nome do laboratorio'), '   ');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o nome do laboratorio.');
    expect(criarLaboratorio).not.toHaveBeenCalled();
  });

  // CASO NEGATIVO
  it('mostra o 403 do backend quando o usuario nao e administrador', async () => {
    const user = userEvent.setup();
    const onCriado = jest.fn();
    criarLaboratorio.mockRejectedValue(new ApiError('Access denied', 403));
    render(<NovoLaboratorio token="tk" onCriado={onCriado} />);

    await user.click(screen.getByRole('button', { name: 'Cadastrar laboratorio' }));
    await user.type(screen.getByLabelText('Nome do laboratorio'), 'Laboratorio de Redes');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
    expect(onCriado).not.toHaveBeenCalled();
  });
});
