# Tela de Login - Gestão de Laboratórios e Dispositivos (C14)

apenas a autenticação.

---

**74 testes** em 6 suítes, com Jest + React Testing Library.

73 passam, 1 falha de propósito.

---

## As duas telas

### 1. Login

- Validação dos campos (email obrigatório, formato, senha obrigatória) antes de chamar a API
- Autenticação com três respostas: usuário não encontrado, senha inválida e usuário inativo
- Sessão guardada no `localStorage` via `AuthContext`
- Lista dos cinco integrantes: clicar no nome preenche os campos

### 2. Inventário de dispositivos

Abre após o login — é o núcleo do sistema.

- **Lista os equipamentos** com nome, patrimônio, categoria, laboratório e situação
- **Busca** por qualquer um desses campos, ignorando acento e caixa
- **Filtro por situação**: Disponível, Emprestado ou Em manutenção
- **Resumo** com total de itens e quantos estão disponíveis
- **Cabeçalho** com o usuário, o perfil reconhecido e o botão Sair
- Orientação diferente para Administrador e Participante

Feito em React 18 com Vite. Sem React Router — com duas telas, o `App.jsx`
alterna conforme a sessão.

---

## Testes

74 casos em 6 suítes, cobrindo as duas telas, as classes e os métodos do projeto.

### Atendimento ao requisito

| Requisito | Onde está |
|---|---|
| **2 testes com mock** | `AuthContext.test.jsx`, `LoginPage.unit.test.jsx` e `DispositivosPage.test.jsx` |
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

### `src/DispositivosPage.test.jsx` — com mock (16 casos)

A tela do inventário testada isolada: `api.js` e `useAuth` substituídos por dublês.

| Grupo | Casos |
|---|---|
| Cabeçalho | Nome e perfil de quem entrou; Sair chama `logout`; orientação muda para participante |
| Listagem | Carregando; itens com patrimônio e situação; resumo de disponíveis; busca inicial sem filtros; lista vazia |
| Filtros | Repassa o termo digitado; repassa a situação escolhida; oferece todas as situações |
| **Negativos** | Erro da API exibe mensagem; tabela não aparece; carregamento é encerrado |

Os casos de `listarDispositivos` **sem mock** (14, sendo 3 negativos) estão em `api.test.js`.

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

---

## CI/CD (Jenkins)

Pipeline declarativo em [`Jenkinsfile`](Jenkinsfile). **Não usa GitHub Actions.**

### Jobs do pipeline

| Stage | O que faz |
|---|---|
| **Checkout** | Obtém o código e registra commit e branch |
| **Build** | `npm ci` (versões travadas) e `vite build` → gera `dist/` |
| **Testes** | Roda a suíte, publica **relatório JUnit** e **cobertura** |
| **Empacotar** | Gera `gestao-lab-frontend-<build>.tar.gz` e arquiva no Jenkins |
| **Deploy** | Extrai o artefato no diretório de publicação, com arquivo `VERSION` |

### Relatórios visíveis no Jenkins

**Relatório de testes** — aba *Test Result*, alimentada por `reports/junit/junit.xml`
(gerado pelo `jest-junit`). Mostra os 46 casos, quais passaram e a mensagem de cada falha.

**Cobertura** — em dois lugares:

- *Coverage* (plugin Coverage), a partir de `coverage/cobertura-coverage.xml`,
  com gráfico de tendência entre builds e **quality gate**: abaixo de 70% de
  linhas ou 60% de branches o build vira `UNSTABLE`.
- *Cobertura de Testes* (plugin HTML Publisher), o relatório HTML navegável
  linha a linha.

Cobertura atual: **85,53% instruções · 87,40% linhas · 74,39% branches · 95,74% funções**.
As duas telas, o `App` e o `AuthContext` estão em **100% de linhas**.

### Sobre o teste vermelho

`LoginPage.falha.test.jsx` falha de propósito (requisito pendente, veja acima).
O stage de testes usa `catchError` para marcar o build como **UNSTABLE** em vez de
abortar — assim o relatório é publicado e o pipeline segue, com a falha visível.

Para o pipeline ficar verde, implemente a validação de senha mínima ou rode:

```bash
npm run test:ci -- --testPathIgnorePatterns "falha"
```

### Rodando o Jenkins localmente

Ambiente pronto em [`jenkins/`](jenkins/) — Jenkins LTS com Node 20 e os plugins já instalados.

```bash
cd frontend/jenkins
docker compose up -d --build
```

Acesse `http://localhost:8081`. A senha inicial sai com:

```bash
docker exec jenkins-gestao-lab cat /var/jenkins_home/secrets/initialAdminPassword
```

Depois crie um job do tipo **Pipeline**, aponte para o repositório e use
**Script Path** = `frontend/Jenkinsfile`.

### Pré-requisitos no agente

Node.js 20 e os plugins **JUnit**, **Coverage**, **HTML Publisher**. Se o Node
estiver cadastrado em *Global Tool Configuration*, descomente o bloco `tools`
no `Jenkinsfile`.
