# Tela de Login — Gestão de Laboratórios e Dispositivos (C14)

apenas a autenticação.

---

**46 testes** em 5 suítes, com Jest + React Testing Library.

45 passam. **1 falha de propósito** — veja "Teste vermelho" abaixo.

---

## O que esta versão faz

1. **Tela de login** com validação de campos (email obrigatório, formato do
   email, senha obrigatória) antes de chamar a API.
2. **Autenticação** contra a API mock em memória, com três respostas possíveis:
   usuário não encontrado, senha inválida e usuário inativo.
3. **Sessão** guardada no `localStorage` (token + dados do usuário) via
   `AuthContext`.
4. **Tela de confirmação** pós-login, mostrando quem entrou, a matrícula e o
   perfil reconhecido.
5. **Sair**, que limpa a sessão e volta para o login.

Feito em React 18 com Vite. Sem React Router — com uma tela só, o `App.jsx`
alterna entre login e confirmação conforme a sessão.

---

## Testes

46 casos em 5 suítes, cobrindo as classes e os métodos do projeto.

### Atendimento ao requisito

| Requisito | Onde está |
|---|---|
| **2 testes com mock** | `AuthContext.test.jsx` e `LoginPage.unit.test.jsx` — usam `jest.mock` |
| **2 testes sem mock** | `api.test.js` e `LoginPage.test.jsx` — implementações reais |
| **Teste vermelho** | `LoginPage.falha.test.jsx` — falha de propósito, documenta requisito pendente |
| **Teste negativo** | `api.test.js` → "login - casos negativos" (4 casos) e `AuthContext.test.jsx` → "login - caso negativo" (2 casos) |

### `src/api.test.js` — sem mock (16 casos)

Testa as funções e a classe exportadas por `api.js` usando as implementações
reais, sem nenhum dublê.

| Unidade testada | Casos |
|---|---|
| `initials()` | Sigla com dois nomes, nome único, valor vazio |
| `ApiError` (classe) | Guarda mensagem e status; continua sendo um `Error` |
| `ROLE_LABELS`, `STORAGE_KEYS` | Valores esperados pelo backend |
| `login()` — sucesso | Admin, participante, email com maiúsculas/espaços, nunca devolve a senha |
| `login()` — **negativos** | Senha errada (401), email inexistente (401), usuário inativo (403), senha vazia |
| `resetUsuarios()` | Restaura a base entre os testes |

### `src/AuthContext.test.jsx` — com mock (11 casos)

O módulo `api.js` é substituído por um dublê (`jest.mock`), isolando o contexto
da autenticação real. Mesmo papel do Mockito no backend: verificar quantas vezes
a dependência foi chamada, com quais argumentos, e simular falhas sob demanda.

| Método testado | Casos |
|---|---|
| Estado inicial | Sem sessão; recupera sessão salva; ignora sessão corrompida |
| `login()` | Repassa os argumentos uma única vez; grava token e usuário; deriva `isAdmin`; indica carregamento |
| `login()` — **negativo** | Propaga o erro e **não** cria sessão; encerra o carregamento mesmo na falha |
| `logout()` | Limpa memória e `localStorage`; não chama a API |

### `src/LoginPage.unit.test.jsx` — com mock (10 casos)

O componente é testado isolado: `useAuth` e o módulo `api` são substituídos
por dublês. Nada de provider, `localStorage` ou API real.

| Caso | Verifica |
|---|---|
| Formulário renderiza | Campos, rótulos e botão presentes |
| Campos obrigatórios | Mostra os erros e **não** chama o login |
| Formato do email | Rejeita texto que não é email e **não** chama o login |
| Envio válido | Chama o login **uma vez**, com email e senha corretos |
| Espaços no email | São ignorados na validação |
| Erro da API | Exibe a mensagem devolvida pelo login |
| Falha sem texto | Cai na mensagem padrão "Não foi possível entrar." |
| Estado de carregando | Botão desabilitado, com texto "Entrando..." |
| Clique no integrante | Preenche os campos sem disparar o login |
| Novo envio | Limpa o erro anterior antes de tentar de novo |

### `src/LoginPage.test.jsx` — sem mock (8 casos)

Monta a tela junto com o `AuthProvider` e a autenticação real, exercitando o
fluxo de ponta a ponta.

| Caso | Verifica |
|---|---|
| Formulário renderiza | Campos de email e senha presentes |
| Campos obrigatórios | Não chama a API e não cria sessão |
| Formato do email | Rejeita texto que não é email |
| Senha errada | Mostra o erro vindo da API |
| Usuário inativo | Bloqueia o acesso |
| Clique no nome | Preenche email e senha |
| Login com sucesso | Mostra a confirmação e grava a sessão |
| Sair | Limpa a sessão e volta ao login |

### `src/LoginPage.falha.test.jsx` — teste vermelho (1 caso, **falha de propósito**)

Este teste **não está quebrado**: ele documenta um requisito de segurança que a
tela ainda não implementa. É o estado "vermelho" do ciclo do TDD — primeiro se
escreve o teste que descreve o comportamento desejado, depois o código que o
satisfaz.

| | |
|---|---|
| **Requisito** | A tela deve recusar senhas com menos de 6 caracteres, sem chamar a API |
| **Comportamento atual** | `validar()` só verifica se a senha está vazia (`if (!senha)`), então `"123"` passa |
| **Resultado** | Falha ao procurar a mensagem "A senha deve ter no minimo 6 caracteres." |

Para ficar verde, basta acrescentar em `validar()`, em `src/LoginPage.jsx`:

```js
if (!senha) novos.senha = 'Informe a senha.';
else if (senha.length < 6) novos.senha = 'A senha deve ter no minimo 6 caracteres.';
```

Mantido vermelho de propósito, para evidenciar a lacuna.

---

### Boas práticas adotadas

- **Isolamento**: `beforeEach` limpa `localStorage`, reseta os dados e zera os
  dublês, então a ordem de execução não altera o resultado
- **Um comportamento por teste**, com nome descrevendo o que se espera
- **Arranjo / Ação / Verificação** como estrutura de cada caso
- **Consultas por papel e rótulo** (`getByRole`, `getByLabelText`) em vez de
  classes CSS — o teste não quebra quando o estilo muda
- **Verificação de interação**, não só de resultado: confirma que a dependência
  foi chamada o número certo de vezes e com os argumentos certos
