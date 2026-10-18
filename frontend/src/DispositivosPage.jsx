import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { listarDispositivos, ROLE_LABELS, STATUS_LABELS, initials } from './api';

const COLUNAS = [
  ['Dispositivo', 'nome'],
  ['Patrimonio', 'patrimonio'],
  ['Categoria', 'categoria'],
  ['Laboratorio', 'laboratorio'],
];

/** Inventario de equipamentos, com busca e filtro por situacao. */
export default function DispositivosPage() {
  const { user, logout, isAdmin } = useAuth();
  const [itens, setItens] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');

    listarDispositivos({ q, status })
      .then((dados) => ativo && setItens(dados))
      .catch((e) => ativo && setErro(e.message || 'Nao foi possivel carregar o inventario.'))
      .finally(() => ativo && setCarregando(false));

    return () => { ativo = false; };
  }, [q, status]);

  const disponiveis = itens.filter((d) => d.status === 'AVAILABLE').length;

  return (
    <div className="app">
      <header className="topo">
        <div className="topo__marca">
          <span className="topo__logo" aria-hidden="true">GL</span>
          <div>
            <strong>Gestao Lab</strong>
            <span className="topo__sub">Inventario de dispositivos</span>
          </div>
        </div>

        <div className="topo__usuario">
          <span className="avatar avatar--sm" aria-hidden="true">{initials(user.name)}</span>
          <div>
            <h1 className="topo__ola">Ola, {String(user.name).split(' ')[0]}</h1>
            <span className="badge">{ROLE_LABELS[user.role]}</span>
          </div>
          <button type="button" className="btn btn--secondary btn--sm" onClick={logout}>Sair</button>
        </div>
      </header>

      <main className="conteudo">
        <div className="filtros">
          <div className="field">
            <label className="field__label" htmlFor="q">Buscar</label>
            <input
              id="q"
              className="field__control"
              placeholder="Nome, patrimonio, categoria ou laboratorio"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
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

        {erro && <div className="alert" role="alert">{erro}</div>}

        {carregando && <p className="muted" role="status">Carregando inventario...</p>}

        {!carregando && !erro && itens.length === 0 && (
          <p className="vazio">Nenhum dispositivo encontrado.</p>
        )}

        {!carregando && !erro && itens.length > 0 && (
          <>
            <p className="resumo">
              {itens.length} dispositivo(s) · <strong>{disponiveis}</strong> disponivel(is)
            </p>

            <table className="tabela">
              <thead>
                <tr>
                  {COLUNAS.map(([titulo]) => <th key={titulo}>{titulo}</th>)}
                  <th>Situacao</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((d) => (
                  <tr key={d.id}>
                    {COLUNAS.map(([titulo, campo]) => (
                      <td key={titulo} className={campo === 'nome' ? 'tabela__nome' : undefined}>{d[campo]}</td>
                    ))}
                    <td>
                      <span className={`situacao situacao--${d.status.toLowerCase()}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p className="rodape">
          {isAdmin
            ? 'Como administrador, voce pode cadastrar itens e aprovar emprestimos.'
            : 'Como participante, voce pode solicitar emprestimos dos itens disponiveis.'}
        </p>
      </main>
    </div>
  );
}
