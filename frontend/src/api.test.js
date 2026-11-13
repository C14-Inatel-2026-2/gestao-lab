import { ApiError, emailInvalido, initials, laboratoriosDe, senhaInvalida, STATUS } from './api';

/* Testes unitarios SEM mock: funcoes puras, sem rede e sem dubles. */

describe('senhaInvalida (sem mock)', () => {
  it('aceita senha que cumpre as regras do backend', () => {
    // Oito caracteres, uma maiuscula e um digito - igual a UserService.isPasswordValid
    expect(senhaInvalida('Senha123')).toBe('');
  });

  // CASO NEGATIVO
  it('recusa senha sem maiuscula, sem digito ou curta demais', () => {
    expect(senhaInvalida('senha123')).toBe('A senha deve ter ao menos uma letra maiuscula.');
    expect(senhaInvalida('SenhaSemNumero')).toBe('A senha deve ter ao menos um digito.');
    expect(senhaInvalida('Senha1')).toBe('A senha deve ter no minimo 8 caracteres.');
    expect(senhaInvalida('')).toBe('Informe a senha.');
  });
});

describe('laboratoriosDe (sem mock)', () => {
  it('deriva laboratorios unicos e ordenados da lista de dispositivos', () => {
    // Arranjo: o backend nao expoe GET /api/labs, so laboratoryId/Name em cada device
    const dispositivos = [
      { id: 1, name: 'ESP32', laboratoryId: 2, laboratoryName: 'Redes', status: STATUS.AVAILABLE },
      { id: 2, name: 'Sensor', laboratoryId: 1, laboratoryName: 'IoT', status: STATUS.BORROWED },
      { id: 3, name: 'Servo', laboratoryId: 2, laboratoryName: 'Redes', status: STATUS.AVAILABLE },
    ];

    // Acao
    const laboratorios = laboratoriosDe(dispositivos);

    // Verificacao: sem repeticao e em ordem alfabetica
    expect(laboratorios).toEqual([{ id: 1, nome: 'IoT' }, { id: 2, nome: 'Redes' }]);
  });

  // CASO NEGATIVO
  it('devolve lista vazia para entrada ausente ou sem laboratorio', () => {
    expect(laboratoriosDe(undefined)).toEqual([]);
    expect(laboratoriosDe([{ id: 1, name: 'Sem lab' }])).toEqual([]);
  });
});

describe('ApiError e initials (sem mock)', () => {
  it('ApiError guarda mensagem e status', () => {
    const erro = new ApiError('Invalid email or password', 401);

    expect(erro).toBeInstanceOf(Error);
    expect(erro.name).toBe('ApiError');
    expect(erro.status).toBe(401);
  });

  it('initials e emailInvalido tratam os casos de borda', () => {
    expect(initials('Solange Ribeiro da Fonseca')).toBe('SF');
    expect(initials('Mauro')).toBe('MA');
    expect(initials('')).toBe('?');
    expect(emailInvalido('sem-arroba')).toBe('Email invalido.');
    expect(emailInvalido('ana@inatel.br')).toBe('');
  });
});
