import { login, initials, resetUsuarios, ApiError, ROLE_LABELS, STORAGE_KEYS } from './api';

/*
 * Testes unitarios SEM mock.
 *
 * Exercitam as funcoes e a classe exportadas por api.js usando as
 * implementacoes reais - nenhum dublê, nenhum jest.mock. Cada teste segue
 * a estrutura Arranjo / Acao / Verificacao e cobre um unico comportamento.
 */

beforeEach(() => {
  // Isola os cenarios: cada teste comeca com a lista de usuarios original.
  resetUsuarios();
});

describe('initials', () => {
  it('monta a sigla com o primeiro e o ultimo nome', () => {
    expect(initials('Solange Ribeiro da Fonseca')).toBe('SF');
  });

  it('usa as duas primeiras letras quando ha um nome so', () => {
    expect(initials('Mauro')).toBe('MA');
  });

  it('devolve interrogacao para valor vazio ou nulo', () => {
    expect(initials('')).toBe('?');
    expect(initials(null)).toBe('?');
    expect(initials(undefined)).toBe('?');
  });
});

describe('ApiError', () => {
  it('guarda a mensagem e o codigo de status', () => {
    const erro = new ApiError('Email ou senha invalidos.', 401);

    expect(erro.message).toBe('Email ou senha invalidos.');
    expect(erro.status).toBe(401);
    expect(erro.name).toBe('ApiError');
  });

  it('continua sendo um Error, para poder ser capturado em try/catch', () => {
    const erro = new ApiError('falhou', 500);

    expect(erro).toBeInstanceOf(Error);
    expect(erro).toBeInstanceOf(ApiError);
  });
});

describe('ROLE_LABELS', () => {
  it('traduz os perfis do enum Role do backend', () => {
    expect(ROLE_LABELS.ADMIN).toBe('Administrador');
    expect(ROLE_LABELS.PARTICIPANT).toBe('Participante');
  });
});

describe('STORAGE_KEYS', () => {
  it('define as chaves usadas para guardar a sessao', () => {
    expect(STORAGE_KEYS.TOKEN).toBe('gestao-lab:token');
    expect(STORAGE_KEYS.USER).toBe('gestao-lab:user');
  });
});

describe('login - caminho feliz', () => {
  it('autentica um administrador e devolve token e dados do usuario', async () => {
    // Acao
    const resultado = await login('solange@inatel.br', '123456');

    // Verificacao
    expect(resultado.token).toBeTruthy();
    expect(resultado.user).toEqual({
      id: 1,
      name: 'Solange Ribeiro da Fonseca',
      email: 'solange@inatel.br',
      role: 'ADMIN',
      registration: 'GEC-1001',
      active: true,
    });
  });

  it('autentica um participante com o perfil correto', async () => {
    const { user } = await login('igor@inatel.br', '123456');

    expect(user.role).toBe('PARTICIPANT');
    expect(user.name).toBe('Igor Nogueira Olivio');
  });

  it('aceita o email com letras maiusculas e espacos em volta', async () => {
    const { user } = await login('  SOLANGE@INATEL.BR  ', '123456');

    expect(user.id).toBe(1);
  });

  it('nunca devolve a senha junto com os dados do usuario', async () => {
    const { user } = await login('solange@inatel.br', '123456');

    expect(user).not.toHaveProperty('password');
  });
});

describe('login - casos negativos', () => {
  it('rejeita senha incorreta com status 401', async () => {
    // Arranjo: usuario existe, senha esta errada
    const tentativa = login('solange@inatel.br', 'senha-errada');

    // Verificacao
    await expect(tentativa).rejects.toThrow(ApiError);
    await expect(tentativa).rejects.toThrow('Email ou senha invalidos.');
    await expect(tentativa).rejects.toMatchObject({ status: 401 });
  });

  it('rejeita email que nao existe com status 401', async () => {
    const tentativa = login('ninguem@inatel.br', '123456');

    await expect(tentativa).rejects.toThrow('Usuario nao encontrado.');
    await expect(tentativa).rejects.toMatchObject({ status: 401 });
  });

  it('bloqueia usuario inativo com status 403, mesmo com a senha certa', async () => {
    const tentativa = login('ana@inatel.br', '123456');

    await expect(tentativa).rejects.toThrow('Usuario inativo. Procure um administrador.');
    await expect(tentativa).rejects.toMatchObject({ status: 403 });
  });

  it('rejeita senha vazia', async () => {
    await expect(login('solange@inatel.br', '')).rejects.toThrow('Email ou senha invalidos.');
  });
});

describe('resetUsuarios', () => {
  it('restaura a base para o estado inicial entre os testes', async () => {
    resetUsuarios();

    // Depois do reset, os usuarios originais continuam autenticaveis.
    await expect(login('lucas@inatel.br', '123456')).resolves.toMatchObject({
      user: { name: 'Lucas Nolasco Ynoguti' },
    });
  });
});
