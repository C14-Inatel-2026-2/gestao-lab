# Deploy do frontend

A interface é servida por um container nginx que também encaminha `/api` para o
backend. O navegador fala sempre com esse servidor, nunca direto com a API.

```text
navegador -> nginx (interface + proxy /api) -> backend
```

Essa escolha tem uma consequência importante: **não é preciso configurar CORS no
backend.** O `SecurityConfig` não tem CORS, e com front e API na mesma origem ele
não precisa ter. É o mesmo arranjo do proxy do Vite em desenvolvimento.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `frontend/Dockerfile` | Build em dois estágios: Node 20 gera o `dist/`, nginx serve |
| `frontend/nginx.conf` | Serve os estáticos e encaminha `/api/` e `/actuator/health` |
| `compose.deploy.yaml` | Serviço `frontend` na porta 8084, dependente do backend saudável |

O `nginx.conf` é um template: a imagem do nginx substitui `${BACKEND_URL}` na
inicialização do container, a partir da variável de ambiente de mesmo nome.

## Rodar localmente com o Compose

Na raiz do repositório:

```bash
docker compose -f compose.deploy.yaml up -d --build --wait
```

- Interface: `http://localhost:8084`
- API, direto: `http://localhost:8083`
- API, pelo proxy da interface: `http://localhost:8084/api/...`

Para conferir que o proxy está de pé:

```bash
curl --fail http://localhost:8084/actuator/health
```

## Administrador inicial

Sem administrador não há como cadastrar laboratório nem dispositivo, e o sistema
trava no primeiro passo. O cadastro público cria sempre `PARTICIPANT`.

A conta administrativa é **opcional** e só é criada quando
`INITIAL_ADMIN_ENABLED=true`. **Não existe senha padrão.** Se já existir qualquer
`ADMIN` no banco, nada é criado nem alterado — inclusive nos reinícios.

Nome, e-mail e senha seguem as mesmas validações do cadastro: e-mail em formato
válido e senha de 8 a 72 caracteres, com ao menos uma letra maiúscula e um
dígito. Dados inválidos, ou e-mail já usado por outro usuário, **interrompem a
inicialização** do backend. A senha é gravada com BCrypt.

O `compose.deploy.yaml` repassa as quatro variáveis ao container do backend, com
`INITIAL_ADMIN_ENABLED` em `false` por padrão. Defini-las apenas no host não
basta: elas precisam chegar ao ambiente do container, e é isso que o `compose`
faz. Copie o [`.env.example`](../../.env.example) da raiz para `.env` e preencha:

```bash
cp .env.example .env
```

```text
INITIAL_ADMIN_ENABLED=true
INITIAL_ADMIN_NAME=Administrador
INITIAL_ADMIN_EMAIL=admin@inatel.br
INITIAL_ADMIN_PASSWORD=<senha definida pelo responsável>
```

Suba, faça login com essa conta e, **depois de confirmar que ela existe**,
devolva `INITIAL_ADMIN_ENABLED` para `false` e apague as credenciais do `.env`.
O `.env` está no `.gitignore`; nunca versione a senha.

Para rodar o backend fora do Compose, as mesmas variáveis valem no ambiente do
processo. Detalhes em
[usuários e autenticação](../../backend/docs/domains/users/api.md).

## Publicar no Render

O backend já tem serviço e deploy hook. O frontend precisa de um segundo serviço:

1. No Render, criar um serviço do tipo **Web Service** com origem neste
   repositório, **Root Directory** `frontend` e runtime **Docker**.
2. Definir a variável de ambiente `BACKEND_URL` com a URL pública do serviço do
   backend, sem barra no final. Exemplo: `https://gestao-lab-backend.onrender.com`.
3. Desativar o deploy automático, como no backend, para que a publicação só
   aconteça depois dos testes do Jenkins.
4. Copiar o **Deploy Hook** do serviço e cadastrá-lo no Jenkins em
   **Manage Jenkins > Credentials > System > Global credentials**:

| Campo | Valor |
| --- | --- |
| Kind | `Secret text` |
| Secret | URL completa do Deploy Hook do frontend |
| ID | `render-deploy-hook-frontend` |

O ID precisa ser exatamente esse, pois é o que o `Jenkinsfile` procura.

5. Rodar o job com o parâmetro **`PUBLICAR_FRONTEND`** marcado.

### Administrador inicial no Render

O `.env` da raiz vale só para o Compose local. **No Render as variáveis vão no
serviço do backend**, em *Environment*, não no serviço do frontend:

| Variável | Valor |
| --- | --- |
| `INITIAL_ADMIN_ENABLED` | `true` na primeira publicação, `false` depois |
| `INITIAL_ADMIN_NAME` | nome do administrador |
| `INITIAL_ADMIN_EMAIL` | e-mail do administrador |
| `INITIAL_ADMIN_PASSWORD` | senha com 8 a 72 caracteres, uma maiúscula e um dígito |

Publique uma vez com `true`, confirme que consegue entrar com essa conta e então
troque para `false` e remova as outras três. Enquanto `true` ficar com dados
inválidos, o serviço **não sobe**: o backend interrompe a inicialização de
propósito, em vez de criar um administrador inconsistente.

Atenção ao banco: no Render o SQLite vive no disco do serviço. Se o serviço for
recriado sem disco persistente, o banco é zerado e o administrador precisa ser
criado de novo.

Enquanto o serviço e a credencial não existirem, deixe `PUBLICAR_FRONTEND`
desmarcado: o stage é pulado e o resto do pipeline segue normalmente.

## Pipeline unificado

Havia dois `Jenkinsfile` no projeto. O do frontend foi removido e suas etapas
entraram no da raiz, que agora tem sete stages:

| Stage | O que faz |
| --- | --- |
| `Checkout` | Obtém o código |
| `Testes do backend` | `mvnw clean test`, publica JUnit |
| `Build do backend` | `mvnw verify -DskipTests` |
| `Testes do frontend` | `npm ci` e `npm run test:ci`, publica JUnit, cobertura com quality gate e relatório HTML |
| `Build do frontend` | `npm run build` e confere o `dist/index.html` |
| `Deploy do backend no Render` | Dispara o deploy hook do backend |
| `Deploy do frontend no Render` | Dispara o deploy hook do frontend, se `PUBLICAR_FRONTEND` |

O quality gate do frontend marca o build como `UNSTABLE` abaixo de 50% de linhas
ou 40% de branches.

A imagem do Jenkins em `backend/infra/jenkins/Dockerfile` passou a incluir
**Node 20** e os plugins **coverage** e **htmlpublisher**, exigidos pelas etapas
do frontend. Quem já tem o container rodando precisa recriá-lo:

```bash
docker build -t gestao-lab-jenkins -f backend/infra/jenkins/Dockerfile .
docker rm -f gestao-lab-jenkins
docker run -d --name gestao-lab-jenkins --restart unless-stopped \
  -p 127.0.0.1:8081:8080 \
  -v gestao-lab-jenkins-data:/var/jenkins_home \
  gestao-lab-jenkins
```

O volume preserva jobs, credenciais e histórico.
