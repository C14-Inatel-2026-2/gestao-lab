import { daysLate, formatDate, initials, isOverdue, matchesSearch, pluralize } from './format';

describe('formatDate', () => {
  it('formata uma data ISO simples no padrao brasileiro', () => {
    expect(formatDate('2026-03-14')).toBe('14/03/2026');
  });

  it('devolve um tracinho para valores vazios ou invalidos', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('data-invalida')).toBe('-');
  });
});

describe('daysLate', () => {
  const hoje = new Date('2026-03-20T10:00:00');

  it('retorna zero quando ainda esta dentro do prazo', () => {
    expect(daysLate('2026-03-25', hoje)).toBe(0);
  });

  it('conta os dias de atraso apos a data prevista', () => {
    expect(daysLate('2026-03-17', hoje)).toBe(3);
  });
});

describe('isOverdue', () => {
  const hoje = new Date('2026-03-20T10:00:00');

  it('considera atrasado apenas emprestimos aprovados com data vencida', () => {
    expect(isOverdue({ status: 'APPROVED', expectedReturnDate: '2026-03-10' }, hoje)).toBe(true);
    expect(isOverdue({ status: 'APPROVED', expectedReturnDate: '2026-03-30' }, hoje)).toBe(false);
    expect(isOverdue({ status: 'RETURNED', expectedReturnDate: '2026-03-10' }, hoje)).toBe(false);
  });
});

describe('matchesSearch', () => {
  it('ignora acentos e diferencas de caixa', () => {
    expect(matchesSearch('laboratorio', 'Laboratório de IoT')).toBe(true);
    expect(matchesSearch('IOT', 'Laboratório de IoT')).toBe(true);
  });

  it('retorna verdadeiro quando o termo esta vazio', () => {
    expect(matchesSearch('', 'qualquer coisa')).toBe(true);
  });

  it('retorna falso quando nenhum campo casa', () => {
    expect(matchesSearch('redes', 'Laboratório de IoT', 'LAB-IOT')).toBe(false);
  });
});

describe('initials', () => {
  it('usa o primeiro e o ultimo nome', () => {
    expect(initials('Solange Ribeiro da Fonseca')).toBe('SF');
    expect(initials('Mauro')).toBe('MA');
    expect(initials('')).toBe('?');
  });
});

describe('pluralize', () => {
  it('escolhe singular ou plural conforme a quantidade', () => {
    expect(pluralize(1, 'item', 'itens')).toBe('1 item');
    expect(pluralize(3, 'item', 'itens')).toBe('3 itens');
  });
});
