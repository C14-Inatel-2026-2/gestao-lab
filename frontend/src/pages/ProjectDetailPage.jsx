import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ToastProvider';
import {
  Alert,
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
  LOAN_STATUS_LABELS,
  LOAN_STATUS_TONES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
} from '../utils/constants';
import { formatDate } from '../utils/format';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [memberModal, setMemberModal] = useState(false);
  const [deviceModal, setDeviceModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [saving, setSaving] = useState(false);

  const project = useAsync(() => api.projects.get(id), [id]);
  const users = useAsync(() => api.users.list(), []);
  const labId = project.data?.labId;
  const labDevices = useAsync(
    () => (labId ? api.devices.list({ labId }) : Promise.resolve([])),
    [labId],
  );

  async function handleAddMember() {
    setSaving(true);
    try {
      await api.projects.addMember(id, selectedUser);
      toast.success('Participante vinculado ao projeto.');
      setMemberModal(false);
      setSelectedUser('');
      project.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(userId) {
    try {
      await api.projects.removeMember(id, userId);
      toast.success('Participante removido.');
      project.reload();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleAddDevice() {
    setSaving(true);
    try {
      await api.projects.addDevice(id, selectedDevice);
      toast.success('Dispositivo vinculado ao projeto.');
      setDeviceModal(false);
      setSelectedDevice('');
      project.reload();
      labDevices.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveDevice(deviceId) {
    try {
      await api.projects.removeDevice(id, deviceId);
      toast.success('Dispositivo desvinculado.');
      project.reload();
      labDevices.reload();
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (project.loading) return <Spinner />;
  if (project.error) return <Alert tone="danger">{project.error.message}</Alert>;
  if (!project.data) return null;

  const data = project.data;
  const availableUsers = (users.data || []).filter(
    (user) => !data.members.some((member) => member.id === user.id),
  );
  const linkableDevices = (labDevices.data || []).filter((device) => !device.projectId);

  return (
    <>
      <PageHeader
        title={data.name}
        description={data.labName}
        actions={
          <Link to="/projetos" className="btn btn--secondary">
            Voltar
          </Link>
        }
      />

      <Card>
        <div className="detail-grid">
          <div>
            <div className="detail__label">Status</div>
            <div className="detail__value">
              <StatusBadge status={data.status} labels={PROJECT_STATUS_LABELS} tones={PROJECT_STATUS_TONES} />
            </div>
          </div>
          <div>
            <div className="detail__label">Inicio</div>
            <div className="detail__value">{formatDate(data.startDate)}</div>
          </div>
          <div>
            <div className="detail__label">Termino previsto</div>
            <div className="detail__value">{data.endDate ? formatDate(data.endDate) : '-'}</div>
          </div>
          <div>
            <div className="detail__label">Emprestimos ativos</div>
            <div className="detail__value">{data.activeLoans}</div>
          </div>
        </div>
        {data.description && <p className="muted" style={{ marginTop: 'var(--space-4)' }}>{data.description}</p>}
      </Card>

      <div className="grid-2">
        <Card
          title="Participantes"
          actions={isAdmin && <Button size="sm" onClick={() => setMemberModal(true)}>Vincular</Button>}
          flush
        >
          <Table
            columns={[
              {
                key: 'name',
                header: 'Participante',
                render: (member) => (
                  <div>
                    <div className="table__primary">{member.name}</div>
                    <div className="table__sub">{member.email}</div>
                  </div>
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
            rows={data.members}
            empty={<EmptyState icon="👥" title="Nenhum participante vinculado" />}
          />
        </Card>

        <Card
          title="Dispositivos alocados"
          actions={isAdmin && <Button size="sm" onClick={() => setDeviceModal(true)}>Vincular</Button>}
          flush
        >
          <Table
            columns={[
              {
                key: 'name',
                header: 'Dispositivo',
                render: (device) => (
                  <div>
                    <div className="table__primary">{device.name}</div>
                    <div className="table__sub">{device.tag}</div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (device) => (
                  <StatusBadge status={device.status} labels={DEVICE_STATUS_LABELS} tones={DEVICE_STATUS_TONES} />
                ),
              },
              ...(isAdmin
                ? [
                    {
                      key: 'actions',
                      header: '',
                      align: 'right',
                      render: (device) => (
                        <div className="table__actions">
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveDevice(device.id)}>
                            Desvincular
                          </Button>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
            rows={data.devices}
            empty={<EmptyState icon="🔌" title="Nenhum dispositivo alocado" />}
          />
        </Card>
      </div>

      <Card title="Historico de emprestimos do projeto" flush>
        <Table
          columns={[
            {
              key: 'device',
              header: 'Dispositivo',
              render: (loan) => (
                <div>
                  <div className="table__primary">{loan.deviceName}</div>
                  <div className="table__sub">{loan.deviceTag}</div>
                </div>
              ),
            },
            { key: 'userName', header: 'Solicitante' },
            { key: 'requestedAt', header: 'Solicitado em', render: (loan) => formatDate(loan.requestedAt) },
            {
              key: 'expectedReturnDate',
              header: 'Devolucao prevista',
              render: (loan) => formatDate(loan.expectedReturnDate),
            },
            {
              key: 'status',
              header: 'Status',
              render: (loan) => (
                <StatusBadge status={loan.status} labels={LOAN_STATUS_LABELS} tones={LOAN_STATUS_TONES} />
              ),
            },
          ]}
          rows={data.loans}
          empty={<EmptyState icon="🔄" title="Nenhum emprestimo registrado para este projeto" />}
        />
      </Card>

      <Modal
        open={memberModal}
        title="Vincular participante"
        onClose={() => setMemberModal(false)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMemberModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember} disabled={saving || !selectedUser}>
              Vincular
            </Button>
          </>
        }
      >
        <Select
          label="Usuario"
          placeholder="Selecione"
          value={selectedUser}
          onChange={(event) => setSelectedUser(event.target.value)}
          options={availableUsers.map((user) => ({ value: user.id, label: user.name }))}
        />
      </Modal>

      <Modal
        open={deviceModal}
        title="Vincular dispositivo ao projeto"
        onClose={() => setDeviceModal(false)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeviceModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAddDevice} disabled={saving || !selectedDevice}>
              Vincular
            </Button>
          </>
        }
      >
        <Select
          label="Dispositivo livre do laboratorio"
          placeholder="Selecione"
          value={selectedDevice}
          onChange={(event) => setSelectedDevice(event.target.value)}
          options={linkableDevices.map((device) => ({
            value: device.id,
            label: `${device.name} (${device.tag})`,
          }))}
        />
        {linkableDevices.length === 0 && (
          <p className="muted text-sm" style={{ marginTop: 'var(--space-3)' }}>
            Todos os dispositivos deste laboratorio ja estao vinculados a algum projeto.
          </p>
        )}
      </Modal>
    </>
  );
}
