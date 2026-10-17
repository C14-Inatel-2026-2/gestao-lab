import {
  login, initials, resetUsuarios, ApiError, ROLE_LABELS, STORAGE_KEYS,
  listarDispositivos, resetDispositivos, STATUS_LABELS,
} from './api';

/*
 * Testes unitarios SEM mock.
 *
 * Exercitam as funcoes e a classe exportadas por api.js usando as
 * implementacoes reais - nenhum dublê, nenhum jest.mock. Cada teste segue
 * a estrutura Arranjo / Acao / Verificacao e cobre um unico comportamento.
 */

beforeEach(() => {
  // Isola os cenarios: cada teste comeca com os dados originais.
  resetUsuarios();
  resetDispositivos();
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

describe('STATUS_LABELS', () => {
  it('traduz as situacoes do enum de dispositivos do backend', () => {
    expect(STATUS_LABELS.AVAILABLE).toBe('Disponivel');
    expect(STATUS_LABELS.LOANED).toBe('Emprestado');
    expect(STATUS_LABELS.MAINTENANCE).toBe('Em manutencao');
  });
});

describe('listarDispositivos - sem filtro', () => {
  it('devolve o inventario completo', async () => {
    const itens = await listarDispositivos();

    expect(itens).toHaveLength(8);
    expect(itens[0]).toEqual(
      expect.objectContaining({ patrimonio: 'IOT-0001', status: 'LOANED' }),
    );
  });

  it('cada item traz os campos que a tela precisa', async () => {
    const [item] = await listarDispositivos();

    ['id', 'nome', 'patrimonio', 'categoria', 'laboratorio', 'status'].forEach((campo) => {
      expect(item).toHaveProperty(campo);
    });
  });

  it('usa apenas situacoes previstas no enum', async () => {
    const itens = await listarDispositivos();
    const validas = Object.keys(STATUS_LABELS);

    expect(itens.every((d) => validas.includes(d.status))).toBe(true);
  });
});

describe('listarDispositivos - filtro por situacao', () => {
  it('devolve somente os disponiveis', async () => {
    const itens = await listarDispositivos({ status: 'AVAILABLE' });

    expect(itens.length).toBeGreaterThan(0);
    expect(itens.every((d) => d.status === 'AVAILABLE')).toBe(true);
  });

  it('devolve somente os que estao em manutencao', async () => {
    const itens = await listarDispositivos({ status: 'MAINTENANCE' });

    expect(itens.every((d) => d.status === 'MAINTENANCE')).toBe(true);
  });
});

describe('listarDispositivos - busca', () => {
  it('encontra por parte do nome, ignorando a caixa', async () => {
    const itens = await listarDispositivos({ q: 'ESP32' });

    expect(itens).toHaveLength(1);
    expect(itens[0].nome).toBe('ESP32 DevKit v1');
  });

  it('encontra por patrimonio', async () => {
    const itens = await listarDispositivos({ q: 'net-0001' });

    expect(itens[0].nome).toBe('Switch Cisco Catalyst 2960');
  });

  it('ignora acentos na busca por laboratorio', async () => {
    const itens = await listarDispositivos({ q: 'robótica' });

    expect(itens.length).toBeGreaterThan(0);
    expect(itens.every((d) => d.laboratorio.includes('Robotica'))).toBe(true);
  });

  it('combina busca e situacao', async () => {
    const itens = await listarDispositivos({ q: 'Laboratorio de IoT', status: 'AVAILABLE' });

    expect(itens.every((d) => d.laboratorio === 'Laboratorio de IoT' && d.status === 'AVAILABLE')).toBe(true);
  });
});

describe('listarDispositivos - casos negativos', () => {
  it('devolve lista vazia quando nada casa com a busca', async () => {
    const itens = await listarDispositivos({ q: 'equipamento-que-nao-existe' });

    expect(itens).toEqual([]);
  });

  it('devolve lista vazia para situacao inexistente', async () => {
    const itens = await listarDispositivos({ q: '', status: 'DESCARTADO' });

    expect(itens).toEqual([]);
  });

  it('nao quebra quando recebe filtros nulos', async () => {
    await expect(listarDispositivos({})).resolves.toHaveLength(8);
  });
});

describe('resetDispositivos', () => {
  it('restaura o inventario para o estado inicial', async () => {
    resetDispositivos();

    await expect(listarDispositivos()).resolves.toHaveLength(8);
  });
});
