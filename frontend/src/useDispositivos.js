import { useCallback, useEffect, useState } from 'react';
import { laboratoriosDe, listarDispositivos } from './api';

/**
 * Busca o inventario no backend e devolve o estado da requisicao.
 *
 * Isola da tela a orquestracao assincrona: disparo da busca a cada mudanca de
 * filtro, estados de carregando e erro, e descarte do resultado quando o
 * componente e desmontado ou os filtros mudam antes da resposta chegar.
 *
 * Os filtros aqui sao os que a API aceita (laboratoryId e status). A busca por
 * texto e feita na tela, porque GET /api/devices nao tem parametro de texto.
 *
 * @returns {{ itens: Array, carregando: boolean, erro: string, recarregar: Function }}
 */
export function useDispositivos({ token, laboratoryId = '', status = '' } = {}) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [versao, setVersao] = useState(0);

  /** Usado depois de cadastrar um dispositivo ou mudar uma situacao. */
  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');

    listarDispositivos({ token, laboratoryId, status })
      .then((dados) => ativo && setItens(Array.isArray(dados) ? dados : []))
      .catch((e) => ativo && setErro(e.message || 'Nao foi possivel carregar o inventario.'))
      .finally(() => ativo && setCarregando(false));

    return () => { ativo = false; };
  }, [token, laboratoryId, status, versao]);

  return { itens, carregando, erro, recarregar, versao };
}

/**
 * Laboratorios conhecidos, para os seletores de filtro e de cadastro.
 *
 * Faz uma busca sem filtros e deriva os laboratorios dela. E uma chamada
 * separada de proposito: se os laboratorios saissem da lista ja filtrada, ao
 * escolher um laboratorio o seletor passaria a oferecer apenas ele.
 * Substituir por GET /api/labs quando o backend expor esse endpoint.
 */
export function useLaboratorios({ token, versao = 0 } = {}) {
  const [laboratorios, setLaboratorios] = useState([]);

  useEffect(() => {
    let ativo = true;

    listarDispositivos({ token })
      .then((dados) => ativo && setLaboratorios(laboratoriosDe(dados)))
      .catch(() => ativo && setLaboratorios([]));

    return () => { ativo = false; };
  }, [token, versao]);

  return laboratorios;
}
