/**
 * Cliente HTTP do backend e constantes compartilhadas.
 *
 * Nao existe mais modo de demonstracao: tudo aqui fala com a API real.
 * Em desenvolvimento o proxy do Vite encaminha /api para o backend, o que
 * mantem as chamadas na mesma origem e dispensa CORS no servidor.
 */

/** Para servir a interface em outra origem, defina window.__GESTAO_LAB_API__. */
const API_BASE = globalThis.__GESTAO_LAB_API__ ?? '/api';

/** Perfis de acesso, espelhando o enum Role de br.inatel.users. */
export const ROLE_LABELS = { ADMIN: 'Administrador', PARTICIPANT: 'Participante' };

/** Situacao do equipamento, espelhando o enum DeviceStatus de br.inatel.devices. */
export const STATUS = {
  AVAILABLE: 'AVAILABLE',
  BORROWED: 'BORROWED',
  MAINTENANCE: 'MAINTENANCE',
};

/** Rotulo exibido para cada situacao, derivado de STATUS - fonte unica. */
export const STATUS_LABELS = {
  [STATUS.AVAILABLE]: 'Disponivel',
  [STATUS.BORROWED]: 'Emprestado',
  [STATUS.MAINTENANCE]: 'Em manutencao',
};

/** Sessao inteira numa chave: o backend devolve token e usuario no mesmo login. */
export const STORAGE_KEY = 'gestao-lab:sessao';

/** Regras de senha, espelhando UserService.isPasswordValid e RegisterRequest. */
export const SENHA_MIN = 8;
export const SENHA_MAX = 72;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** "Solange Ribeiro" -> "SR" */
export function initials(name) {
  if (!name) return '?';
  const p = String(name).trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/** Mensagem de erro do email, ou string vazia se estiver valido. */
export function emailInvalido(email) {
  const valor = String(email ?? '').trim();
  if (!valor) return 'Informe o email institucional.';
  if (!/^\S+@\S+\.\S+$/.test(valor)) return 'Email invalido.';
  return '';
}

/**
 * Mensagem de erro da senha, ou string vazia se estiver valida.
 * As regras sao as mesmas do backend: recusar aqui evita um 400 previsivel.
 */
export function senhaInvalida(senha) {
  const valor = String(senha ?? '');
  if (!valor) return 'Informe a senha.';
  if (valor.length < SENHA_MIN) return `A senha deve ter no minimo ${SENHA_MIN} caracteres.`;
  if (valor.length > SENHA_MAX) return `A senha deve ter no maximo ${SENHA_MAX} caracteres.`;
  if (!/[A-Z]/.test(valor)) return 'A senha deve ter ao menos uma letra maiuscula.';
  if (!/\d/.test(valor)) return 'A senha deve ter ao menos um digito.';
  return '';
}

/**
 * Laboratorios presentes na lista de dispositivos, ordenados por nome.
 *
 * O backend ainda nao expoe GET /api/labs, mas cada DeviceResponse carrega
 * laboratoryId e laboratoryName - o suficiente para montar os filtros e a
 * selecao de laboratorio do emprestimo sem endpoint proprio.
 */
export function laboratoriosDe(dispositivos) {
  const porId = new Map();
  for (const d of dispositivos ?? []) {
    if (d?.laboratoryId != null && !porId.has(d.laboratoryId)) {
      porId.set(d.laboratoryId, { id: d.laboratoryId, nome: d.laboratoryName ?? `Laboratorio ${d.laboratoryId}` });
    }
  }
  return [...porId.values()].sort((a, b) => a.nome.localeCompare(b.nome));
}

/* Sessao expirada */

let aoExpirar = () => {};

/** O AuthContext registra aqui o encerramento da sessao em qualquer 401. */
export function registrarExpiracao(callback) {
  aoExpirar = typeof callback === 'function' ? callback : () => {};
}

/**
 * Unico ponto de fetch: injeta JSON e o Bearer, e traduz o corpo de erro do
 * Spring em ApiError. Todos os handlers do backend respondem {"message": "..."}.
 */
async function requisitar(caminho, { metodo = 'GET', corpo, token } = {}) {
  const resposta = await fetch(`${API_BASE}${caminho}`, {
    method: metodo,
    headers: {
      Accept: 'application/json',
      ...(corpo === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // Token ausente, invalido ou expirado - inclusive apos reinicio do backend,
    // porque as sessoes do TokenService ficam em memoria.
    if (resposta.status === 401 && token) aoExpirar();
    throw new ApiError(dados?.message ?? `Falha na requisicao (HTTP ${resposta.status})`, resposta.status);
  }
  return dados;
}

/* Autenticacao - rotas publicas */

/** POST /api/auth/register -> 201 { userId, name, email, role }. Nao faz login. */
export function cadastrar({ name, email, password }) {
  return requisitar('/auth/register', { metodo: 'POST', corpo: { name, email, password } });
}

/** POST /api/auth/login -> 200 { token, userId, name, email, role }. */
export function login(email, password) {
  return requisitar('/auth/login', { metodo: 'POST', corpo: { email, password } });
}

/* Dispositivos */

/** GET /api/devices?laboratoryId=&status= -> lista de DeviceResponse. */
export function listarDispositivos({ token, laboratoryId = '', status = '' } = {}) {
  const busca = new URLSearchParams();
  if (laboratoryId) busca.set('laboratoryId', laboratoryId);
  if (status) busca.set('status', status);
  const query = busca.toString();
  return requisitar(`/devices${query ? `?${query}` : ''}`, { token });
}

/** POST /api/devices -> 201. Exige perfil ADMIN. */
export function criarDispositivo({ token, name, description, laboratoryId }) {
  return requisitar('/devices', {
    metodo: 'POST',
    token,
    corpo: { name, description: description || null, laboratoryId: Number(laboratoryId) },
  });
}

/** PATCH /api/devices/{id}/status -> 200. Exige perfil ADMIN. */
export function alterarStatus({ token, id, status }) {
  return requisitar(`/devices/${id}/status`, { metodo: 'PATCH', token, corpo: { status } });
}

/* Emprestimos e usuarios */

/**
 * POST /api/loans -> 201 { id, userId, laboratoryId, startDateTime, endDateTime }.
 * O solicitante nao vai no corpo: o backend usa o usuario autenticado.
 */
export function solicitarEmprestimo({ token, laboratoryId, startDateTime, endDateTime }) {
  return requisitar('/loans', {
    metodo: 'POST',
    token,
    corpo: { laboratoryId: Number(laboratoryId), startDateTime, endDateTime },
  });
}

/** PATCH /api/users/{id}/promote -> 200. Exige perfil ADMIN. */
export function promoverUsuario({ token, id }) {
  return requisitar(`/users/${id}/promote`, { metodo: 'PATCH', token });
}
