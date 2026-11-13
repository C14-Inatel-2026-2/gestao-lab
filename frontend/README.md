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

| Tela | Endpoints | Quem acessa |
| --- | --- | --- |
| Login | `POST /api/auth/login` | público |
| Cadastro | `POST /api/auth/register` | público (cria sempre `PARTICIPANT`) |
| Inventário | `GET /api/devices?laboratoryId=&status=` | autenticado |
| Inventário — solicitar empréstimo | `POST /api/loans` | autenticado |
| Inventário — cadastrar dispositivo | `POST /api/devices` | `ADMIN` |
| Inventário — alterar situação | `PATCH /api/devices/{id}/status` | `ADMIN` |

A validação de senha da tela espelha o backend: mínimo de 8 caracteres, uma
maiúscula e um dígito (máximo de 72). O token vale uma hora e as sessões ficam
em memória no backend, então qualquer `401` numa rota autenticada encerra a
sessão e a tela de login avisa que ela expirou.

## Limitações conhecidas do contrato atual

- **Não existe `GET /api/labs`.** Os laboratórios dos filtros e dos formulários
  são derivados do `laboratoryId`/`laboratoryName` que cada dispositivo traz.
  Quando o endpoint existir, trocar `useLaboratorios`, em `useDispositivos.js`.
- **`GET /api/devices` não tem busca por texto**, só `laboratoryId` e `status`.
  A busca da tela é aplicada no cliente, sobre o resultado da API.
- **Não existe consulta de empréstimos.** Depois do `POST /api/loans` a tela só
  confirma o id devolvido; não há listagem para exibir.
- **O empréstimo é de laboratório, não de dispositivo.** É o que o `LoanRequest`
  aceita hoje.
- **`PATCH /api/users/{id}/promote` não tem tela**, porque não existe endpoint
  para listar usuários e escolher quem promover.

## Testar

```bash
npm test             # suíte completa
npm run test:ci      # + cobertura e relatório JUnit para o Jenkins
```

19 casos em 7 suítes, atendendo ao requisito de testes com e sem mock, com um
caso negativo em cada suíte:

| Suíte | Casos | Tipo |
| --- | --- | --- |
| `api.test.js` | 6 | sem mock — funções puras: regras de senha, derivação de laboratórios, `ApiError`, `initials` |
| `AuthContext.test.jsx` | 2 | `fetch` global dublado — exercita `api.js` real: Bearer, corpo de erro e expiração em `401` |
| `LoginPage.senha.test.jsx` | 2 | com mock — validação antes de chamar a API |
| `CadastroPage.test.jsx` | 2 | com mock — cadastro e conflito de email (409) |
| `DispositivosPage.test.jsx` | 3 | com mock — listagem, falha da API e diferença entre perfis |
| `NovoDispositivo.test.jsx` | 2 | com mock — `POST /api/devices` e acesso negado (403) |
| `EmprestimoForm.test.jsx` | 2 | com mock — `POST /api/loans` e período inválido |

Os dubles de `api.js` usam `jest.requireActual`, então as constantes vêm do
módulo real: se `DeviceStatus` mudar no backend, o teste não passa com o enum
antigo.

## CI

Pipeline declarativo em [`Jenkinsfile`](Jenkinsfile): build, testes com relatório
JUnit e cobertura, empacotamento e publicação. Visão geral do projeto, requisitos
e CI do backend ficam no [README da raiz](../README.md).
