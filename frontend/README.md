# Tela de Login - Gestão de Laboratórios e Dispositivos (C14)

apenas a autenticação.

---

**5 testes** em 3 suítes, com Jest + React Testing Library.

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

Cinco casos em três suítes, cobrindo exatamente o que o requisito pede.

### Atendimento ao requisito

| Requisito | Onde está |
|---|---|
| **2 testes com mock** | `DispositivosPage.test.jsx` — usa `jest.mock` em `api.js` e `AuthContext` |
| **2 testes sem mock** | `api.test.js` — implementações reais de `login` e `ApiError` |
| **Teste negativo** | Um em cada suíte: senha incorreta (401) e falha da API |
| **Teste vermelho** | `LoginPage.falha.test.jsx` — falha de propósito |

### `src/api.test.js` — sem mock (2 casos)

| Caso | Verifica |
|---|---|
| Login válido | Devolve token e dados; nunca devolve a senha |
| **Negativo** — senha incorreta | Lança `ApiError` com mensagem e status 401 |

### `src/DispositivosPage.test.jsx` — com mock (2 casos)

A tela isolada: `api.js` e `useAuth` substituídos por dublês. Mesmo papel do
Mockito no backend — verificar a interação com a dependência e simular falhas.

| Caso | Verifica |
|---|---|
| Listagem | Chama a API **uma vez**, com os filtros certos, e exibe o resultado |
| **Negativo** — API falha | Exibe a mensagem de erro e não renderiza a tabela |

### `src/LoginPage.falha.test.jsx` — teste vermelho (1 caso, **falha de propósito**)

Não está quebrado: documenta um requisito de segurança que a tela ainda não
implementa — recusar senha com menos de 6 caracteres. É o estado "vermelho"
do ciclo TDD.

Para ficar verde, acrescente em `validar()`, em `src/LoginPage.jsx`:

```js
else if (senha.length < 6) novos.senha = 'A senha deve ter no minimo 6 caracteres.';
```

### Cobertura

**54,88% linhas · 53,94% instruções · 45,12% branches · 60,41% funções**

Por arquivo: `DispositivosPage` 91,7% · `LoginPage` 77,8% · `api.js` 57,7%.
`App.jsx` e `AuthContext.jsx` ficam em 0% — não há teste que os exercite,
já que a suíte foi mantida no mínimo exigido.

### Boas práticas adotadas

- **Isolamento**: `beforeEach` reseta os dados e `afterEach` zera os dublês,
  então a ordem de execução não altera o resultado
- **Um comportamento por teste**, com nome descrevendo o que se espera
- **Arranjo / Ação / Verificação** como estrutura, marcada em comentários
- **Consultas por papel e texto** (`getByRole`, `findByText`) em vez de classe
  CSS — o teste não quebra quando o estilo muda
- **Verificação de interação**, não só de resultado: confirma que a dependência
  foi chamada o número certo de vezes e com os argumentos certos

## CI/CD (Jenkins)

Pipeline declarativo em [`Jenkinsfile`](Jenkinsfile). **Não usa GitHub Actions.**

### Jobs do pipeline

| Stage | O que faz |
|---|---|
| **Checkout** | Obtém o código e registra commit e branch |
| **Build** | `npm ci` (versões travadas) e `vite build` → gera `dist/` |
| **Testes** | Roda a suíte, publica **relatório JUnit** e **cobertura** |
| **Empacotar** | Gera `gestao-lab-frontend-<build>.tar.gz` e arquiva no Jenkins |
| **Deploy** | Publica em `$JENKINS_HOME/deploy/.../releases/<build>`, com link `current` e arquivo `VERSION` |

### Relatórios visíveis no Jenkins

**Relatório de testes** — aba *Test Result*, alimentada por `reports/junit/junit.xml`
(gerado pelo `jest-junit`). Mostra os 46 casos, quais passaram e a mensagem de cada falha.

**Cobertura** — em dois lugares:

- *Coverage* (plugin Coverage), a partir de `coverage/cobertura-coverage.xml`,
  com gráfico de tendência entre builds e **quality gate**: abaixo de 50% de
  linhas ou 40% de branches o build vira `UNSTABLE`.
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

### Validando o Jenkinsfile

Com o Jenkins no ar, o linter oficial checa a sintaxe antes de commitar:

```bash
curl -s -u admin:SUA_SENHA -X POST -F "jenkinsfile=<frontend/Jenkinsfile" http://localhost:8081/pipeline-model-converter/validate
```

Resposta esperada: `Jenkinsfile successfully validated.`

### Pré-requisitos no agente

Node.js 20 e os plugins **JUnit**, **Coverage**, **HTML Publisher**. Se o Node
estiver cadastrado em *Global Tool Configuration*, descomente o bloco `tools`
no `Jenkinsfile`.
