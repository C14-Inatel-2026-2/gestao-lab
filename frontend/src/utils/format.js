/** Converte "2026-03-14" ou ISO completo em "14/03/2026". */
export function formatDate(value) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
}

/** "14/03/2026 09:30" */
export function formatDateTime(value) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** Dias de atraso em relacao a data prevista (0 se ainda no prazo). */
export function daysLate(expectedReturnDate, reference = new Date()) {
  if (!expectedReturnDate) return 0;
  const expected = new Date(`${String(expectedReturnDate).slice(0, 10)}T23:59:59`);
  if (Number.isNaN(expected.getTime())) return 0;
  const diff = reference.getTime() - expected.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function isOverdue(loan, reference = new Date()) {
  if (!loan || loan.status !== 'APPROVED') return false;
  return daysLate(loan.expectedReturnDate, reference) > 0;
}

/** "Solange Ribeiro" -> "SR" */
export function initials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Data de hoje no formato aceito por <input type="date">. */
export function todayISO(reference = new Date()) {
  const tzOffset = reference.getTimezoneOffset() * 60000;
  return new Date(reference.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function addDaysISO(days, reference = new Date()) {
  const next = new Date(reference);
  next.setDate(next.getDate() + days);
  return todayISO(next);
}

/** Busca simples e acento-insensivel usada nos filtros das tabelas. */
export function matchesSearch(term, ...values) {
  const query = normalize(term);
  if (!query) return true;
  return values.some((value) => normalize(value).includes(query));
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}
