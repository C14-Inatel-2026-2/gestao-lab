# Frontend — Gestão de Laboratórios e Dispositivos (C14)

Interface React do sistema de controle centralizado de laboratórios acadêmicos.
Faz parte do monorepo `gestao-lab`, ao lado de `backend/` (Spring Boot + PostgreSQL).

Responsável: **Solange Ribeiro da Fonseca** — telas, consumo das APIs e testes com Jest + React Testing Library.

---

## Stack

| Item | Escolha |
|---|---|
| Biblioteca | React 18 |
| Build / dev server | Vite 5 |
| Rotas | React Router 6 |
| Dependências | npm |
| Testes | Jest 29 + React Testing Library + user-event |
| Estilos | CSS puro com design tokens (`src/styles/tokens.css`) |

Sem dependência de UI kit — o layout é próprio, para não travar o time em nenhuma
biblioteca externa durante a NP2.

---

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173` (ou na porta informada por `--port`).

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build de produção |
| `npm test` | Roda a suíte Jest |
| `npm run test:watch` | Jest em modo watch |
| `npm run test:coverage` | Relatório de cobertura |
| `npm run lint` | ESLint |

---

## Modo mock (o frontend roda sem backend)

Hoje o diretório `backend/` tem apenas a estrutura de pacotes (`users`, `labs`,
`devices`, `loans`) — nenhum endpoint implementado. Para que as telas pudessem ser
construídas e testadas em paralelo, existe uma **API mock em memória** que reproduz
o contrato REST esperado, com dados de demonstração e as regras de negócio
(disponibilidade, conflito de alocação, atraso).

Controle pelo `.env`:

```bash
VITE_USE_MOCK=true                        # dados em memória (padrão)
VITE_USE_MOCK=false                       # consome o backend real
VITE_API_URL=http://localhost:8080/api    # base da API real
```

Quando os controllers do Spring Boot subirem, basta trocar `VITE_USE_MOCK` para
`false`. Nenhuma tela precisa ser alterada: `src/api/index.js` troca a
implementação, e `src/api/realApi.js` já mapeia todos os endpoints.

### Credenciais do modo demonstração

Senha para todos: `123456`. Na tela de login basta clicar no nome para preencher os campos.

| Integrante | Perfil | Email |
|---|---|---|
| Solange Ribeiro da Fonseca | Administrador | `solange@inatel.br` |
| Mauro Iwama | Administrador | `mauro@inatel.br` |
| Giovana Franciele Gonçalves Leite | Participante | `giovana@inatel.br` |
| Igor Nogueira Olivio | Participante | `igor@inatel.br` |
| Lucas Nolasco Ynoguti | Participante | `lucas@inatel.br` |

---

## Telas

| Rota | Tela | Acesso |
|---|---|---|
| `/login` | Autenticação | Público |
| `/` | Painel (indicadores + movimentações recentes) | Autenticado |
| `/laboratorios` | Lista e CRUD de laboratórios | Leitura: todos / Escrita: admin |
| `/laboratorios/:id` | Detalhe com abas de dispositivos, projetos e membros | Autenticado |
| `/projetos` | Lista e CRUD de projetos | Leitura: todos / Escrita: admin |
| `/projetos/:id` | Participantes, dispositivos alocados e histórico | Autenticado |
| `/dispositivos` | Inventário, filtros, status e solicitação de empréstimo | Leitura: todos / Escrita: admin |
| `/emprestimos` | Solicitação, aprovação, recusa e devolução | Autenticado |
| `/relatorios` | Atrasos, alocações por projeto e histórico por período | Autenticado |
| `/usuarios` | CRUD de usuários e perfis | **Somente admin** |

Controle de acesso em `src/auth/ProtectedRoute.jsx`: rotas sem sessão vão para
`/login`; rotas `adminOnly` redirecionam participantes para o painel.

---

## Regras de negócio cobertas na interface

- Um empréstimo **sempre** é atrelado a um projeto ativo.
- O dispositivo precisa pertencer ao **mesmo laboratório** do projeto.
- Item em manutenção não pode ser emprestado.
- Um dispositivo com solicitação ou empréstimo em aberto **não pode ser solicitado de novo** (impede alocação conflitante).
- Aprovar muda o dispositivo para `LOANED`; registrar devolução volta para `AVAILABLE`.
- Empréstimo aprovado com data prevista vencida aparece como **Em atraso**, com o número de dias.
- Status manual (`Manutenção` / `Liberar`) é bloqueado enquanto o item estiver emprestado.

---

## Contrato REST esperado do backend

Definido em `src/api/realApi.js`. Base: `VITE_API_URL` (padrão `http://localhost:8080/api`).
Autenticação por `Authorization: Bearer <token>`.

