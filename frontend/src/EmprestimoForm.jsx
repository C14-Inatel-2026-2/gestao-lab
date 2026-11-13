import { useState } from 'react';
import { solicitarEmprestimo } from './api';

/**
 * Solicitacao de emprestimo (POST /api/loans), disponivel a qualquer usuario
 * autenticado. O solicitante nao vai no corpo: o backend usa o token.
 *
 * O emprestimo e de laboratorio, nao de dispositivo: LoanRequest recebe
 * laboratoryId e o periodo. Quando o backend passar a emprestar dispositivos,
 * e aqui que o campo entra.
 */
export default function EmprestimoForm({ token, laboratorios }) {
  const [aberto, setAberto] = useState(false);
  const [laboratorioId, setLaboratorioId] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');

  async function enviar(event) {
    event.preventDefault();
    setErro('');
    setConfirmacao('');
    if (!laboratorioId) return setErro('Selecione o laboratorio.');
    if (!inicio || !fim) return setErro('Informe o inicio e o fim do periodo.');
    // Mesma regra do LoanService: o fim precisa ser depois do inicio.
    if (fim <= inicio) return setErro('O fim deve ser depois do inicio.');

    setEnviando(true);
    try {
      const loan = await solicitarEmprestimo({
        token,
        laboratoryId: laboratorioId,
        startDateTime: inicio,
        endDateTime: fim,
      });
      setConfirmacao(`Emprestimo ${loan.id} registrado.`);
      setInicio('');
      setFim('');
    } catch (e) {
      setErro(e.message || 'Nao foi possivel registrar o emprestimo.');
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAberto(true)}>
        Solicitar emprestimo
      </button>
    );
  }

  return (
    <form className="painel" onSubmit={enviar} noValidate>
      <h2 className="painel__titulo">Solicitar emprestimo de laboratorio</h2>

      {erro && <div className="alert" role="alert">{erro}</div>}
      {confirmacao && <div className="aviso" role="status">{confirmacao}</div>}

      <div className="painel__linha">
        <div className="field">
          <label className="field__label" htmlFor="emprestimo-lab">Laboratorio</label>
          <select
            id="emprestimo-lab"
            className="field__control"
            value={laboratorioId}
            onChange={(e) => setLaboratorioId(e.target.value)}
          >
            <option value="">Selecione</option>
            {laboratorios.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>

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
        O backend ainda nao expoe a consulta de emprestimos, entao a confirmacao acima e o unico
        retorno da solicitacao.
      </p>

      <div className="painel__acoes">
        <button type="submit" className="btn btn--primary btn--sm" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Solicitar'}
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAberto(false)}>
          Fechar
        </button>
      </div>
    </form>
  );
}
