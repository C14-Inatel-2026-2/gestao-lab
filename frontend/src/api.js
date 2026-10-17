export const USE_MOCK = true;
const API_URL = 'http://localhost:8080/api';

/** Perfis de acesso, espelhando o enum do backend */
export const ROLE_LABELS = {
  ADMIN: 'Administrador',
  PARTICIPANT: 'Participante',
};

export const STORAGE_KEYS = {
  TOKEN: 'gestao-lab:token',
  USER: 'gestao-lab:user',
};

export function initials(name) {
  if (!name) return '?';
  const partes = String(name).trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function loginReal(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const texto = await response.text();
  let dados = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!response.ok) {
    const mensagem =
      (dados && (dados.message || dados.error || dados.detail)) ||
      `Falha na requisicao (HTTP ${response.status})`;
    throw new ApiError(mensagem, response.status);
  }

  return dados;
}

/* mock em memoria */

const SENHA_PADRAO = '123456';

function criarUsuarios() {
  return [
    { id: 1, name: 'Solange Ribeiro da Fonseca', email: 'solange@inatel.br', role: 'ADMIN', registration: 'GEC-1001', active: true },
    { id: 2, name: 'Mauro Iwama', email: 'mauro@inatel.br', role: 'ADMIN', registration: 'GEC-1002', active: true },
    { id: 3, name: 'Giovana Franciele Gonçalves Leite', email: 'giovana@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1003', active: true },
    { id: 4, name: 'Igor Nogueira Olivio', email: 'igor@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1004', active: true },
    { id: 5, name: 'Lucas Nolasco Ynoguti', email: 'lucas@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1005', active: true },
    // Inativa de proposito: demonstra o bloqueio de usuario desativado.
    { id: 6, name: 'Ana Beatriz Moura', email: 'ana@inatel.br', role: 'PARTICIPANT', registration: 'GEC-1006', active: false },
  ];
}

/** Contas da tela de login, derivadas dos usuarios ativos - fonte unica. */
export const CONTAS_DEMO = criarUsuarios()
  .filter((u) => u.active)
  .map(({ name, email, role }) => ({ name, email, role }));

let usuarios = criarUsuarios();

/** Usado pelos testes para garantir isolamento entre cenarios. */
export function resetUsuarios() {
  usuarios = criarUsuarios();
}

function loginMock(email, password) {
  const usuario = usuarios.find((u) => u.email.toLowerCase() === String(email).toLowerCase().trim());

  if (!usuario) throw new ApiError('Usuario nao encontrado.', 401);
  if (!usuario.active) throw new ApiError('Usuario inativo. Procure um administrador.', 403);
  if (password !== SENHA_PADRAO) throw new ApiError('Email ou senha invalidos.', 401);

  const { id, name, role, registration, active } = usuario;
  return { token: `mock-token-${id}`, user: { id, name, email: usuario.email, role, registration, active } };
}

/** Situacao do equipamento, espelhando o enum do backend (br.inatel.devices) */
export const STATUS_LABELS = {
  AVAILABLE: 'Disponivel',
  LOANED: 'Emprestado',
  MAINTENANCE: 'Em manutencao',
};

function criarDispositivos() {
  return [
    { id: 1, nome: 'Raspberry Pi 4 Model B', patrimonio: 'IOT-0001', categoria: 'Placa', laboratorio: 'Laboratorio de IoT', status: 'LOANED' },
    { id: 2, nome: 'ESP32 DevKit v1', patrimonio: 'IOT-0002', categoria: 'Placa', laboratorio: 'Laboratorio de IoT', status: 'AVAILABLE' },
    { id: 3, nome: 'Sensor BME280', patrimonio: 'IOT-0003', categoria: 'Sensor', laboratorio: 'Laboratorio de IoT', status: 'AVAILABLE' },
    { id: 4, nome: 'Modulo LoRa SX1276', patrimonio: 'IOT-0004', categoria: 'Modulo', laboratorio: 'Laboratorio de IoT', status: 'MAINTENANCE' },
    { id: 5, nome: 'Switch Cisco Catalyst 2960', patrimonio: 'NET-0001', categoria: 'Rede', laboratorio: 'Laboratorio de Redes', status: 'LOANED' },
    { id: 6, nome: 'Roteador Mikrotik hEX', patrimonio: 'NET-0002', categoria: 'Rede', laboratorio: 'Laboratorio de Redes', status: 'AVAILABLE' },
    { id: 7, nome: 'Servo Motor MG996R', patrimonio: 'ROB-0001', categoria: 'Atuador', laboratorio: 'Laboratorio de Robotica', status: 'AVAILABLE' },
    { id: 8, nome: 'Fonte de Bancada 30V/5A', patrimonio: 'ROB-0002', categoria: 'Instrumento', laboratorio: 'Laboratorio de Robotica', status: 'MAINTENANCE' },
  ];
}

let dispositivos = criarDispositivos();

/** Usado pelos testes para garantir isolamento entre cenarios. */
export function resetDispositivos() {
  dispositivos = criarDispositivos();
}

/** Busca sem acento e sem diferenciar maiusculas. */
function combina(termo, ...valores) {
  const alvo = String(termo || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  if (!alvo) return true;
  return valores.some((v) => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(alvo));
}

async function listarDispositivosReal({ q, status }) {
  const busca = new URLSearchParams();
  if (q) busca.set('q', q);
  if (status) busca.set('status', status);
  const response = await fetch(`${API_URL}/devices?${busca}`);
  if (!response.ok) throw new ApiError('Nao foi possivel carregar o inventario.', response.status);
  return response.json();
}

export async function listarDispositivos({ q = '', status = '' } = {}) {
  if (!USE_MOCK) return listarDispositivosReal({ q, status });

  await new Promise((resolve) => setTimeout(resolve, 150));
  return dispositivos
    .filter((d) => (status ? d.status === status : true))
    .filter((d) => combina(q, d.nome, d.patrimonio, d.categoria, d.laboratorio));
}

/* Usado pela interface*/

export async function login(email, password) {
  if (!USE_MOCK) return loginReal(email, password);

  // Pequeno atraso para a interface exercitar o estado de carregando.
  await new Promise((resolve) => setTimeout(resolve, 150));
  return loginMock(email, password);
}
