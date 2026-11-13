import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmprestimoForm from './EmprestimoForm';
import { solicitarEmprestimo } from './api';

/* Testes unitarios COM mock: o POST /api/loans e dublado. */

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  solicitarEmprestimo: jest.fn(),
}));

const LABS = [{ id: 2, nome: 'Laboratorio de Redes' }];

async function preencher(user, { inicio, fim }) {
  await user.click(screen.getByRole('button', { name: 'Solicitar emprestimo' }));
  await user.selectOptions(screen.getByLabelText('Laboratorio'), '2');
  await user.type(screen.getByLabelText('Inicio'), inicio);
  await user.type(screen.getByLabelText('Fim'), fim);
  await user.click(screen.getByRole('button', { name: 'Solicitar' }));
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('EmprestimoForm (com mock)', () => {
  it('envia o periodo no formato do LoanRequest e confirma o emprestimo', async () => {
    // Arranjo
    const user = userEvent.setup();
    solicitarEmprestimo.mockResolvedValue({ id: 5, userId: 1, laboratoryId: 2 });
    render(<EmprestimoForm token="tk" laboratorios={LABS} />);

    // Acao
    await preencher(user, { inicio: '2026-12-01T08:00', fim: '2026-12-01T10:00' });

    // Verificacao: o solicitante nao vai no corpo, o backend usa o token
    expect(solicitarEmprestimo).toHaveBeenCalledWith({
      token: 'tk',
      laboratoryId: '2',
      startDateTime: '2026-12-01T08:00',
      endDateTime: '2026-12-01T10:00',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Emprestimo 5 registrado.');
  });

  // CASO NEGATIVO
  it('barra fim anterior ao inicio sem chamar a API', async () => {
    // Mesma regra do LoanService: endDateTime precisa ser depois de startDateTime
    const user = userEvent.setup();
    render(<EmprestimoForm token="tk" laboratorios={LABS} />);

    await preencher(user, { inicio: '2026-12-01T10:00', fim: '2026-12-01T08:00' });

    expect(await screen.findByRole('alert')).toHaveTextContent('O fim deve ser depois do inicio.');
    expect(solicitarEmprestimo).not.toHaveBeenCalled();
  });
});
