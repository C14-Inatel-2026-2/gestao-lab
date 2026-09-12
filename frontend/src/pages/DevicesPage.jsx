import { useState } from 'react';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ToastProvider';
import {
  Alert,
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
  DEVICE_STATUS,
  DEVICE_STATUS_LABELS,
  DEVICE_STATUS_TONES,
  optionsFromLabels,
} from '../utils/constants';
import { addDaysISO, formatDate, todayISO } from '../utils/format';

const EMPTY_FORM = {
  name: '',
  tag: '',
  category: '',
  labId: '',
  projectId: '',
  specs: '',
  acquiredAt: '',
};

const EMPTY_LOAN_FORM = { projectId: '', expectedReturnDate: addDaysISO(7), notes: '' };

export default function DevicesPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [filters, setFilters] = useState({ q: '', labId: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [loanDevice, setLoanDevice] = useState(null);
  const [loanForm, setLoanForm] = useState(EMPTY_LOAN_FORM);
  const [loanErrors, setLoanErrors] = useState({});

  const labs = useAsync(() => api.labs.list(), []);
  const projects = useAsync(() => api.projects.list(), []);
  const devices = useAsync(
    () => api.devices.list(filters),
    [filters.q, filters.labId, filters.status],
  );

  const labOptions = (labs.data || []).map((lab) => ({ value: lab.id, label: lab.name }));

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, labId: filters.labId || '', acquiredAt: todayISO() });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(device) {
    setEditing(device);
    setForm({
      name: device.name,
      tag: device.tag,
      category: device.category || '',
      labId: String(device.labId),
      projectId: device.projectId ? String(device.projectId) : '',
      specs: device.specs || '',
      acquiredAt: device.acquiredAt || '',
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Informe o nome do equipamento.';
    if (!form.tag.trim()) next.tag = 'Informe o numero de patrimonio.';
    if (!form.labId) next.labId = 'Selecione o laboratorio.';
    if (!form.category.trim()) next.category = 'Informe a categoria.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.devices.update(editing.id, form);
        toast.success('Dispositivo atualizado.');
      } else {
        await api.devices.create(form);
        toast.success('Dispositivo cadastrado.');
      }
      setModalOpen(false);
      devices.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api.devices.remove(toDelete.id);
      toast.success('Dispositivo removido.');
      setToDelete(null);
      devices.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(device, status) {
    try {
      await api.devices.updateStatus(device.id, status);
      toast.success('Status atualizado.');
      devices.reload();
    } catch (error) {
      toast.error(error.message);
    }
  }

  function openLoan(device) {
    setLoanDevice(device);
    setLoanForm({
      ...EMPTY_LOAN_FORM,
      projectId: device.projectId ? String(device.projectId) : '',
    });
    setLoanErrors({});
  }

  async function handleLoanSubmit() {
    const next = {};
    if (!loanForm.projectId) next.projectId = 'Selecione o projeto do emprestimo.';
    if (!loanForm.expectedReturnDate) next.expectedReturnDate = 'Informe a data prevista.';
    else if (loanForm.expectedReturnDate < todayISO()) {
      next.expectedReturnDate = 'A data prevista nao pode estar no passado.';
    }
    setLoanErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await api.loans.create({
        deviceId: loanDevice.id,
        projectId: loanForm.projectId,
        userId: user.id,
        expectedReturnDate: loanForm.expectedReturnDate,
        notes: loanForm.notes,
      });
      toast.success('Solicitacao enviada para aprovacao.');
      setLoanDevice(null);
      devices.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  // Um emprestimo so pode ser solicitado para um projeto do mesmo laboratorio do item.
  const loanProjectOptions = (projects.data || [])
    .filter((project) => loanDevice && project.labId === loanDevice.labId && project.status === 'ACTIVE')
    .map((project) => ({ value: project.id, label: project.name }));

  const formProjectOptions = (projects.data || [])
    .filter((project) => String(project.labId) === String(form.labId))
    .map((project) => ({ value: project.id, label: project.name }));

  return (
    <>
      <PageHeader
        title="Inventario de dispositivos"
        description="Equipamentos cadastrados por laboratorio, com status e vinculo com projetos."
        actions={isAdmin && <Button onClick={openCreate}>Novo dispositivo</Button>}
      />

      <Card flush>
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="toolbar">
            <div className="toolbar__search">
              <Input
                label="Buscar"
                placeholder="Nome, patrimonio, categoria ou especificacao"
                value={filters.q}
                onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              />
            </div>
            <Select
              label="Laboratorio"
              placeholder="Todos"
              value={filters.labId}
              onChange={(event) => setFilters({ ...filters, labId: event.target.value })}
              options={labOptions}
            />
            <Select
              label="Status"
              placeholder="Todos"
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
              options={optionsFromLabels(DEVICE_STATUS_LABELS)}
            />
          </div>
        </div>

        {devices.error && (
          <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
            <Alert tone="danger">{devices.error.message}</Alert>
          </div>
        )}

        {devices.loading ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              {
                key: 'name',
                header: 'Dispositivo',
                render: (device) => (
                  <div>
                    <div className="table__primary">{device.name}</div>
                    <div className="table__sub">{device.specs}</div>
                  </div>
                ),
              },
              { key: 'tag', header: 'Patrimonio' },
              { key: 'category', header: 'Categoria' },
              { key: 'labName', header: 'Laboratorio' },
              {
                key: 'projectName',
                header: 'Projeto',
                render: (device) => device.projectName || <span className="muted">Livre</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (device) => (
                  <StatusBadge status={device.status} labels={DEVICE_STATUS_LABELS} tones={DEVICE_STATUS_TONES} />
                ),
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (device) => (
                  <div className="table__actions">
                    {device.status === DEVICE_STATUS.AVAILABLE && (
                      <Button size="sm" onClick={() => openLoan(device)}>
                        Solicitar
                      </Button>
                    )}
                    {isAdmin && device.status === DEVICE_STATUS.AVAILABLE && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(device, DEVICE_STATUS.MAINTENANCE)}
                      >
                        Manutencao
                      </Button>
                    )}
                    {isAdmin && device.status === DEVICE_STATUS.MAINTENANCE && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(device, DEVICE_STATUS.AVAILABLE)}
                      >
                        Liberar
                      </Button>
                    )}
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(device)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setToDelete(device)}>
                          Excluir
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
            rows={devices.data}
            empty={
              <EmptyState
                icon="🔌"
                title="Nenhum dispositivo encontrado"
                description="Ajuste os filtros ou cadastre um novo equipamento."
              />
            }
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar dispositivo' : 'Novo dispositivo'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <Input
            label="Nome"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            error={errors.name}
            full
          />
          <Input
            label="Patrimonio"
            placeholder="IOT-0001"
            value={form.tag}
            onChange={(event) => setForm({ ...form, tag: event.target.value.toUpperCase() })}
            error={errors.tag}
          />
          <Input
            label="Categoria"
            placeholder="Sensor, Placa, Instrumento..."
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            error={errors.category}
          />
          <Select
            label="Laboratorio"
            placeholder="Selecione"
            value={form.labId}
            onChange={(event) => setForm({ ...form, labId: event.target.value, projectId: '' })}
            options={labOptions}
            error={errors.labId}
          />
          <Select
            label="Projeto (opcional)"
            placeholder="Sem vinculo"
            value={form.projectId}
            onChange={(event) => setForm({ ...form, projectId: event.target.value })}
            options={formProjectOptions}
          />
          <Input
            label="Data de aquisicao"
            type="date"
            value={form.acquiredAt}
            onChange={(event) => setForm({ ...form, acquiredAt: event.target.value })}
          />
          <Textarea
            label="Especificacoes"
            value={form.specs}
            onChange={(event) => setForm({ ...form, specs: event.target.value })}
            full
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(loanDevice)}
        title="Solicitar emprestimo"
        onClose={() => setLoanDevice(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLoanDevice(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleLoanSubmit} disabled={saving}>
              {saving ? 'Enviando...' : 'Enviar solicitacao'}
            </Button>
          </>
        }
      >
        <div className="stack">
          <div>
            <div className="detail__label">Dispositivo</div>
            <div className="detail__value">
              {loanDevice?.name} ({loanDevice?.tag})
            </div>
            <div className="table__sub">{loanDevice?.labName}</div>
          </div>

          {loanProjectOptions.length === 0 ? (
            <Alert tone="warning">
              Nao ha projetos ativos neste laboratorio. Todo emprestimo precisa estar atrelado a um projeto.
            </Alert>
          ) : (
            <Select
              label="Projeto"
              placeholder="Selecione o projeto"
              value={loanForm.projectId}
              onChange={(event) => setLoanForm({ ...loanForm, projectId: event.target.value })}
              options={loanProjectOptions}
              error={loanErrors.projectId}
            />
          )}

          <Input
            label="Devolucao prevista"
            type="date"
            min={todayISO()}
            value={loanForm.expectedReturnDate}
            onChange={(event) => setLoanForm({ ...loanForm, expectedReturnDate: event.target.value })}
            error={loanErrors.expectedReturnDate}
            hint={`Hoje: ${formatDate(todayISO())}`}
          />

          <Textarea
            label="Justificativa (opcional)"
            value={loanForm.notes}
            onChange={(event) => setLoanForm({ ...loanForm, notes: event.target.value })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir dispositivo"
        message={`Excluir "${toDelete?.name}" (${toDelete?.tag}) do inventario?`}
        confirmLabel="Excluir"
        busy={saving}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
