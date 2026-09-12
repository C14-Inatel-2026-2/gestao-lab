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

/* Usado pela interface*/

export async function login(email, password) {
  if (!USE_MOCK) return loginReal(email, password);

  // Pequeno atraso para a interface exercitar o estado de carregando.
  await new Promise((resolve) => setTimeout(resolve, 150));
  return loginMock(email, password);
}
