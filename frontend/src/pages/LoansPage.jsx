import { useState } from 'react';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ToastProvider';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
  Table,
  Textarea,
} from '../components/ui';
import {
  LOAN_STATUS,
  LOAN_STATUS_LABELS,
  LOAN_STATUS_TONES,
  optionsFromLabels,
} from '../utils/constants';
import { addDaysISO, formatDate, formatDateTime, todayISO } from '../utils/format';

const EMPTY_FORM = { labId: '', projectId: '', deviceId: '', expectedReturnDate: addDaysISO(7), notes: '' };

export default function LoansPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [scope, setScope] = useState(isAdmin ? 'all' : 'mine');
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toReturn, setToReturn] = useState(null);
  const [toReject, setToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const labs = useAsync(() => api.labs.list(), []);
  const projects = useAsync(() => api.projects.list(), []);
  const devices = useAsync(() => api.devices.list({ status: 'AVAILABLE' }), []);

  const loans = useAsync(
    () =>
      api.loans.list({
        ...filters,
        ...(scope === 'mine' ? { userId: user.id } : {}),
      }),
    [filters.q, filters.status, scope, user.id],
  );

  function refreshAll() {
    loans.reload();
    devices.reload();
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const next = {};
    if (!form.projectId) next.projectId = 'Selecione o projeto.';
    if (!form.deviceId) next.deviceId = 'Selecione o dispositivo.';
    if (!form.expectedReturnDate) next.expectedReturnDate = 'Informe a data prevista de devolucao.';
    else if (form.expectedReturnDate < todayISO()) {
      next.expectedReturnDate = 'A data prevista nao pode estar no passado.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.loans.create({
        deviceId: form.deviceId,
        projectId: form.projectId,
        userId: user.id,
        expectedReturnDate: form.expectedReturnDate,
        notes: form.notes,
      });
      toast.success('Solicitacao registrada. Aguarde a aprovacao do administrador.');
      setModalOpen(false);
      refreshAll();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(loan) {
    try {
      await api.loans.approve(loan.id, user.id);
      toast.success('Emprestimo aprovado. O dispositivo foi marcado como emprestado.');
      refreshAll();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleReject() {
    setSaving(true);
    try {
      await api.loans.reject(toReject.id, rejectReason, user.id);
      toast.success('Solicitacao recusada.');
      setToReject(null);
      setRejectReason('');
      refreshAll();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleReturn() {
    setSaving(true);
    try {
      await api.loans.markReturn(toReturn.id);
      toast.success('Devolucao registrada. Dispositivo disponivel novamente.');
      setToReturn(null);
      refreshAll();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  const labOptions = (labs.data || []).map((lab) => ({ value: lab.id, label: lab.name }));
  const projectOptions = (projects.data || [])
    .filter((project) => project.status === 'ACTIVE')
    .filter((project) => (form.labId ? String(project.labId) === String(form.labId) : true))
    .map((project) => ({ value: project.id, label: project.name }));

  const selectedProject = (projects.data || []).find(
    (project) => String(project.id) === String(form.projectId),
  );
  const deviceOptions = (devices.data || [])
    .filter((device) => (selectedProject ? device.labId === selectedProject.labId : false))
    .map((device) => ({ value: device.id, label: `${device.name} (${device.tag})` }));

  return (
    <>
      <PageHeader
        title="Emprestimos e devolucoes"
        description="Toda solicitacao e atrelada a um projeto; o sistema valida a disponibilidade antes de liberar o item."
        actions={<Button onClick={openCreate}>Solicitar emprestimo</Button>}
      />

      <Card flush>
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="toolbar">
            <div className="toolbar__search">
              <Input
                label="Buscar"
                placeholder="Dispositivo, projeto ou solicitante"
                value={filters.q}
                onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              />
            </div>
            <Select
              label="Status"
              placeholder="Todos"
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
              options={optionsFromLabels(LOAN_STATUS_LABELS)}
            />
            <Select
              label="Escopo"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              options={[
                { value: 'mine', label: 'Meus emprestimos' },
                ...(isAdmin ? [{ value: 'all', label: 'Todos os emprestimos' }] : []),
              ]}
            />
          </div>
        </div>

        {loans.error && (
          <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
            <Alert tone="danger">{loans.error.message}</Alert>
          </div>
        )}

        {loans.loading ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              {
                key: 'device',
                header: 'Dispositivo',
                render: (loan) => (
                  <div>
                    <div className="table__primary">{loan.deviceName}</div>
                    <div className="table__sub">
                      {loan.deviceTag} - {loan.labName}
                    </div>
                  </div>
                ),
              },
              { key: 'projectName', header: 'Projeto' },
              { key: 'userName', header: 'Solicitante' },
              {
                key: 'requestedAt',
                header: 'Solicitado em',
                render: (loan) => <span className="text-sm">{formatDateTime(loan.requestedAt)}</span>,
              },
              {
                key: 'expectedReturnDate',
                header: 'Devolucao prevista',
                render: (loan) => (
                  <div>
                    <div>{formatDate(loan.expectedReturnDate)}</div>
                    {loan.daysLate > 0 && (
                      <div className="table__sub">
                        <Badge tone="danger">{loan.daysLate} dia(s) de atraso</Badge>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (loan) => (
                  <StatusBadge status={loan.status} labels={LOAN_STATUS_LABELS} tones={LOAN_STATUS_TONES} />
                ),
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (loan) => (
                  <div className="table__actions">
                    {isAdmin && loan.status === LOAN_STATUS.REQUESTED && (
                      <>
                        <Button variant="success" size="sm" onClick={() => handleApprove(loan)}>
                          Aprovar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setToReject(loan)}>
                          Recusar
                        </Button>
                      </>
                    )}
                    {(loan.status === LOAN_STATUS.APPROVED || loan.status === LOAN_STATUS.OVERDUE) &&
                      (isAdmin || loan.userId === user.id) && (
                        <Button variant="secondary" size="sm" onClick={() => setToReturn(loan)}>
                          Registrar devolucao
                        </Button>
                      )}
                  </div>
                ),
              },
            ]}
            rows={loans.data}
            empty={
              <EmptyState
                icon="🔄"
                title="Nenhum emprestimo encontrado"
                description="Solicite um equipamento para um projeto ativo."
              />
            }
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Solicitar emprestimo"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Enviando...' : 'Enviar solicitacao'}
            </Button>
          </>
        }
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <Select
            label="Laboratorio"
            placeholder="Todos"
            value={form.labId}
            onChange={(event) => setForm({ ...form, labId: event.target.value, projectId: '', deviceId: '' })}
            options={labOptions}
          />
          <Select
            label="Projeto"
            placeholder="Selecione"
            value={form.projectId}
            onChange={(event) => setForm({ ...form, projectId: event.target.value, deviceId: '' })}
            options={projectOptions}
            error={errors.projectId}
          />
          <Select
            label="Dispositivo disponivel"
            placeholder={form.projectId ? 'Selecione' : 'Escolha o projeto primeiro'}
            value={form.deviceId}
            onChange={(event) => setForm({ ...form, deviceId: event.target.value })}
            options={deviceOptions}
            error={errors.deviceId}
            disabled={!form.projectId}
          />
          <Input
            label="Devolucao prevista"
            type="date"
            min={todayISO()}
            value={form.expectedReturnDate}
            onChange={(event) => setForm({ ...form, expectedReturnDate: event.target.value })}
            error={errors.expectedReturnDate}
          />
          <Textarea
            label="Justificativa (opcional)"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            full
          />
          {form.projectId && deviceOptions.length === 0 && (
            <div className="form-grid--full">
              <Alert tone="warning">
                Nenhum dispositivo disponivel no laboratorio deste projeto no momento.
              </Alert>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(toReject)}
        title="Recusar solicitacao"
        onClose={() => setToReject(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToReject(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleReject} disabled={saving}>
              Recusar
            </Button>
          </>
        }
      >
        <div className="stack">
          <p>
            Recusar o emprestimo de <strong>{toReject?.deviceName}</strong> solicitado por{' '}
            {toReject?.userName}?
          </p>
          <Textarea
            label="Motivo"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toReturn)}
        title="Registrar devolucao"
        message={`Confirmar a devolucao de "${toReturn?.deviceName}"? O dispositivo voltara para o status Disponivel.`}
        confirmLabel="Confirmar devolucao"
        busy={saving}
        onConfirm={handleReturn}
        onClose={() => setToReturn(null)}
      />
    </>
  );
}
