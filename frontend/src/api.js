/**
 * Autenticacao, inventario e constantes compartilhadas.
 *
 * USE_MOCK = true  -> dados em memoria (roda sem backend)
 * USE_MOCK = false -> backend Spring Boot em API_URL
 */

export const USE_MOCK = true;
const API_URL = 'http://localhost:8080/api';
const SENHA_PADRAO = '123456';

/** Perfis de acesso, espelhando o enum Role do backend */
export const ROLE_LABELS = { ADMIN: 'Administrador', PARTICIPANT: 'Participante' };

/** Situacao do equipamento, espelhando o enum de br.inatel.devices */
export const STATUS_LABELS = {
  AVAILABLE: 'Disponivel',
  LOANED: 'Emprestado',
  MAINTENANCE: 'Em manutencao',
};

export const STORAGE_KEYS = { TOKEN: 'gestao-lab:token', USER: 'gestao-lab:user' };

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

/** Compara ignorando acento e caixa. */
const normalizar = (v) =>
  String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const combina = (termo, ...valores) =>
  !normalizar(termo) || valores.some((v) => normalizar(v).includes(normalizar(termo)));

/* ---------------- Backend real ---------------- */

/** Unico ponto de fetch: injeta JSON e traduz erro do Spring em ApiError. */
async function requisitar(caminho, opcoes = {}) {
  const r = await fetch(`${API_URL}${caminho}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...opcoes,
  });

  const texto = await r.text();
  let dados = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!r.ok) {
    const msg = dados?.message || dados?.error || dados?.detail || `Falha na requisicao (HTTP ${r.status})`;
    throw new ApiError(msg, r.status);
  }
  return dados;
}

/* ---------------- Dados em memoria ---------------- */

const criarUsuarios = () => [
  { id: 1, name: 'Solange Ribeiro da Fonseca', email: 'solange@inatel.br', role: 'ADMIN', registration: 'GEC-1001', active: true },
  { id: 2, name: 'Mauro Iwama', email: 'mauro@inatel.br', role: 'ADMIN', registration: 'GEC-1002', active: true },
  { id: 3, name: 'Giovana Franciele Gonçalves Leite', email: 'giovana@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1003', active: true },
  { id: 4, name: 'Igor Nogueira Olivio', email: 'igor@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1004', active: true },
  { id: 5, name: 'Lucas Nolasco Ynoguti', email: 'lucas@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1005', active: true },
  // Inativa de proposito: demonstra o bloqueio de usuario desativado.
  { id: 6, name: 'Ana Beatriz Moura', email: 'ana@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1006', active: false },
];

const criarDispositivos = () => [
  { id: 1, nome: 'Raspberry Pi 4 Model B', patrimonio: 'IOT-0001', categoria: 'Placa', laboratorio: 'Laboratorio de IoT', status: 'LOANED' },
  { id: 2, nome: 'ESP32 DevKit v1', patrimonio: 'IOT-0002', categoria: 'Placa', laboratorio: 'Laboratorio de IoT', status: 'AVAILABLE' },
  { id: 3, nome: 'Sensor BME280', patrimonio: 'IOT-0003', categoria: 'Sensor', laboratorio: 'Laboratorio de IoT', status: 'AVAILABLE' },
  { id: 4, nome: 'Modulo LoRa SX1276', patrimonio: 'IOT-0004', categoria: 'Modulo', laboratorio: 'Laboratorio de IoT', status: 'MAINTENANCE' },
  { id: 5, nome: 'Switch Cisco Catalyst 2960', patrimonio: 'NET-0001', categoria: 'Rede', laboratorio: 'Laboratorio de Redes', status: 'LOANED' },
  { id: 6, nome: 'Roteador Mikrotik hEX', patrimonio: 'NET-0002', categoria: 'Rede', laboratorio: 'Laboratorio de Redes', status: 'AVAILABLE' },
  { id: 7, nome: 'Servo Motor MG996R', patrimonio: 'ROB-0001', categoria: 'Atuador', laboratorio: 'Laboratorio de Robotica', status: 'AVAILABLE' },
  { id: 8, nome: 'Fonte de Bancada 30V/5A', patrimonio: 'ROB-0002', categoria: 'Instrumento', laboratorio: 'Laboratorio de Robotica', status: 'MAINTENANCE' },
];

let usuarios = criarUsuarios();
let dispositivos = criarDispositivos();

/** Usados pelos testes para garantir isolamento entre cenarios. */
export const resetUsuarios = () => { usuarios = criarUsuarios(); };
export const resetDispositivos = () => { dispositivos = criarDispositivos(); };

/** Contas da tela de login, derivadas dos usuarios ativos - fonte unica. */
export const CONTAS_DEMO = criarUsuarios()
  .filter((u) => u.active)
  .map(({ name, email, role }) => ({ name, email, role }));

// Pequeno atraso para a interface exercitar o estado de carregando.
const atraso = () => new Promise((r) => setTimeout(r, 150));

/* ---------------- Usado pela interface ---------------- */

export async function login(email, password) {
  if (!USE_MOCK) {
    return requisitar('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  }
  await atraso();

  const u = usuarios.find((x) => normalizar(x.email) === normalizar(email));
  if (!u) throw new ApiError('Usuario nao encontrado.', 401);
  if (!u.active) throw new ApiError('Usuario inativo. Procure um administrador.', 403);
  if (password !== SENHA_PADRAO) throw new ApiError('Email ou senha invalidos.', 401);

  const { password: _, ...dados } = u;
  return { token: `mock-token-${u.id}`, user: dados };
}

export async function listarDispositivos({ q = '', status = '' } = {}) {
  if (!USE_MOCK) {
    return requisitar(`/devices?${new URLSearchParams({ q, status })}`);
  }
  await atraso();

  return dispositivos
    .filter((d) => (status ? d.status === status : true))
    .filter((d) => combina(q, d.nome, d.patrimonio, d.categoria, d.laboratorio));
}
