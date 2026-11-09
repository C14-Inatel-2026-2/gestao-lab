import { useEffect, useState } from 'react';
import { listarDispositivos } from './api';

/**
 * Busca o inventario e devolve o estado da requisicao.
 *
 * Isola da tela a orquestracao assincrona: disparo da busca a cada mudanca
 * de filtro, estados de carregando e erro, e descarte do resultado quando o
 * componente e desmontado ou os filtros mudam antes da resposta chegar.
 *
 * @param {{ q?: string, status?: string }} filtros termo de busca e situacao
 * @returns {{ itens: Array, carregando: boolean, erro: string }}
 */
export function useDispositivos({ q = '', status = '' } = {}) {
  const [itens, setItens] = useState([]);
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

  return { itens, carregando, erro };
}
