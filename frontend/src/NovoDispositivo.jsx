import { useState } from 'react';
import { criarDispositivo } from './api';

/**
 * Cadastro de dispositivo (POST /api/devices), restrito a ADMIN no backend.
 *
 * O laboratorio e escolhido entre os cadastrados em GET /api/labs. Sem nenhum
 * laboratorio nao ha onde vincular o dispositivo, e o formulario explica isso
 * em vez de quebrar.
 */
export default function NovoDispositivo({ token, laboratorios, onCriado }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [laboratorioId, setLaboratorioId] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(event) {
    event.preventDefault();
    setErro('');
    if (!nome.trim()) return setErro('Informe o nome do dispositivo.');
    if (!laboratorioId) return setErro('Selecione o laboratorio.');

    setEnviando(true);
    try {
      await criarDispositivo({ token, name: nome.trim(), description: descricao.trim(), laboratoryId: laboratorioId });
      setNome('');
      setDescricao('');
      setAberto(false);
      onCriado();
    } catch (e) {
      setErro(e.message || 'Nao foi possivel cadastrar o dispositivo.');
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button type="button" className="btn btn--primary btn--sm" onClick={() => setAberto(true)}>
        Cadastrar dispositivo
      </button>
    );
  }

  return (
    <form className="painel" onSubmit={enviar} noValidate>
      <h2 className="painel__titulo">Novo dispositivo</h2>

      {erro && <div className="alert" role="alert">{erro}</div>}

      {laboratorios.length === 0 ? (
        <p className="muted">
          Nenhum laboratorio cadastrado ainda. Cadastre um laboratorio antes de adicionar
          dispositivos.
        </p>
      ) : (
        <div className="painel__linha">
          <div className="field">
            <label className="field__label" htmlFor="dispositivo-nome">Nome</label>
            <input
              id="dispositivo-nome"
              className="field__control"
              placeholder="Ex.: ESP32 DevKit v1"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="dispositivo-descricao">Descricao</label>
            <input
              id="dispositivo-descricao"
              className="field__control"
              placeholder="Opcional"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="dispositivo-lab">Laboratorio</label>
            <select
              id="dispositivo-lab"
              className="field__control"
              value={laboratorioId}
              onChange={(e) => setLaboratorioId(e.target.value)}
            >
              <option value="">Selecione</option>
              {laboratorios.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="painel__acoes">
        <button type="submit" className="btn btn--primary btn--sm" disabled={enviando || laboratorios.length === 0}>
          {enviando ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
