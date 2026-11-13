import { useCallback, useEffect, useState } from 'react';
import { listarDispositivos, listarEmprestimos, listarLaboratorios, opcoesDeLaboratorio } from './api';

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
 * Laboratorios cadastrados, para os seletores de filtro, de cadastro de
 * dispositivo e de emprestimo.
 *
 * Vem de GET /api/labs, nao dos dispositivos: um laboratorio recem-criado
 * ainda nao tem dispositivo nenhum e precisa aparecer de todo modo.
 *
 * `versao` permite recarregar depois de cadastrar um laboratorio.
 */
export function useLaboratorios({ token, versao = 0 } = {}) {
  const [laboratorios, setLaboratorios] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setErro('');

    listarLaboratorios({ token })
      .then((dados) => ativo && setLaboratorios(opcoesDeLaboratorio(dados)))
      .catch((e) => {
        if (!ativo) return;
        setLaboratorios([]);
        setErro(e.message || 'Nao foi possivel carregar os laboratorios.');
      });

    return () => { ativo = false; };
  }, [token, versao]);

  return { laboratorios, erro };
}

/**
 * Emprestimos visiveis para o usuario autenticado.
 *
 * O backend decide o escopo: ADMIN recebe todos, qualquer outro perfil recebe
 * apenas os seus. A tela nao precisa filtrar nada.
 */
export function useEmprestimos({ token, versao = 0 } = {}) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');

    listarEmprestimos({ token })
      .then((dados) => ativo && setItens(Array.isArray(dados) ? dados : []))
      .catch((e) => ativo && setErro(e.message || 'Nao foi possivel carregar os emprestimos.'))
      .finally(() => ativo && setCarregando(false));

    return () => { ativo = false; };
  }, [token, versao]);

  return { itens, carregando, erro };
}
