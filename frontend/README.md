# Frontend — Gestão de Laboratórios e Dispositivos (C14)

Interface em React 18 + Vite consumindo a API do backend. Três telas: login,
cadastro e inventário de dispositivos. Sem React Router — o `App.jsx` alterna
conforme a sessão.

## Rodar

O backend precisa estar no ar. O servidor de desenvolvimento faz proxy de `/api`
para ele, o que mantém tudo na mesma origem e dispensa CORS no backend.

```bash
cd frontend
npm ci
npm run dev     # http://localhost:5173
```

Se o backend não estiver em `localhost:8080` (o Compose de deploy publica em
8083), aponte o proxy com `BACKEND_URL`:

```bash
BACKEND_URL=http://localhost:8083 npm run dev
```

## Telas e endpoints

Quatro telas: login, cadastro e a area autenticada com as abas Inventario e
Emprestimos.

| Tela | Endpoints | Quem acessa |
| --- | --- | --- |
| Login | `POST /api/auth/login` | publico |
| Cadastro | `POST /api/auth/register` | publico (cria sempre `PARTICIPANT`) |
| Inventario | `GET /api/devices?laboratoryId=&status=` | autenticado |
| Inventario — cadastrar dispositivo | `POST /api/devices` | `ADMIN` |
| Inventario — alterar situacao | `PATCH /api/devices/{id}/status` | `ADMIN` |
| Emprestimos — listar | `GET /api/loans` | autenticado (proprios; `ADMIN` ve todos) |
| Emprestimos — solicitar | `POST /api/loans` | autenticado |
| Emprestimos — aprovar / rejeitar | `PATCH /api/loans/{id}/approve` e `/reject` | `ADMIN` |
| Emprestimos — registrar devolucao | `PATCH /api/loans/{id}/return` | `ADMIN` |

A validacao de senha da tela espelha o backend: minimo de 8 caracteres, uma
maiuscula e um digito (maximo de 72). O token vale uma hora e as sessoes ficam
em memoria no backend, entao qualquer `401` numa rota autenticada encerra a
sessao e a tela de login avisa que ela expirou.

### Ciclo do emprestimo

O emprestimo e de **dispositivo**, dentro de um laboratorio. A solicitacao nasce
como `REQUESTED`; um administrador aprova (`APPROVED`, e o dispositivo passa a
`BORROWED`) ou rejeita (`REJECTED`); um emprestimo aprovado termina em
`RETURNED`, quando o dispositivo volta a `AVAILABLE`.

Por isso cada acao aparece so no status em que o backend a aceita: aprovar e
rejeitar apenas em `REQUESTED`, devolver apenas em `APPROVED`.

O formulario de solicitacao so oferece dispositivos do laboratorio escolhido e
fora de manutencao, porque o `LoanService` recusa os dois casos com 400 — assim
como periodo invertido e dispositivo ja reservado no mesmo intervalo.

## Limitacoes conhecidas do contrato atual

- **Nao existe `GET /api/labs`.** Os laboratorios dos filtros e dos formularios
  sao derivados do `laboratoryId`/`laboratoryName` que cada dispositivo traz.
  Quando o endpoint existir, trocar `useLaboratorios`, em `useDispositivos.js`.
- **`GET /api/devices` nao tem busca por texto**, so `laboratoryId` e `status`.
  A busca da tela e aplicada no cliente, sobre o resultado da API.
- **`LoanResponse` nao traz o nome do dispositivo nem do solicitante**, so os
  ids. A tela resolve o nome do dispositivo pela lista do inventario; para
  `ADMIN`, o solicitante aparece apenas como id.
- **`PATCH /api/users/{id}/promote` nao tem tela**, porque nao existe endpoint
  para listar usuarios e escolher quem promover.

## Testar

```bash
npm test             # suíte completa
npm run test:ci      # + cobertura e relatório JUnit para o Jenkins
```

29 casos em 9 suítes, atendendo ao requisito de testes com e sem mock, com
casos negativos cobrindo as recusas do backend:

| Suíte | Casos | Tipo |
| --- | --- | --- |
| `api.test.js` | 6 | sem mock — funções puras: regras de senha, derivação de laboratórios, `ApiError`, `initials` |
| `AuthContext.test.jsx` | 2 | `fetch` global dublado — exercita `api.js` real: Bearer, corpo de erro e expiração em `401` |
| `Area.test.jsx` | 4 | com mock — troca de abas e porta de entrada do `App` |
| `LoginPage.senha.test.jsx` | 2 | com mock — validação antes de chamar a API |
| `CadastroPage.test.jsx` | 2 | com mock — cadastro e conflito de email (409) |
| `DispositivosPage.test.jsx` | 3 | com mock — listagem, falha da API e diferença entre perfis |
| `NovoDispositivo.test.jsx` | 2 | com mock — `POST /api/devices` e acesso negado (403) |
| `EmprestimoForm.test.jsx` | 4 | com mock — `POST /api/loans`, filtro de dispositivos, período inválido e conflito de reserva |
| `EmprestimosPage.test.jsx` | 4 | com mock — listagem, perfis e as ações de aprovar e devolver |

Os dubles de `api.js` usam `jest.requireActual`, então as constantes vêm do
módulo real: se `DeviceStatus` mudar no backend, o teste não passa com o enum
antigo.

## CI

Pipeline declarativo em [`Jenkinsfile`](Jenkinsfile): build, testes com relatório
JUnit e cobertura, empacotamento e publicação. Visão geral do projeto, requisitos
e CI do backend ficam no [README da raiz](../README.md).
