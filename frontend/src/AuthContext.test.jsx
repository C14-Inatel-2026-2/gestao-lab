import { act, renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { login as loginApi } from './api';

/*
 * Testes unitarios COM mock.
 *
 * O modulo api.js e substituido por um dublê, entao o AuthContext e testado
 * isolado da autenticacao real. Isso permite verificar o contrato entre os
 * dois - quantas vezes a API foi chamada e com quais argumentos - e simular
 * falhas sob demanda, que e o mesmo papel do Mockito no backend.
 */

jest.mock('./api', () => ({
  login: jest.fn(),
  STORAGE_KEYS: { TOKEN: 'gestao-lab:token', USER: 'gestao-lab:user' },
}));

const ADMIN = {
  id: 1,
  name: 'Solange Ribeiro da Fonseca',
  email: 'solange@inatel.br',
  role: 'ADMIN',
  registration: 'GEC-1001',
  active: true,
};

const PARTICIPANTE = { ...ADMIN, id: 4, name: 'Igor Nogueira Olivio', role: 'PARTICIPANT' };

function montar() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('AuthContext - estado inicial', () => {
  it('comeca sem usuario autenticado', () => {
    const { result } = montar();

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it('recupera a sessao ja gravada no localStorage', () => {
    // Arranjo: simula um acesso anterior que deixou a sessao salva
    localStorage.setItem('gestao-lab:user', JSON.stringify(ADMIN));

    const { result } = montar();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.name).toBe('Solange Ribeiro da Fonseca');
  });

  it('ignora sessao corrompida sem quebrar a aplicacao', () => {
    localStorage.setItem('gestao-lab:user', 'isso-nao-e-json');

    const { result } = montar();

    expect(result.current.user).toBeNull();
  });
});

describe('AuthContext.login', () => {
  it('repassa email e senha para a API uma unica vez', async () => {
    loginApi.mockResolvedValue({ token: 'token-123', user: ADMIN });
    const { result } = montar();

    await act(async () => {
      await result.current.login('solange@inatel.br', '123456');
    });

    expect(loginApi).toHaveBeenCalledTimes(1);
    expect(loginApi).toHaveBeenCalledWith('solange@inatel.br', '123456');
  });

  it('guarda token e usuario no localStorage apos autenticar', async () => {
    loginApi.mockResolvedValue({ token: 'token-123', user: ADMIN });
    const { result } = montar();

    await act(async () => {
      await result.current.login('solange@inatel.br', '123456');
    });

    expect(localStorage.getItem('gestao-lab:token')).toBe('token-123');
    expect(JSON.parse(localStorage.getItem('gestao-lab:user'))).toEqual(ADMIN);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('marca isAdmin apenas para o perfil ADMIN', async () => {
    loginApi.mockResolvedValue({ token: 'token-456', user: PARTICIPANTE });
    const { result } = montar();

    await act(async () => {
      await result.current.login('igor@inatel.br', '123456');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('indica carregamento enquanto a API nao responde', async () => {
    // Arranjo: promessa que so resolve quando o teste mandar
    let liberar;
    loginApi.mockReturnValue(new Promise((resolve) => {
      liberar = () => resolve({ token: 'token-123', user: ADMIN });
    }));
    const { result } = montar();

    act(() => {
      result.current.login('solange@inatel.br', '123456');
    });
    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      liberar();
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe('AuthContext.login - caso negativo', () => {
  it('propaga o erro da API e nao cria sessao nenhuma', async () => {
    // Arranjo: a API simulada recusa a autenticacao
    loginApi.mockRejectedValue(new Error('Email ou senha invalidos.'));
    const { result } = montar();

    // Acao + Verificacao
    await act(async () => {
      await expect(result.current.login('solange@inatel.br', 'errada')).rejects.toThrow(
        'Email ou senha invalidos.',
      );
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('gestao-lab:token')).toBeNull();
    expect(localStorage.getItem('gestao-lab:user')).toBeNull();
  });

  it('encerra o carregamento mesmo quando a autenticacao falha', async () => {
    loginApi.mockRejectedValue(new Error('Usuario nao encontrado.'));
    const { result } = montar();

    await act(async () => {
      await expect(result.current.login('ninguem@inatel.br', '123456')).rejects.toThrow();
    });

    expect(result.current.loading).toBe(false);
  });
});

describe('AuthContext.logout', () => {
  it('limpa a sessao da memoria e do localStorage', async () => {
    loginApi.mockResolvedValue({ token: 'token-123', user: ADMIN });
    const { result } = montar();

    await act(async () => {
      await result.current.login('solange@inatel.br', '123456');
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('gestao-lab:token')).toBeNull();
    expect(localStorage.getItem('gestao-lab:user')).toBeNull();
  });

  it('nao chama a API ao sair', async () => {
    loginApi.mockResolvedValue({ token: 'token-123', user: ADMIN });
    const { result } = montar();

    await act(async () => {
      await result.current.login('solange@inatel.br', '123456');
    });
    loginApi.mockClear();

    act(() => {
      result.current.logout();
    });

    expect(loginApi).not.toHaveBeenCalled();
  });
});
