import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ToastProvider';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
  Table,
} from '../components/ui';
import {
  DEVICE_STATUS_LABELS,
  DEVICE_STATUS_TONES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  ROLE_LABELS,
} from '../utils/constants';

export default function LabDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('devices');
  const [memberModal, setMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'PARTICIPANT' });
  const [saving, setSaving] = useState(false);

  const lab = useAsync(() => api.labs.get(id), [id]);
  const devices = useAsync(() => api.devices.list({ labId: id }), [id]);
  const projects = useAsync(() => api.projects.list({ labId: id }), [id]);
  const members = useAsync(() => api.labs.members(id), [id]);
  const users = useAsync(() => api.users.list(), []);

  async function handleAddMember() {
    if (!memberForm.userId) return;
    setSaving(true);
    try {
      await api.labs.addMember(id, memberForm);
      toast.success('Membro vinculado ao laboratorio.');
      setMemberModal(false);
      setMemberForm({ userId: '', role: 'PARTICIPANT' });
      members.reload();
      lab.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(userId) {
    try {
      await api.labs.removeMember(id, userId);
      toast.success('Membro removido.');
      members.reload();
      lab.reload();
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (lab.loading) return <Spinner />;
  if (lab.error) return <Alert tone="danger">{lab.error.message}</Alert>;
  if (!lab.data) return null;

  const data = lab.data;
  const availableUsers = (users.data || []).filter(
    (user) => !(members.data || []).some((member) => member.id === user.id),
  );

  return (
    <>
      <PageHeader
        title={data.name}
        description={`${data.code} - ${data.location}`}
        actions={
          <Link to="/laboratorios" className="btn btn--secondary">
            Voltar
          </Link>
        }
      />

      <Card>
        <div className="detail-grid">
          <div>
            <div className="detail__label">Dispositivos</div>
            <div className="detail__value">{data.deviceCount}</div>
          </div>
          <div>
            <div className="detail__label">Disponiveis</div>
            <div className="detail__value">{data.availableDevices}</div>
          </div>
          <div>
            <div className="detail__label">Projetos</div>
            <div className="detail__value">{data.projectCount}</div>
          </div>
          <div>
            <div className="detail__label">Membros</div>
            <div className="detail__value">{data.memberCount}</div>
          </div>
        </div>
        {data.description && <p className="muted" style={{ marginTop: 'var(--space-4)' }}>{data.description}</p>}
      </Card>

      <div className="tabs">
        <button type="button" className={`tab ${tab === 'devices' ? 'tab--active' : ''}`} onClick={() => setTab('devices')}>
          Dispositivos
        </button>
        <button type="button" className={`tab ${tab === 'projects' ? 'tab--active' : ''}`} onClick={() => setTab('projects')}>
          Projetos
        </button>
        <button type="button" className={`tab ${tab === 'members' ? 'tab--active' : ''}`} onClick={() => setTab('members')}>
          Membros
        </button>
      </div>

      {tab === 'devices' && (
        <Card flush>
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
                { key: 'projectName', header: 'Projeto', render: (d) => d.projectName || <span className="muted">-</span> },
                {
                  key: 'status',
                  header: 'Status',
                  render: (device) => (
                    <StatusBadge status={device.status} labels={DEVICE_STATUS_LABELS} tones={DEVICE_STATUS_TONES} />
                  ),
                },
              ]}
              rows={devices.data}
              empty={<EmptyState icon="🔌" title="Nenhum dispositivo cadastrado neste laboratorio" />}
            />
          )}
        </Card>
      )}

      {tab === 'projects' && (
        <Card flush>
          {projects.loading ? (
            <Spinner />
          ) : (
            <Table
              columns={[
                {
                  key: 'name',
                  header: 'Projeto',
                  render: (project) => (
                    <Link to={`/projetos/${project.id}`} className="table__primary">
                      {project.name}
                    </Link>
                  ),
                },
                { key: 'deviceCount', header: 'Dispositivos' },
                { key: 'memberCount', header: 'Participantes' },
                { key: 'activeLoans', header: 'Emprestimos ativos' },
                {
                  key: 'status',
                  header: 'Status',
                  render: (project) => (
                    <StatusBadge status={project.status} labels={PROJECT_STATUS_LABELS} tones={PROJECT_STATUS_TONES} />
                  ),
                },
              ]}
              rows={projects.data}
              empty={<EmptyState icon="📁" title="Nenhum projeto vinculado a este laboratorio" />}
            />
          )}
        </Card>
      )}

      {tab === 'members' && (
        <Card flush>
          {isAdmin && (
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border)' }}>
              <Button size="sm" onClick={() => setMemberModal(true)}>
                Vincular membro
              </Button>
            </div>
          )}
          {members.loading ? (
            <Spinner />
          ) : (
            <Table
              columns={[
                {
                  key: 'name',
                  header: 'Membro',
                  render: (member) => (
                    <div>
                      <div className="table__primary">{member.name}</div>
                      <div className="table__sub">{member.email}</div>
                    </div>
                  ),
                },
                { key: 'registration', header: 'Matricula' },
                {
                  key: 'labRole',
                  header: 'Perfil no laboratorio',
                  render: (member) => (
                    <Badge tone={member.labRole === 'ADMIN' ? 'brand' : 'neutral'}>
                      {ROLE_LABELS[member.labRole]}
                    </Badge>
                  ),
                },
                ...(isAdmin
                  ? [
                      {
                        key: 'actions',
                        header: '',
                        align: 'right',
                        render: (member) => (
                          <div className="table__actions">
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)}>
                              Remover
                            </Button>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
              rows={members.data}
              empty={<EmptyState icon="👥" title="Nenhum membro vinculado" />}
            />
          )}
        </Card>
      )}

      <Modal
        open={memberModal}
        title="Vincular membro ao laboratorio"
        onClose={() => setMemberModal(false)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMemberModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember} disabled={saving || !memberForm.userId}>
              Vincular
            </Button>
          </>
        }
      >
        <div className="stack">
          <Select
            label="Usuario"
            placeholder="Selecione um usuario"
            value={memberForm.userId}
            onChange={(event) => setMemberForm({ ...memberForm, userId: event.target.value })}
            options={availableUsers.map((user) => ({ value: user.id, label: `${user.name} (${user.email})` }))}
          />
          <Select
            label="Perfil no laboratorio"
            value={memberForm.role}
            onChange={(event) => setMemberForm({ ...memberForm, role: event.target.value })}
            options={[
              { value: 'PARTICIPANT', label: 'Participante' },
              { value: 'ADMIN', label: 'Administrador' },
            ]}
          />
        </div>
      </Modal>
    </>
  );
}
