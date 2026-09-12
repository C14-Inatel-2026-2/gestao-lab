import { mockApi, resetMockDb } from './mockApi';
import { addDaysISO } from '../../utils/format';

beforeEach(() => {
  resetMockDb();
});

describe('autenticacao', () => {
  it('autentica um usuario valido e devolve o token', async () => {
    const data = await mockApi.auth.login('solange@inatel.br', '123456');
    expect(data.user.role).toBe('ADMIN');
    expect(data.token).toBeTruthy();
  });

  it('rejeita senha incorreta', async () => {
    await expect(mockApi.auth.login('solange@inatel.br', 'errada')).rejects.toThrow(
      /Email ou senha invalidos/,
    );
  });

  it('bloqueia usuario inativo', async () => {
    await expect(mockApi.auth.login('ana@inatel.br', '123456')).rejects.toThrow(/inativo/i);
  });
});

describe('fluxo de emprestimo', () => {
  it('cria a solicitacao com status REQUESTED sem mudar o status do dispositivo', async () => {
    const loan = await mockApi.loans.create({
      deviceId: 3,
      projectId: 2,
      userId: 4,
      expectedReturnDate: addDaysISO(5),
    });

    expect(loan.status).toBe('REQUESTED');
    const device = await mockApi.devices.get(3);
    expect(device.status).toBe('AVAILABLE');
  });

  it('marca o dispositivo como emprestado ao aprovar', async () => {
    const loan = await mockApi.loans.create({
      deviceId: 3,
      projectId: 2,
      userId: 4,
      expectedReturnDate: addDaysISO(5),
    });

    const approved = await mockApi.loans.approve(loan.id, 1);
    expect(approved.status).toBe('APPROVED');

    const device = await mockApi.devices.get(3);
    expect(device.status).toBe('LOANED');
  });

  it('impede alocacao conflitante do mesmo dispositivo', async () => {
    await mockApi.loans.create({
      deviceId: 3,
      projectId: 2,
      userId: 4,
      expectedReturnDate: addDaysISO(5),
    });

    await expect(
      mockApi.loans.create({
        deviceId: 3,
        projectId: 2,
        userId: 5,
        expectedReturnDate: addDaysISO(9),
      }),
    ).rejects.toThrow(/ja possui uma solicitacao ou emprestimo em aberto/);
  });

  it('recusa dispositivo de outro laboratorio', async () => {
    await expect(
      mockApi.loans.create({
        deviceId: 7, // laboratorio de Redes
        projectId: 1, // projeto do laboratorio de IoT
        userId: 4,
        expectedReturnDate: addDaysISO(5),
      }),
    ).rejects.toThrow(/nao pertence ao laboratorio do projeto/);
  });

  it('recusa dispositivo em manutencao', async () => {
    await expect(
      mockApi.loans.create({
        deviceId: 4,
        projectId: 1,
        userId: 4,
        expectedReturnDate: addDaysISO(5),
      }),
    ).rejects.toThrow(/manutencao/i);
  });

  it('recusa projeto que nao esta ativo', async () => {
    await expect(
      mockApi.loans.create({
        deviceId: 7,
        projectId: 3, // projeto pausado
        userId: 5,
        expectedReturnDate: addDaysISO(5),
      }),
    ).rejects.toThrow(/nao esta ativo/);
  });

  it('libera o dispositivo ao registrar a devolucao', async () => {
    const returned = await mockApi.loans.markReturn(1);
    expect(returned.status).toBe('RETURNED');

    const device = await mockApi.devices.get(1);
    expect(device.status).toBe('AVAILABLE');
  });
});

describe('relatorios', () => {
  it('lista os itens em atraso com a quantidade de dias', async () => {
    const overdue = await mockApi.reports.overdue();
    expect(overdue.length).toBeGreaterThan(0);
    expect(overdue[0].daysLate).toBeGreaterThan(0);
    expect(overdue[0].status).toBe('OVERDUE');
  });

  it('resume o inventario por status', async () => {
    const overview = await mockApi.reports.overview();
    expect(overview.devices).toBe(
      overview.availableDevices + overview.loanedDevices + overview.maintenanceDevices,
    );
  });

  it('agrupa alocacoes por projeto', async () => {
    const rows = await mockApi.reports.allocationsByProject();
    const estacao = rows.find((row) => row.projectName === 'Estacao Meteorologica IoT');
    expect(estacao.devices).toBeGreaterThan(0);
  });
});

describe('inventario', () => {
  it('nao permite dois dispositivos com o mesmo patrimonio', async () => {
    await expect(
      mockApi.devices.create({ name: 'Duplicado', tag: 'IOT-0001', labId: 1, category: 'Placa' }),
    ).rejects.toThrow(/patrimonio/i);
  });

  it('bloqueia mudanca manual de status de item emprestado', async () => {
    await expect(mockApi.devices.updateStatus(1, 'MAINTENANCE')).rejects.toThrow(/devolucao/i);
  });

  it('filtra o inventario por laboratorio e status', async () => {
    const disponiveis = await mockApi.devices.list({ labId: 1, status: 'AVAILABLE' });
    expect(disponiveis.every((device) => device.labId === 1 && device.status === 'AVAILABLE')).toBe(true);
  });
});
