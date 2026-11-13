import { useState } from 'react';
import { useAuth } from './AuthContext';
import {
  aprovarEmprestimo, LOAN_STATUS, LOAN_STATUS_LABELS, registrarDevolucao, rejeitarEmprestimo,
} from './api';
import { useDispositivos, useEmprestimos } from './useDispositivos';
import EmprestimoForm from './EmprestimoForm';

/** "2026-12-01T08:00" -> "01/12/2026 08:00" */
function formatarPeriodo(valor) {
  if (!valor) return '—';
  const [data, hora = ''] = String(valor).split('T');
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano} ${hora.slice(0, 5)}`.trim();
}

/**
 * Emprestimos do usuario (ou todos, para administrador) e as acoes de
 * aprovacao, rejeicao e devolucao.
 *
 * O backend so permite aprovar ou rejeitar um emprestimo Solicitado, e so
 * registrar devolucao de um Aprovado - por isso cada acao aparece apenas no
 * status em que ela e valida.
 */
export default function EmprestimosPage() {
  const { token, isAdmin } = useAuth();
  const [versao, setVersao] = useState(0);
  const [erroAcao, setErroAcao] = useState('');

  const { itens, carregando, erro } = useEmprestimos({ token, versao });
  // Alimenta o seletor do formulario; aprovar ou devolver muda o status do
  // dispositivo no backend, entao a lista e recarregada junto.
  const { itens: dispositivos } = useDispositivos({ token, versao });

  const recarregar = () => setVersao((v) => v + 1);

  async function agir(acao, id) {
    setErroAcao('');
    try {
      await acao({ token, id });
      recarregar();
    } catch (e) {
      setErroAcao(e.message || 'Nao foi possivel concluir a acao.');
    }
  }

  function nomeDoDispositivo(deviceId) {
    return dispositivos.find((d) => d.id === deviceId)?.name ?? (deviceId ? `#${deviceId}` : '—');
  }

  return (
    <>
      <EmprestimoForm token={token} dispositivos={dispositivos} onSolicitado={recarregar} />

      {erroAcao && <div className="alert" role="alert">{erroAcao}</div>}
      {erro && <div className="alert" role="alert">{erro}</div>}

      {carregando && <p className="muted" role="status">Carregando emprestimos...</p>}

      {!carregando && !erro && itens.length === 0 && (
        <p className="vazio">
          {isAdmin ? 'Nenhum emprestimo registrado.' : 'Voce ainda nao solicitou emprestimos.'}
        </p>
      )}

      {!carregando && !erro && itens.length > 0 && (
        <table className="tabela">
          <thead>
            <tr>
              <th>Dispositivo</th>
              <th>Periodo</th>
              <th>Situacao</th>
              {isAdmin && <th>Acoes</th>}
            </tr>
          </thead>
          <tbody>
            {itens.map((l) => (
              <tr key={l.id}>
                <td className="tabela__nome">{nomeDoDispositivo(l.deviceId)}</td>
                <td>{formatarPeriodo(l.startDateTime)} — {formatarPeriodo(l.endDateTime)}</td>
                <td>
                  <span className={`situacao situacao--${String(l.status).toLowerCase()}`}>
                    {LOAN_STATUS_LABELS[l.status] ?? l.status}
                  </span>
                </td>
                {isAdmin && (
                  <td className="tabela__acoes">
                    {l.status === LOAN_STATUS.REQUESTED && (
                      <>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => agir(aprovarEmprestimo, l.id)}
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => agir(rejeitarEmprestimo, l.id)}
                        >
                          Rejeitar
                        </button>
                      </>
                    )}
                    {l.status === LOAN_STATUS.APPROVED && (
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => agir(registrarDevolucao, l.id)}
                      >
                        Registrar devolucao
                      </button>
                    )}
                    {(l.status === LOAN_STATUS.REJECTED || l.status === LOAN_STATUS.RETURNED) && (
                      <span className="muted">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
