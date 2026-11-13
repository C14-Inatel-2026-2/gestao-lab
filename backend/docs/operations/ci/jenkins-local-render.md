# Jenkins local e deploy no Render

Este guia configura o fluxo em que o Jenkins roda localmente, executa os testes e o build do backend, e solicita a publicação no Render somente se todas as etapas forem concluídas com sucesso.

```text
Jenkins local -> testes e build -> Deploy Hook -> Render -> backend publicado
```

## 1. Pré-requisitos

- Docker instalado e em execução na máquina local.
- A branch configurada no job enviada ao GitHub com o `Jenkinsfile` atual.
- Serviço do backend criado no Render e conectado ao repositório.
- Deploy automático do serviço no Render desativado. Isso impede que um push publique a aplicação antes de os testes do Jenkins terminarem.

## 2. Iniciar o Jenkins

Na raiz do repositório, crie a imagem com Java 21, Git, curl e os plugins usados pelo pipeline:

```bash
docker build -t gestao-lab-jenkins -f backend/infra/jenkins/Dockerfile .
```

Inicie o container e mantenha as configurações em um volume Docker:

```bash
docker run -d \
  --name gestao-lab-jenkins \
  --restart unless-stopped \
  -p 127.0.0.1:8081:8080 \
  -v gestao-lab-jenkins-data:/var/jenkins_home \
  gestao-lab-jenkins
```

Abra `http://localhost:8081`. Para recuperar a senha inicial do Jenkins, execute:

```bash
docker exec gestao-lab-jenkins \
  cat /var/jenkins_home/secrets/initialAdminPassword
```

Conclua o assistente de configuração e crie o usuário administrador. Em **Manage Jenkins > Nodes > Built-In Node > Configure**, defina um executor para o ambiente local.

## 4. Cadastrar a credencial no Jenkins

Em **Manage Jenkins > Credentials > System > Global credentials > Add Credentials**, crie:

| Campo | Valor |
| --- | --- |
| Kind | `Secret text` |
| Secret | URL completa do Deploy Hook do Render |
| ID | `render-deploy-hook` |

O ID precisa ser exatamente `render-deploy-hook`, pois este é o identificador usado pelo `Jenkinsfile`.

## 5. Criar o job

Crie um item do tipo **Pipeline** chamado `gestao-lab-backend`. Configure-o como **Pipeline script from SCM**:

| Campo | Valor |
| --- | --- |
| SCM | Git |
| Repository URL | `https://github.com/C14-Inatel-2026-2/gestao-lab.git` |
| Branch Specifier | `*/main` |
| Script Path | `Jenkinsfile` |

Adicione uma credencial Git apenas se o repositório for privado. A configuração **Pipeline script from SCM** é necessária para que o Jenkins leia a versão atual do arquivo do GitHub.

## 6. Executar o pipeline a cada commit na main

O `Jenkinsfile` usa o gatilho `githubPush()`. Para o GitHub acionar um Jenkins local, exponha temporariamente a porta local `8081` por um túnel HTTPS. Use a URL pública fornecida pelo túnel e mantenha-o aberto enquanto desejar receber os eventos.

Depois de criar o túnel, em **Manage Jenkins > System**, atualize **Jenkins URL** para a URL HTTPS pública. Isso permite que o Jenkins construa corretamente os links recebidos e enviados pelo GitHub.

No GitHub, abra **Settings > Webhooks > Add webhook** e configure:

| Campo | Valor |
| --- | --- |
| Payload URL | `https://<url-publica-do-jenkins>/github-webhook/` |
| Content type | `application/json` |
| Events | `Just the push event` |
| Active | Habilitado |

No Jenkins, confirme que o job usa `*/main`, salve e execute **Build Now** uma vez após enviar o `Jenkinsfile` atualizado à `main`. Essa execução carrega o arquivo e registra o gatilho `githubPush()`. Depois, faça um push de teste na `main` e confira o novo build no Jenkins. Como o job está limitado a `*/main`, commits em outras branches não devem executá-lo. O evento é disparado ao enviar commits ao GitHub, inclusive por merge; commits que existem apenas na máquina local não geram webhook.

No GitHub, abra o webhook criado e confira **Recent Deliveries**. Uma entrega com resposta HTTP `200` ou `302` indica que o endpoint do Jenkins foi alcançado. Se a entrega falhar, confira se o container Jenkins e o túnel continuam em execução, e se a URL termina com `/github-webhook/`.

Se não for possível manter uma URL pública para a máquina local, configure **Poll SCM** no job com `H/5 * * * *`. Essa alternativa procura novos commits aproximadamente a cada cinco minutos, mas não inicia o pipeline imediatamente após o push.

## 7. Executar e conferir

Use **Build Now**. O resultado esperado é:

1. `Checkout`: obtém o commit do GitHub.
2. `Test`: executa `sh ./mvnw clean test` em `backend`.
3. `Build`: executa `sh ./mvnw verify -DskipTests` em `backend` e exige cobertura de pelo menos 80% das linhas.
4. `Disparar deploy no Render`: obtém o SHA com `git rev-parse HEAD` e solicita o deploy desse commit ao Render.

O Jenkins arquiva o JAR e os relatórios de teste. Depois da última etapa, acompanhe o deploy no painel do Render e consulte `https://<servico>.onrender.com/actuator/health` quando ele terminar.

O arquivo `compose.deploy.yaml` não é usado por esse pipeline. Ele continua útil somente para subir e verificar o backend localmente de forma manual.

## 8. Executar em um agente Windows

O pipeline também suporta Jenkins ou agente instalado diretamente no Windows. Nesse ambiente, testes e build usam `mvnw.cmd` e o deploy usa Windows PowerShell com `Invoke-WebRequest`. Instale Git, JDK 21 e Windows PowerShell no agente e garanta que estejam disponíveis para a conta que executa o Jenkins. Cadastre a mesma credencial `render-deploy-hook` e configure o job e o webhook conforme as etapas anteriores.

O container Docker apresentado neste guia executa Linux mesmo quando o host é Windows; nesse caso, o pipeline usa os comandos Unix.
