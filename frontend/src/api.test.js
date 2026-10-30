import { login, ApiError, resetUsuarios } from './api';

/* Testes unitarios SEM mock.*/

beforeEach(() => {
  resetUsuarios();
});

describe('login (sem mock)', () => {
  it('autentica um usuario valido e devolve token e dados', async () => {
    // Acao
    const { token, user } = await login('solange@inatel.br', '123456');

    // Verificacao
    expect(token).toBeTruthy();
    expect(user).toMatchObject({
      id: 1,
      name: 'Solange Ribeiro da Fonseca',
      role: 'ADMIN',
    });
    expect(user).not.toHaveProperty('password');
  });

  // CASO NEGATIVO
  it('rejeita senha incorreta com ApiError de status 401', async () => {
    // Arranjo: usuario existe, senha esta errada
    const tentativa = login('solange@inatel.br', 'senha-errada');

    // Verificacao
    await expect(tentativa).rejects.toThrow(ApiError);
    await expect(tentativa).rejects.toThrow('Email ou senha invalidos.');
    await expect(tentativa).rejects.toMatchObject({ status: 401 });
  });
});
