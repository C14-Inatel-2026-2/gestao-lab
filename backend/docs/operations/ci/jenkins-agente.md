# Agente Jenkins com Java 21, Node.js e npm

O arquivo `backend/infra/jenkins/agent.Dockerfile` cria um agente baseado em
`jenkins/inbound-agent:jdk21` e adiciona Node.js 24 e npm. As ferramentas de build
ficam no agente; os plugins de publicação de relatórios ficam no controlador Jenkins.

Os comandos abaixo usam PowerShell no Windows com Docker Desktop em modo de
containers Linux. Execute-os na raiz do repositório.

## 1. Construir e conferir a imagem

```powershell
docker build --tag gestao-lab-agent:local --file backend/infra/jenkins/agent.Dockerfile .
docker run --rm --entrypoint sh gestao-lab-agent:local -c 'node --version && npm --version && java -version'
```

Confira o sucesso do build antes de iniciar o agente. As tags `node:24-bookworm-slim`
e `jenkins/inbound-agent:jdk21` recebem atualizações; registre as versões efetivamente
usadas em cada validação.

## 2. Cadastrar o nó

Em **Gerenciar Jenkins > Nós > Novo nó**, crie um agente permanente com:

| Campo | Valor |
| --- | --- |
| Nome | `gestao-lab-agent` |
| Executores | `1` |
| Diretório remoto | `/home/jenkins/agent` |
| Rótulo | `gestao-lab` |
| Método de inicialização | Conectar o agente ao controlador |

Após salvar, abra a página do nó para obter seu segredo de conexão.

## 3. Iniciar um agente novo

O exemplo conecta ao Jenkins disponível no Windows em `http://localhost:8080`.
Dentro do container, use `http://host.docker.internal:8080/`. Se o controlador usa
outra porta, ajuste `$jenkinsUrl`. No [guia do controlador](jenkins-local-render.md),
o exemplo publica a porta `8081`.

Este comando cria um container novo chamado `gestao-lab-agent`. Se esse nome já
existe, preserve a configuração e o volume do agente existente ao planejar sua
substituição. O segredo solicitado é o do nó, exibido na página do Jenkins.

```powershell
& {
    $jenkinsUrl = 'http://host.docker.internal:8080/'
    $segredo = Read-Host 'Cole somente o segredo do agente' -AsSecureString
    $segredoAnterior = $env:JENKINS_SECRET

    try {
        $env:JENKINS_SECRET = [System.Net.NetworkCredential]::new('', $segredo).Password

        docker run -d --init `
            --name gestao-lab-agent `
            --restart unless-stopped `
            --env JENKINS_SECRET `
            --volume gestao-lab-agent-data:/home/jenkins/agent `
            gestao-lab-agent:local `
            -url $jenkinsUrl `
            -name gestao-lab-agent `
            -webSocket `
            -workDir /home/jenkins/agent

        if ($LASTEXITCODE -ne 0) { throw 'Falha ao iniciar o agente.' }
    }
    finally {
        if ($null -eq $segredoAnterior) {
            Remove-Item Env:JENKINS_SECRET -ErrorAction SilentlyContinue
        }
        else {
            $env:JENKINS_SECRET = $segredoAnterior
        }
        $segredo.Dispose()
    }
}
```

O segredo é fornecido ao Docker pela variável de ambiente, sem incluí-lo no
comando salvo no histórico. Não grave esse valor no repositório.

## 4. Conferir a conexão e as ferramentas

```powershell
docker exec gestao-lab-agent node --version
docker exec gestao-lab-agent npm --version
docker exec gestao-lab-agent java -version
docker logs --tail 25 gestao-lab-agent
```

Nos logs, confira `WebSocket connection open` e `Connected`. Na página do nó,
confirme que o agente está conectado.

O `Jenkinsfile` da base desta alteração usa `agent any`. Para um pipeline que
precisa executar neste agente, configure a seleção pelo rótulo:

```groovy
agent { label 'gestao-lab' }
```

Confira no log do build qual nó foi utilizado. A imagem do agente fornece as
ferramentas; a seleção do nó é feita pela configuração do pipeline.

## 5. Plugins no controlador

Em **Gerenciar Jenkins > Plugins**, instale e confirme o carregamento de:

| Plugin | ID | Uso |
| --- | --- | --- |
| Coverage | `coverage` | Publicar relatórios com `recordCoverage` |
| HTML Publisher | `htmlpublisher` | Publicar relatórios HTML com `publishHTML` |

Esses plugins publicam relatórios gerados pelo build. Os testes e a geração da
cobertura continuam sendo executados pelas ferramentas do projeto.

## Validação de 14/11/2026

A imagem foi construída no Docker Desktop e usada no agente local. Foram
conferidos:

| Verificação | Resultado |
| --- | --- |
| Node.js | `24.22.3` |
| npm | `11.19.1` |
| Java | OpenJDK `21.0.13` |
| Conexão WebSocket | `WebSocket connection open` e `Connected` |
| Coverage e HTML Publisher | Instalação e carregamento com sucesso no controlador |

Esse registro cobre a preparação do ambiente. A validação do pipeline integrado
de backend e frontend permanece pendente das correções das PRs
[#8](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/8) e
[#39](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/39).

Na execução final, registre o commit, o número do build, o nó utilizado, os
resultados dos testes e os relatórios publicados. Guarde as capturas desse mesmo
build junto às evidências do projeto.

## Referências

- [Imagem oficial do agente Jenkins](https://github.com/jenkinsci/docker-agents/blob/master/README_inbound-agent.md)
- [Rede no Docker Desktop](https://docs.docker.com/desktop/features/networking/)
- [Gerenciamento de plugins](https://www.jenkins.io/doc/book/managing/plugins/)
