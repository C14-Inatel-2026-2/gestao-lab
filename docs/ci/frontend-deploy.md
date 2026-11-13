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

Para criar o primeiro administrador, repasse as variáveis do
[documentação de usuários](../../backend/docs/domains/users/api.md) ao serviço `backend` em `environment`.

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
