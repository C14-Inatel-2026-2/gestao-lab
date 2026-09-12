import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  optionsFromLabels,
} from '../utils/constants';
import { formatDate, todayISO } from '../utils/format';

const EMPTY_FORM = {
  name: '',
  labId: '',
  status: 'ACTIVE',
  startDate: todayISO(),
  endDate: '',
  description: '',
};

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [filters, setFilters] = useState({ q: '', labId: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const labs = useAsync(() => api.labs.list(), []);
  const projects = useAsync(
    () => api.projects.list(filters),
    [filters.q, filters.labId, filters.status],
  );

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, labId: filters.labId || '' });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(project) {
    setEditing(project);
    setForm({
      name: project.name,
      labId: String(project.labId),
      status: project.status,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      description: project.description || '',
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Informe o nome do projeto.';
    if (!form.labId) next.labId = 'Selecione o laboratorio.';
    if (!form.startDate) next.startDate = 'Informe a data de inicio.';
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      next.endDate = 'A data de termino deve ser posterior ao inicio.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.projects.update(editing.id, form);
        toast.success('Projeto atualizado.');
      } else {
        await api.projects.create(form);
        toast.success('Projeto criado.');
      }
      setModalOpen(false);
      projects.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api.projects.remove(toDelete.id);
      toast.success('Projeto removido.');
      setToDelete(null);
      projects.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  const labOptions = (labs.data || []).map((lab) => ({ value: lab.id, label: lab.name }));

  return (
    <>
      <PageHeader
        title="Projetos"
        description="Projetos concentram os participantes e os dispositivos alocados de cada laboratorio."
        actions={isAdmin && <Button onClick={openCreate}>Novo projeto</Button>}
      />

      <Card flush>
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="toolbar">
            <div className="toolbar__search">
              <Input
                label="Buscar"
                placeholder="Nome ou descricao"
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
              options={optionsFromLabels(PROJECT_STATUS_LABELS)}
            />
          </div>
        </div>

        {projects.error && (
          <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
            <Alert tone="danger">{projects.error.message}</Alert>
          </div>
        )}

        {projects.loading ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              {
                key: 'name',
                header: 'Projeto',
                render: (project) => (
                  <div>
                    <Link to={`/projetos/${project.id}`} className="table__primary">
                      {project.name}
                    </Link>
                    <div className="table__sub">{project.labName}</div>
                  </div>
                ),
              },
              {
                key: 'period',
                header: 'Periodo',
                render: (project) => (
                  <div className="text-sm">
                    {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : 'em aberto'}
                  </div>
                ),
              },
              { key: 'memberCount', header: 'Participantes' },
              { key: 'deviceCount', header: 'Dispositivos' },
              { key: 'activeLoans', header: 'Emprestimos ativos' },
              {
                key: 'status',
                header: 'Status',
                render: (project) => (
                  <StatusBadge status={project.status} labels={PROJECT_STATUS_LABELS} tones={PROJECT_STATUS_TONES} />
                ),
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (project) => (
                  <div className="table__actions">
                    <Link to={`/projetos/${project.id}`} className="btn btn--secondary btn--sm">
                      Abrir
                    </Link>
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(project)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setToDelete(project)}>
                          Excluir
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
            rows={projects.data}
            empty={
              <EmptyState
                icon="📁"
                title="Nenhum projeto encontrado"
                description="Ajuste os filtros ou crie um novo projeto."
              />
            }
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar projeto' : 'Novo projeto'}
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
            label="Nome do projeto"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            error={errors.name}
            full
          />
          <Select
            label="Laboratorio"
            placeholder="Selecione"
            value={form.labId}
            onChange={(event) => setForm({ ...form, labId: event.target.value })}
            options={labOptions}
            error={errors.labId}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
            options={optionsFromLabels(PROJECT_STATUS_LABELS)}
          />
          <Input
            label="Inicio"
            type="date"
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            error={errors.startDate}
          />
          <Input
            label="Termino previsto"
            type="date"
            value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
            error={errors.endDate}
          />
          <Textarea
            label="Descricao"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            full
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir projeto"
        message={`Excluir "${toDelete?.name}"? Os dispositivos vinculados voltarao para o inventario livre do laboratorio.`}
        confirmLabel="Excluir"
        busy={saving}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
