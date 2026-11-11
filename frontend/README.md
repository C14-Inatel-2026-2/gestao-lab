# Frontend — Gestão de Laboratórios e Dispositivos (C14)

Interface em React 18 + Vite, com duas telas: login e inventário de dispositivos.
Sem React Router — o `App.jsx` alterna conforme a sessão do `AuthContext`.

> Enquanto `USE_MOCK` estiver `true` em `src/api.js`, as duas telas rodam com dados
> em memória, sem chamar o backend. Ao ligar na API, trocar por variável de ambiente.

## Rodar

```bash
cd frontend
npm ci
npm run dev     # http://localhost:5173
npm run build   # gera dist/
```

## Testar

```bash
npm test             # suíte completa
npm run test:ci      # + cobertura e relatório JUnit para o Jenkins
```

Cinco casos em três suítes, cobrindo o que o requisito pede (2 com mock, 2 sem mock
e um caso negativo em cada):

| Suíte | Casos | Verifica |
| --- | --- | --- |
| `api.test.js` (sem mock) | 2 | Login válido devolve token e nunca a senha; senha incorreta lança `ApiError` 401 |
| `DispositivosPage.test.jsx` (com mock) | 2 | Chama a API uma vez com os filtros certos e lista; em falha, mostra o erro e nenhuma tabela |
| `LoginPage.falha.test.jsx` | 1 | Recusa senha com menos de 6 caracteres sem chamar a API |

A última nasceu como o caso vermelho do ciclo TDD; a validação foi implementada em
`validar()`, em `src/LoginPage.jsx`, e hoje ela é o teste de regressão dessa regra.

## CI

Pipeline declarativo em [`Jenkinsfile`](Jenkinsfile) (sem GitHub Actions): build,
testes com relatório JUnit e cobertura, empacotamento e publicação. O ambiente
Jenkins local com Node 20 está em [`jenkins/`](jenkins/). Visão geral do projeto,
requisitos e CI do backend ficam no [README da raiz](../README.md).
