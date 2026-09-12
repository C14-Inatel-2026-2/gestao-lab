import { screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevicesPage from './DevicesPage';
import { renderWithProviders, signIn, ADMIN_USER, PARTICIPANT_USER } from '../__tests__/testUtils';
import { resetMockDb } from '../api';

beforeEach(() => {
  localStorage.clear();
  resetMockDb();
});

async function renderPage(user = ADMIN_USER) {
  signIn(user);
  renderWithProviders(<DevicesPage />);
  await waitForElementToBeRemoved(() => screen.queryAllByRole('status', { name: 'Carregando' })[0]);
}

describe('DevicesPage', () => {
  it('lista o inventario com patrimonio e status', async () => {
    await renderPage();

    expect(await screen.findByText('Raspberry Pi 4 Model B')).toBeInTheDocument();
    expect(screen.getByText('IOT-0002')).toBeInTheDocument();
    expect(screen.getAllByText('Disponivel').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Em manutencao').length).toBeGreaterThan(0);
  });

  it('filtra os dispositivos pela busca', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.type(screen.getByLabelText('Buscar'), 'osciloscopio');

    expect(await screen.findByText('Osciloscopio Rigol DS1054Z')).toBeInTheDocument();
    expect(screen.queryByText('Raspberry Pi 4 Model B')).not.toBeInTheDocument();
  });

  it('mostra as acoes de cadastro apenas para administradores', async () => {
    await renderPage(ADMIN_USER);
    expect(screen.getByRole('button', { name: 'Novo dispositivo' })).toBeInTheDocument();
  });

  it('esconde o cadastro para participantes', async () => {
    await renderPage(PARTICIPANT_USER);
    expect(screen.queryByRole('button', { name: 'Novo dispositivo' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Solicitar' }).length).toBeGreaterThan(0);
  });

  it('valida o formulario de cadastro de dispositivo', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(screen.getByRole('button', { name: 'Novo dispositivo' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await within(dialog).findByText('Informe o nome do equipamento.')).toBeInTheDocument();
    expect(within(dialog).getByText('Informe o numero de patrimonio.')).toBeInTheDocument();
    expect(within(dialog).getByText('Selecione o laboratorio.')).toBeInTheDocument();
  });

  it('abre a solicitacao de emprestimo com o dispositivo escolhido', async () => {
    const user = userEvent.setup();
    await renderPage(PARTICIPANT_USER);

    const row = screen.getByText('ESP32 DevKit v1').closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Solicitar' }));

    const dialog = await screen.findByRole('dialog', { name: 'Solicitar emprestimo' });
    expect(within(dialog).getByText(/ESP32 DevKit v1/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Devolucao prevista')).toBeInTheDocument();
  });
});
