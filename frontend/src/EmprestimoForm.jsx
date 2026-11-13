import { useMemo, useState } from 'react';
import { laboratoriosDe, solicitarEmprestimo, STATUS, STATUS_LABELS } from './api';

/**
 * Solicitacao de emprestimo de dispositivo (POST /api/loans).
 *
 * O backend exige laboratoryId e deviceId, e recusa com 400 quando o
 * dispositivo nao pertence ao laboratorio. Por isso a lista de dispositivos
 * aqui e sempre filtrada pelo laboratorio escolhido.
 *
 * Dispositivos em manutencao tambem sao recusados pelo LoanService, entao
 * ficam fora do seletor.
 */
export default function EmprestimoForm({ token, dispositivos, onSolicitado }) {
  const [laboratorioId, setLaboratorioId] = useState('');
  const [dispositivoId, setDispositivoId] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');

  const laboratorios = useMemo(() => laboratoriosDe(dispositivos), [dispositivos]);

  const disponiveis = useMemo(
    () => (dispositivos ?? []).filter(
      (d) => String(d.laboratoryId) === String(laboratorioId) && d.status !== STATUS.MAINTENANCE),
    [dispositivos, laboratorioId],
  );

  function trocarLaboratorio(valor) {
    setLaboratorioId(valor);
    // O dispositivo anterior pode nao pertencer ao novo laboratorio.
    setDispositivoId('');
  }

  async function enviar(event) {
    event.preventDefault();
    setErro('');
    setConfirmacao('');
    if (!laboratorioId) return setErro('Selecione o laboratorio.');
    if (!dispositivoId) return setErro('Selecione o dispositivo.');
    if (!inicio || !fim) return setErro('Informe o inicio e o fim do periodo.');
    // Mesma regra do LoanService: o fim precisa ser depois do inicio.
    if (fim <= inicio) return setErro('O fim deve ser depois do inicio.');

    setEnviando(true);
    try {
      const loan = await solicitarEmprestimo({
        token,
        laboratoryId: laboratorioId,
        deviceId: dispositivoId,
        startDateTime: inicio,
        endDateTime: fim,
      });
      setConfirmacao(`Solicitacao ${loan.id} registrada e aguardando aprovacao.`);
      setDispositivoId('');
      setInicio('');
      setFim('');
      onSolicitado?.();
    } catch (e) {
      setErro(e.message || 'Nao foi possivel registrar o emprestimo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="painel" onSubmit={enviar} noValidate>
      <h2 className="painel__titulo">Solicitar emprestimo</h2>

      {erro && <div className="alert" role="alert">{erro}</div>}
      {confirmacao && <div className="aviso" role="status">{confirmacao}</div>}

      {laboratorios.length === 0 ? (
        <p className="muted">
          Nenhum dispositivo cadastrado ainda, entao nao ha o que emprestar.
        </p>
      ) : (
        <>
          <div className="painel__linha">
            <div className="field">
              <label className="field__label" htmlFor="emprestimo-lab">Laboratorio</label>
              <select
                id="emprestimo-lab"
                className="field__control"
                value={laboratorioId}
                onChange={(e) => trocarLaboratorio(e.target.value)}
              >
                <option value="">Selecione</option>
                {laboratorios.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="emprestimo-dispositivo">Dispositivo</label>
              <select
                id="emprestimo-dispositivo"
                className="field__control"
                value={dispositivoId}
                disabled={!laboratorioId}
                onChange={(e) => setDispositivoId(e.target.value)}
              >
                <option value="">{laboratorioId ? 'Selecione' : 'Escolha o laboratorio'}</option>
                {disponiveis.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({STATUS_LABELS[d.status] ?? d.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="painel__linha">
            <div className="field">
              <label className="field__label" htmlFor="emprestimo-inicio">Inicio</label>
              <input
                id="emprestimo-inicio"
                className="field__control"
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="emprestimo-fim">Fim</label>
              <input
                id="emprestimo-fim"
                className="field__control"
                type="datetime-local"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>
          </div>

          <p className="ajuda">
            A solicitacao nasce como Solicitado. Um administrador precisa aprova-la, e so entao o
            dispositivo passa a Emprestado.
          </p>

          <div className="painel__acoes">
            <button type="submit" className="btn btn--primary btn--sm" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Solicitar'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
