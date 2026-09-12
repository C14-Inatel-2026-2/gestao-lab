// Enums espelhando o dominio do backend (br.inatel.users / labs / devices / loans)

export const ROLES = {
  ADMIN: 'ADMIN',
  PARTICIPANT: 'PARTICIPANT',
};

export const ROLE_LABELS = {
  ADMIN: 'Administrador',
  PARTICIPANT: 'Participante',
};

export const DEVICE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  LOANED: 'LOANED',
  MAINTENANCE: 'MAINTENANCE',
};

export const DEVICE_STATUS_LABELS = {
  AVAILABLE: 'Disponivel',
  LOANED: 'Emprestado',
  MAINTENANCE: 'Em manutencao',
};

export const DEVICE_STATUS_TONES = {
  AVAILABLE: 'success',
  LOANED: 'info',
  MAINTENANCE: 'warning',
};

export const LOAN_STATUS = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RETURNED: 'RETURNED',
  OVERDUE: 'OVERDUE',
};

export const LOAN_STATUS_LABELS = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Em uso',
  REJECTED: 'Recusado',
  RETURNED: 'Devolvido',
  OVERDUE: 'Em atraso',
};

export const LOAN_STATUS_TONES = {
  REQUESTED: 'warning',
  APPROVED: 'info',
  REJECTED: 'neutral',
  RETURNED: 'success',
  OVERDUE: 'danger',
};

export const PROJECT_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  FINISHED: 'FINISHED',
};

export const PROJECT_STATUS_LABELS = {
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  FINISHED: 'Concluido',
};

export const PROJECT_STATUS_TONES = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  FINISHED: 'neutral',
};

export const STORAGE_KEYS = {
  TOKEN: 'gestao-lab:token',
  USER: 'gestao-lab:user',
};

export function optionsFromLabels(labels) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}
