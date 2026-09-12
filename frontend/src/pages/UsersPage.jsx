import { useState } from 'react';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
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
  Table,
} from '../components/ui';
import { ROLE_LABELS, optionsFromLabels } from '../utils/constants';

const EMPTY_FORM = { name: '', email: '', registration: '', role: 'PARTICIPANT', active: true };

export default function UsersPage() {
  const toast = useToast();

  const [filters, setFilters] = useState({ q: '', role: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const users = useAsync(() => api.users.list(filters), [filters.q, filters.role]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      registration: user.registration || '',
      role: user.role,
      active: user.active,
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Informe o nome.';
    if (!form.email.trim()) next.email = 'Informe o email.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Email invalido.';
    if (!form.registration.trim()) next.registration = 'Informe a matricula.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.users.update(editing.id, form);
        toast.success('Usuario atualizado.');
      } else {
        await api.users.create(form);
        toast.success('Usuario cadastrado.');
      }
      setModalOpen(false);
      users.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api.users.remove(toDelete.id);
      toast.success('Usuario removido.');
      setToDelete(null);
      users.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Perfis de acesso: administradores gerenciam o laboratorio e aprovam acoes; participantes solicitam emprestimos."
        actions={<Button onClick={openCreate}>Novo usuario</Button>}
      />

      <Card flush>
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="toolbar">
            <div className="toolbar__search">
              <Input
                label="Buscar"
                placeholder="Nome, email ou matricula"
                value={filters.q}
                onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              />
            </div>
            <Select
              label="Perfil"
              placeholder="Todos"
              value={filters.role}
              onChange={(event) => setFilters({ ...filters, role: event.target.value })}
              options={optionsFromLabels(ROLE_LABELS)}
            />
          </div>
        </div>

        {users.error && (
          <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
            <Alert tone="danger">{users.error.message}</Alert>
          </div>
        )}

        {users.loading ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              {
                key: 'name',
                header: 'Usuario',
                render: (user) => (
                  <div>
                    <div className="table__primary">{user.name}</div>
                    <div className="table__sub">{user.email}</div>
                  </div>
                ),
              },
              { key: 'registration', header: 'Matricula' },
              {
                key: 'role',
                header: 'Perfil',
                render: (user) => (
                  <Badge tone={user.role === 'ADMIN' ? 'brand' : 'neutral'}>{ROLE_LABELS[user.role]}</Badge>
                ),
              },
              {
                key: 'active',
                header: 'Situacao',
                render: (user) => (
                  <Badge tone={user.active ? 'success' : 'neutral'}>{user.active ? 'Ativo' : 'Inativo'}</Badge>
                ),
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (user) => (
                  <div className="table__actions">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(user)}>
                      Excluir
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={users.data}
            empty={<EmptyState icon="👥" title="Nenhum usuario encontrado" />}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar usuario' : 'Novo usuario'}
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
            label="Nome completo"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            error={errors.name}
            full
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            error={errors.email}
          />
          <Input
            label="Matricula"
            value={form.registration}
            onChange={(event) => setForm({ ...form, registration: event.target.value })}
            error={errors.registration}
          />
          <Select
            label="Perfil"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            options={optionsFromLabels(ROLE_LABELS)}
          />
          <Select
            label="Situacao"
            value={String(form.active)}
            onChange={(event) => setForm({ ...form, active: event.target.value === 'true' })}
            options={[
              { value: 'true', label: 'Ativo' },
              { value: 'false', label: 'Inativo' },
            ]}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir usuario"
        message={`Excluir "${toDelete?.name}"? Os vinculos com laboratorios e projetos serao removidos.`}
        confirmLabel="Excluir"
        busy={saving}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
