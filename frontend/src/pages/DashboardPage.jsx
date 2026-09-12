import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../auth/AuthContext';
import { Alert, Card, EmptyState, PageHeader, Spinner, Stat, StatusBadge, Table } from '../components/ui';
import { LOAN_STATUS_LABELS, LOAN_STATUS_TONES } from '../utils/constants';
import { formatDate, pluralize } from '../utils/format';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const overview = useAsync(() => api.reports.overview(), []);
  const loans = useAsync(
    () => api.loans.list(isAdmin ? {} : { userId: user.id }),
    [isAdmin, user.id],
  );

  const stats = overview.data;
  const recentLoans = (loans.data || []).slice(0, 6);
  const pending = (loans.data || []).filter((loan) => loan.status === 'REQUESTED');
  const overdue = (loans.data || []).filter((loan) => loan.status === 'OVERDUE');

  return (
    <>
      <PageHeader
        title={`Ola, ${String(user?.name || '').split(' ')[0]}`}
        description={
          isAdmin
            ? 'Resumo dos laboratorios, do inventario e das movimentacoes em aberto.'
            : 'Acompanhe seus emprestimos e o que esta disponivel nos laboratorios.'
        }
      />

      {overview.error && <Alert tone="danger">{overview.error.message}</Alert>}

      {overview.loading ? (
        <Spinner />
      ) : (
        stats && (
          <div className="stat-grid">
            <Stat
              label="Dispositivos"
              value={stats.devices}
              hint={`${stats.availableDevices} disponiveis - ${stats.loanedDevices} emprestados`}
            />
            <Stat
              label="Projetos ativos"
              value={stats.activeProjects}
              hint={pluralize(stats.projects, 'projeto no total', 'projetos no total')}
            />
            <Stat
              label="Emprestimos em uso"
              value={stats.activeLoans}
              hint={pluralize(stats.pendingLoans, 'solicitacao pendente', 'solicitacoes pendentes')}
            />
            <Stat
              label="Itens em atraso"
              value={stats.overdueLoans}
              hint={stats.overdueLoans > 0 ? 'Requer acao imediata' : 'Tudo em dia'}
            />
          </div>
        )
      )}

      {isAdmin && pending.length > 0 && (
        <Alert tone="warning">
          {pluralize(pending.length, 'solicitacao aguardando', 'solicitacoes aguardando')} aprovacao.{' '}
          <Link to="/emprestimos">Revisar agora</Link>
        </Alert>
      )}

      {overdue.length > 0 && (
        <Alert tone="danger">
          {pluralize(overdue.length, 'emprestimo esta', 'emprestimos estao')} em atraso.{' '}
          <Link to="/relatorios">Ver relatorio</Link>
        </Alert>
      )}

      <Card title={isAdmin ? 'Movimentacoes recentes' : 'Meus emprestimos recentes'} flush>
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
                    <div className="table__sub">{loan.deviceTag}</div>
                  </div>
                ),
              },
              { key: 'projectName', header: 'Projeto' },
              ...(isAdmin ? [{ key: 'userName', header: 'Solicitante' }] : []),
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
            rows={recentLoans}
            empty={
              <EmptyState
                icon="🔄"
                title="Nenhuma movimentacao ainda"
                description="Os emprestimos solicitados aparecerao aqui."
              />
            }
          />
        )}
      </Card>
    </>
  );
}
