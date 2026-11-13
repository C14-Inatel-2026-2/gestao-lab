import { ApiError, emailInvalido, initials, opcoesDeLaboratorio, senhaInvalida } from './api';

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

describe('opcoesDeLaboratorio (sem mock)', () => {
  it('converte a resposta de GET /api/labs em opcoes ordenadas', () => {
    // Arranjo: o backend devolve [{id, name}]; as telas usam {id, nome}
    const resposta = [
      { id: 2, name: 'Redes' },
      { id: 1, name: 'IoT' },
    ];

    // Acao
    const opcoes = opcoesDeLaboratorio(resposta);

    // Verificacao: renomeado e em ordem alfabetica
    expect(opcoes).toEqual([{ id: 1, nome: 'IoT' }, { id: 2, nome: 'Redes' }]);
  });

  // CASO NEGATIVO
  it('devolve lista vazia para entrada ausente e ignora item sem id', () => {
    expect(opcoesDeLaboratorio(undefined)).toEqual([]);
    expect(opcoesDeLaboratorio([])).toEqual([]);
    expect(opcoesDeLaboratorio([{ name: 'Sem id' }])).toEqual([]);
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
