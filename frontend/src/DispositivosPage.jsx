import { useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { alterarStatus, STATUS, STATUS_LABELS } from './api';
import { useDispositivos, useLaboratorios } from './useDispositivos';
import NovoDispositivo from './NovoDispositivo';

const COLUNAS = [
  ['Dispositivo', 'name'],
  ['Descricao', 'description'],
  ['Laboratorio', 'laboratoryName'],
];

/** Compara ignorando acento e caixa. */
const normalizar = (v) =>
  String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Inventario de equipamentos, com filtros da API e busca por texto na tela. */
export default function DispositivosPage() {
  const { token, isAdmin } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [laboratorioId, setLaboratorioId] = useState('');
  const [erroAcao, setErroAcao] = useState('');

  // laboratoryId e status sao filtros do GET /api/devices; q e aplicado aqui,
  // porque o endpoint nao tem parametro de busca por texto.
  const { itens, carregando, erro, recarregar, versao } = useDispositivos({ token, laboratoryId: laboratorioId, status });

  const laboratorios = useLaboratorios({ token, versao });

  const visiveis = useMemo(() => {
    const termo = normalizar(q);
    if (!termo) return itens;
    return itens.filter((d) =>
      [d.name, d.description, d.laboratoryName].some((v) => normalizar(v).includes(termo)));
  }, [itens, q]);

  const disponiveis = visiveis.filter((d) => d.status === STATUS.AVAILABLE).length;

  async function mudarStatus(id, novo) {
    setErroAcao('');
    try {
      await alterarStatus({ token, id, status: novo });
      recarregar();
    } catch (e) {
      setErroAcao(e.message || 'Nao foi possivel alterar a situacao.');
    }
  }

  return (
    <>
      {isAdmin && (
        <div className="acoes">
          <NovoDispositivo token={token} laboratorios={laboratorios} onCriado={recarregar} />
        </div>
      )}

      <div className="filtros">
        <div className="field">
          <label className="field__label" htmlFor="q">Buscar</label>
          <input
            id="q"
            className="field__control"
            placeholder="Nome, descricao ou laboratorio"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="laboratorio">Laboratorio</label>
          <select
            id="laboratorio"
            className="field__control"
            value={laboratorioId}
            onChange={(e) => setLaboratorioId(e.target.value)}
          >
            <option value="">Todos</option>
            {laboratorios.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="status">Situacao</label>
          <select id="status" className="field__control" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(STATUS_LABELS).map(([v, rotulo]) => (
              <option key={v} value={v}>{rotulo}</option>
            ))}
          </select>
        </div>
      </div>

      {erroAcao && <div className="alert" role="alert">{erroAcao}</div>}
      {erro && <div className="alert" role="alert">{erro}</div>}

      {carregando && <p className="muted" role="status">Carregando inventario...</p>}

      {!carregando && !erro && visiveis.length === 0 && (
        <p className="vazio">Nenhum dispositivo encontrado.</p>
      )}

      {!carregando && !erro && visiveis.length > 0 && (
        <>
          <p className="resumo">
            {visiveis.length} dispositivo(s) · <strong>{disponiveis}</strong> disponivel(is)
          </p>

          <table className="tabela">
            <thead>
              <tr>
                {COLUNAS.map(([titulo]) => <th key={titulo}>{titulo}</th>)}
                <th>Situacao</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((d) => (
                <tr key={d.id}>
                  {COLUNAS.map(([titulo, campo]) => (
                    <td key={titulo} className={campo === 'name' ? 'tabela__nome' : undefined}>
                      {d[campo] || '—'}
                    </td>
                  ))}
                  <td>
                    {isAdmin ? (
                      <select
                        className="field__control field__control--inline"
                        aria-label={`Situacao de ${d.name}`}
                        value={d.status}
                        onChange={(e) => mudarStatus(d.id, e.target.value)}
                      >
                        {Object.entries(STATUS_LABELS).map(([v, rotulo]) => (
                          <option key={v} value={v}>{rotulo}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`situacao situacao--${String(d.status).toLowerCase()}`}>
                        {STATUS_LABELS[d.status] ?? d.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <p className="rodape">
        {isAdmin
          ? 'Como administrador, voce cadastra dispositivos, altera situacoes e decide os emprestimos.'
          : 'Como participante, voce pode solicitar emprestimos na aba Emprestimos.'}
      </p>
    </>
  );
}