### Autenticação
```
POST   /auth/login            { email, password } -> { token, user }
GET    /auth/me               -> user
```

### Usuários — `br.inatel.users`
```
GET    /users?q=&role=
POST   /users
GET    /users/{id}
PUT    /users/{id}
DELETE /users/{id}
```

### Laboratórios — `br.inatel.labs`
```
GET    /labs?q=
POST   /labs
GET    /labs/{id}
PUT    /labs/{id}
DELETE /labs/{id}
GET    /labs/{id}/members
POST   /labs/{id}/members          { userId, role }
DELETE /labs/{id}/members/{userId}
```

### Projetos — `br.inatel.labs`
```
GET    /projects?labId=&status=&q=
POST   /projects
GET    /projects/{id}              (inclui members, devices e loans)
PUT    /projects/{id}
DELETE /projects/{id}
POST   /projects/{id}/members      { userId }
DELETE /projects/{id}/members/{userId}
POST   /projects/{id}/devices      { deviceId }
DELETE /projects/{id}/devices/{deviceId}
```

### Dispositivos — `br.inatel.devices`
```
GET    /devices?labId=&status=&projectId=&q=
POST   /devices
GET    /devices/{id}
PUT    /devices/{id}
DELETE /devices/{id}
PATCH  /devices/{id}/status        { status }
```

### Empréstimos — `br.inatel.loans`
```
GET    /loans?status=&projectId=&userId=&labId=&q=
POST   /loans                      { deviceId, projectId, userId, expectedReturnDate, notes }
GET    /loans/{id}
POST   /loans/{id}/approve
POST   /loans/{id}/reject          { reason }
POST   /loans/{id}/return
```

### Relatórios — `br.inatel.loans`
```
GET    /reports/overview
GET    /reports/movements?from=&to=&labId=
GET    /reports/overdue
GET    /reports/allocations-by-project
```

### Enums

```
role           ADMIN | PARTICIPANT
device.status  AVAILABLE | LOANED | MAINTENANCE
loan.status    REQUESTED | APPROVED | REJECTED | RETURNED | OVERDUE
project.status ACTIVE | PAUSED | FINISHED
```

`OVERDUE` é derivado (empréstimo `APPROVED` com `expectedReturnDate` vencida) —
o backend pode devolvê-lo calculado ou deixar que o frontend derive, os dois
caminhos já funcionam.

### Formato de erro

O wrapper de `fetch` (`src/api/http.js`) lê `message`, `error` ou `detail` do
corpo da resposta e mostra na interface. Um `ProblemDetail` padrão do Spring
funciona sem ajustes.

---

## Estrutura

```
src/
├── api/
│   ├── http.js            wrapper de fetch (token, JSON, tratamento de erro)
│   ├── realApi.js         endpoints do backend Spring Boot
│   ├── index.js           escolhe mock ou API real
│   └── mock/              banco em memória + regras de negócio
├── auth/                  AuthContext e ProtectedRoute
├── components/            Layout, ToastProvider e a biblioteca de UI (ui.jsx)
├── hooks/                 useAsync (loading, erro, reload)
├── pages/                 uma tela por arquivo
├── styles/                tokens.css e global.css
└── utils/                 constantes (enums) e formatação (datas, atraso, busca)
```

---

## Testes

```bash
npm test
```

**47 testes em 6 suítes**, todos passando:

| Suíte | Cobre |
|---|---|
| `utils/format.test.js` | Datas, cálculo de atraso, busca sem acento, iniciais |
| `api/mock/mockApi.test.js` | Login, ciclo do empréstimo, conflito de alocação, relatórios, inventário |
| `auth/ProtectedRoute.test.jsx` | Redirecionamento sem sessão e bloqueio de participante em rota de admin |
| `pages/LoginPage.test.jsx` | Validação de campos, credencial inválida, sessão salva, lista dos integrantes |
| `pages/DevicesPage.test.jsx` | Listagem, filtro, ações por perfil, validação do cadastro |
| `pages/LoansPage.test.jsx` | Aprovação, devolução, ações por perfil, validação da solicitação |

Configuração: `jest.config.cjs` (jsdom, mock de CSS via `identity-obj-proxy`) e
`babel.config.cjs` (preset-env + preset-react com runtime automático).
