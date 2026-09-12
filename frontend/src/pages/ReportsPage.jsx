import { useState } from 'react';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
  Stat,
  StatusBadge,
  Table,
} from '../components/ui';
import {
  LOAN_STATUS_LABELS,
  LOAN_STATUS_TONES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
} from '../utils/constants';
import { addDaysISO, formatDate, formatDateTime, todayISO } from '../utils/format';

export default function ReportsPage() {
  const [range, setRange] = useState({ from: addDaysISO(-30), to: todayISO(), labId: '' });

  const labs = useAsync(() => api.labs.list(), []);
  const overview = useAsync(() => api.reports.overview(), []);
  const movements = useAsync(
    () => api.reports.movements(range),
    [range.from, range.to, range.labId],
  );
  const overdue = useAsync(() => api.reports.overdue(), []);
  const allocations = useAsync(() => api.reports.allocationsByProject(), []);

  const stats = overview.data;
  const maxDevices = Math.max(1, ...(allocations.data || []).map((row) => row.devices));

  return (
    <>
      <PageHeader
        title="Relatorios"
        description="Historico de movimentacoes, itens em atraso e alocacoes ativas por projeto."
      />

      {overview.error && <Alert tone="danger">{overview.error.message}</Alert>}

      {stats && (
        <div className="stat-grid">
          <Stat label="Total de movimentacoes" value={(movements.data || []).length} hint="No periodo filtrado" />
          <Stat label="Em uso" value={stats.activeLoans} hint="Emprestimos aprovados em aberto" />
          <Stat label="Em atraso" value={stats.overdueLoans} hint="Devolucao vencida" />
          <Stat
            label="Taxa de disponibilidade"
            value={`${Math.round((stats.availableDevices / Math.max(1, stats.devices)) * 100)}%`}
            hint={`${stats.availableDevices} de ${stats.devices} dispositivos`}
          />
        </div>
      )}

      <Card title="Itens em atraso" flush>
        {overdue.loading ? (
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
                    <div className="table__sub">{loan.deviceTag}</div>
                  </div>
                ),
              },
              { key: 'userName', header: 'Responsavel' },
              { key: 'projectName', header: 'Projeto' },
              {
                key: 'expectedReturnDate',
                header: 'Previsto para',
                render: (loan) => formatDate(loan.expectedReturnDate),
              },
              {
                key: 'daysLate',
                header: 'Atraso',
                render: (loan) => <Badge tone="danger">{loan.daysLate} dia(s)</Badge>,
              },
            ]}
            rows={overdue.data}
            empty={
              <EmptyState icon="✅" title="Nenhum item em atraso" description="Todas as devolucoes estao em dia." />
            }
          />
        )}
      </Card>

      <Card title="Alocacoes ativas por projeto" flush>
        {allocations.loading ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              {
                key: 'projectName',
                header: 'Projeto',
                render: (row) => (
                  <div>
                    <div className="table__primary">{row.projectName}</div>
                    <div className="table__sub">{row.labName}</div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Situacao',
                render: (row) => (
                  <StatusBadge status={row.status} labels={PROJECT_STATUS_LABELS} tones={PROJECT_STATUS_TONES} />
                ),
              },
              {
                key: 'devices',
                header: 'Dispositivos alocados',
                render: (row) => (
                  <div style={{ minWidth: 140 }}>
                    <div className="text-sm">{row.devices}</div>
                    <div className="bar">
                      <div className="bar__fill" style={{ width: `${(row.devices / maxDevices) * 100}%` }} />
                    </div>
                  </div>
                ),
              },
              { key: 'activeLoans', header: 'Emprestimos em aberto' },
              {
                key: 'overdueLoans',
                header: 'Em atraso',
                render: (row) =>
                  row.overdueLoans > 0 ? <Badge tone="danger">{row.overdueLoans}</Badge> : <span className="muted">0</span>,
              },
              { key: 'totalLoans', header: 'Total historico' },
            ]}
            rows={allocations.data}
            empty={<EmptyState icon="📈" title="Nenhum projeto cadastrado" />}
          />
        )}
      </Card>

      <Card title="Historico de movimentacoes" flush>
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border)' }}>
          <div className="toolbar">
            <Input
              label="De"
              type="date"
              value={range.from}
              onChange={(event) => setRange({ ...range, from: event.target.value })}
            />
            <Input
              label="Ate"
              type="date"
              value={range.to}
              onChange={(event) => setRange({ ...range, to: event.target.value })}
            />
            <Select
              label="Laboratorio"
              placeholder="Todos"
              value={range.labId}
              onChange={(event) => setRange({ ...range, labId: event.target.value })}
              options={(labs.data || []).map((lab) => ({ value: lab.id, label: lab.name }))}
            />
          </div>
        </div>

        {movements.loading ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              {
                key: 'requestedAt',
                header: 'Solicitado em',
                render: (loan) => <span className="text-sm">{formatDateTime(loan.requestedAt)}</span>,
              },
              {
                key: 'device',
                header: 'Dispositivo',
                render: (loan) => (
                  <div>
                    <div className="table__primary">{loan.deviceName}</div>
                    <div className="table__sub">{loan.labName}</div>
                  </div>
                ),
              },
              { key: 'projectName', header: 'Projeto' },
              { key: 'userName', header: 'Solicitante' },
              {
                key: 'returnedAt',
                header: 'Devolvido em',
                render: (loan) =>
                  loan.returnedAt ? formatDateTime(loan.returnedAt) : <span className="muted">-</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (loan) => (
                  <StatusBadge status={loan.status} labels={LOAN_STATUS_LABELS} tones={LOAN_STATUS_TONES} />
                ),
              },
            ]}
            rows={movements.data}
            empty={
              <EmptyState
                icon="📈"
                title="Nenhuma movimentacao no periodo"
                description="Ajuste o intervalo de datas para ver o historico."
              />
            }
          />
        )}
      </Card>
    </>
  );
}
