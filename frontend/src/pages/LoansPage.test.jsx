import { screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoansPage from './LoansPage';
import { renderWithProviders, signIn, ADMIN_USER, PARTICIPANT_USER } from '../__tests__/testUtils';
import { api, resetMockDb } from '../api';

beforeEach(() => {
  localStorage.clear();
  resetMockDb();
});

async function renderPage(user = ADMIN_USER) {
  signIn(user);
  renderWithProviders(<LoansPage />);
  await waitForElementToBeRemoved(() => screen.queryAllByRole('status', { name: 'Carregando' })[0]);
}

describe('LoansPage', () => {
  it('lista os emprestimos com status traduzido', async () => {
    await renderPage();

    expect(await screen.findByText('Raspberry Pi 4 Model B')).toBeInTheDocument();
    expect(screen.getAllByText('Em atraso').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Solicitado').length).toBeGreaterThan(0);
  });

  it('permite ao administrador aprovar uma solicitacao pendente', async () => {
    const user = userEvent.setup();
    await renderPage(ADMIN_USER);

    const row = screen.getByText('ESP32 DevKit v1').closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Aprovar' }));

    await waitFor(async () => {
      const device = await api.devices.get(2);
      expect(device.status).toBe('LOANED');
    });
  });

  it('nao oferece aprovacao para participantes', async () => {
    await renderPage(PARTICIPANT_USER);
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument();
  });

  it('registra a devolucao e libera o dispositivo', async () => {
    const user = userEvent.setup();
    await renderPage(ADMIN_USER);

    const row = screen.getByText('Servo Motor MG996R').closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Registrar devolucao' }));

    const dialog = await screen.findByRole('dialog', { name: 'Registrar devolucao' });
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar devolucao' }));

    await waitFor(async () => {
      const device = await api.devices.get(9);
      expect(device.status).toBe('AVAILABLE');
    });
  });

  it('exige projeto e dispositivo ao abrir uma nova solicitacao', async () => {
    const user = userEvent.setup();
    await renderPage(PARTICIPANT_USER);

    await user.click(screen.getByRole('button', { name: 'Solicitar emprestimo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Solicitar emprestimo' });
    await user.click(within(dialog).getByRole('button', { name: 'Enviar solicitacao' }));

    expect(await within(dialog).findByText('Selecione o projeto.')).toBeInTheDocument();
    expect(within(dialog).getByText('Selecione o dispositivo.')).toBeInTheDocument();
  });
});
