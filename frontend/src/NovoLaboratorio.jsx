import { useState } from 'react';
import { criarLaboratorio } from './api';

/**
 * Cadastro de laboratorio (POST /api/labs), restrito a ADMIN no backend.
 *
 * E o ponto de partida do sistema: o backend nao cria nenhum laboratorio na
 * inicializacao, e sem laboratorio nao ha dispositivo nem emprestimo.
 */
export default function NovoLaboratorio({ token, onCriado }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(event) {
    event.preventDefault();
    setErro('');
    setConfirmacao('');
    // Mesma regra do LaboratoryService: nome obrigatorio e nao so espacos.
    if (!nome.trim()) return setErro('Informe o nome do laboratorio.');

    setEnviando(true);
    try {
      const lab = await criarLaboratorio({ token, name: nome.trim() });
      setConfirmacao(`Laboratorio "${lab.name}" cadastrado.`);
      setNome('');
      onCriado();
    } catch (e) {
      setErro(e.message || 'Nao foi possivel cadastrar o laboratorio.');
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAberto(true)}>
        Cadastrar laboratorio
      </button>
    );
  }

  return (
    <form className="painel" onSubmit={enviar} noValidate>
      <h2 className="painel__titulo">Novo laboratorio</h2>

      {erro && <div className="alert" role="alert">{erro}</div>}
      {confirmacao && <div className="aviso" role="status">{confirmacao}</div>}

      <div className="painel__linha">
        <div className="field">
          <label className="field__label" htmlFor="laboratorio-nome">Nome do laboratorio</label>
          <input
            id="laboratorio-nome"
            className="field__control"
            placeholder="Ex.: Laboratorio de IoT"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
      </div>

      <div className="painel__acoes">
        <button type="submit" className="btn btn--primary btn--sm" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAberto(false)}>
          Fechar
        </button>
      </div>
    </form>
  );
}
