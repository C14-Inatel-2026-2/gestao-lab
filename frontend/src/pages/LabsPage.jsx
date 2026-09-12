import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Spinner,
  Table,
  Textarea,
} from '../components/ui';

const EMPTY_FORM = { name: '', code: '', location: '', description: '' };

export default function LabsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const labs = useAsync(() => api.labs.list({ q: search }), [search]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(lab) {
    setEditing(lab);
    setForm({
      name: lab.name,
      code: lab.code,
      location: lab.location || '',
      description: lab.description || '',
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Informe o nome do laboratorio.';
    if (!form.code.trim()) next.code = 'Informe o codigo (ex.: LAB-IOT).';
    if (!form.location.trim()) next.location = 'Informe a localizacao.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.labs.update(editing.id, form);
        toast.success('Laboratorio atualizado.');
      } else {
        await api.labs.create(form);
        toast.success('Laboratorio cadastrado.');
      }
      setModalOpen(false);
      labs.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api.labs.remove(toDelete.id);
      toast.success('Laboratorio removido.');
      setToDelete(null);
      labs.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Laboratorios"
        description="Cada laboratorio possui administradores, participantes, projetos e seu proprio inventario."
        actions={isAdmin && <Button onClick={openCreate}>Novo laboratorio</Button>}
      />

      <Card flush>
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="toolbar">
            <div className="toolbar__search">
              <Input
                label="Buscar"
                placeholder="Nome, codigo ou localizacao"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>

        {labs.error && (
          <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
            <Alert tone="danger">{labs.error.message}</Alert>
          </div>
        )}

        {labs.loading ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              {
                key: 'name',
                header: 'Laboratorio',
                render: (lab) => (
                  <div>
                    <Link to={`/laboratorios/${lab.id}`} className="table__primary">
                      {lab.name}
                    </Link>
                    <div className="table__sub">{lab.description}</div>
                  </div>
                ),
              },
              { key: 'code', header: 'Codigo', render: (lab) => <Badge tone="brand">{lab.code}</Badge> },
              { key: 'location', header: 'Localizacao' },
              {
                key: 'devices',
                header: 'Dispositivos',
                render: (lab) => (
                  <div>
                    <div className="table__primary">{lab.deviceCount}</div>
                    <div className="table__sub">{lab.availableDevices} disponiveis</div>
                  </div>
                ),
              },
              { key: 'projectCount', header: 'Projetos' },
              { key: 'memberCount', header: 'Membros' },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (lab) => (
                  <div className="table__actions">
                    <Link to={`/laboratorios/${lab.id}`} className="btn btn--secondary btn--sm">
                      Detalhes
                    </Link>
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(lab)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setToDelete(lab)}>
                          Excluir
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
            rows={labs.data}
            empty={
              <EmptyState
                icon="🏢"
                title="Nenhum laboratorio encontrado"
                description="Cadastre o primeiro laboratorio para comecar o controle de inventario."
              />
            }
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar laboratorio' : 'Novo laboratorio'}
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
            label="Codigo"
            placeholder="LAB-IOT"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
            error={errors.code}
          />
          <Input
            label="Localizacao"
            placeholder="Bloco 2 - Sala 204"
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            error={errors.location}
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
        title="Excluir laboratorio"
        message={`Tem certeza que deseja excluir "${toDelete?.name}"? Essa acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        busy={saving}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
