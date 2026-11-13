# Validação local do job Jenkins

Responsável: Igor Nogueira Olivio (@Greed2003).

Registro da execução do pipeline de backend do [PR #13](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/13) no Jenkins local.

## Execução validada

| Campo | Valor |
| --- | --- |
| Job | `gestao-lab-backend` |
| Build | `#1` |
| Início | 17/10/2026, às 23:26:16 (UTC-3) |
| Duração | 29 segundos |
| Resultado | `SUCCESS` |
| Branch testada | `feature/pipeline-flow` |
| Commit testado | `ea9ac3784fd5d4087bbcc392365148e7a3c860f5` |

## Ambiente e configuração

- Windows, Java 21 e Jenkins 2.580.1.
- Maven executado pelo wrapper do projeto (`mvnw.cmd`).
- Jenkins acessado em `http://localhost:8081/`.
- Tipo do job: `Pipeline`.
- Definição: `Pipeline script from SCM`.
- SCM: Git.
- Repositório: `https://github.com/C14-Inatel-2026-2/gestao-lab.git`.
- Credenciais do SCM: nenhuma, pois o repositório é público.
- Branch specifier: `*/feature/pipeline-flow`.
- Script path: `Jenkinsfile`.

A configuração acima corresponde à branch validada. O endereço local do Jenkins funciona no computador em que o job foi executado.

## Etapas executadas

1. `Checkout`: obtenção do código pelo Git.
2. `Test`: execução de `mvnw.cmd test` na pasta `backend`.
3. `Build`: execução de `mvnw.cmd package -DskipTests` na pasta `backend`.

Os testes foram executados na etapa `Test`. A opção `-DskipTests` evitou sua repetição na etapa `Build`.

## Resultados

- 34 testes executados, sem falhas, erros ou testes ignorados.
- Resultados JUnit publicados no Jenkins.
- Relatório JaCoCo 0.8.12 gerado, arquivado e aberto para conferência.
- Arquivo `backend/target/backend-1.0-SNAPSHOT.jar` gerado e arquivado (48,64 MiB).
- Relatório de cobertura disponível nos artefatos em `backend/target/site/jacoco/index.html`.

| Métrica de cobertura geral | Resultado |
| --- | --- |
| Instruções | 87% exibidos no JaCoCo |
| Desvios | 86% exibidos no JaCoCo |
| Linhas | 77 de 91 cobertas (84,6%) |

No pacote `br.inatel.labs.service`, a cobertura de instruções e desvios foi de 100%. No pacote `br.inatel.labs.model`, a cobertura de instruções foi de 80%.

## Como repetir a validação

1. Iniciar o Jenkins local e abrir o job com a configuração registrada acima.
2. Executar o job e conferir o commit obtido no checkout. A branch pode receber novos commits; os resultados deste registro correspondem ao commit informado na tabela.
3. Conferir o resultado final e o relatório de testes da execução.
4. Abrir os artefatos e verificar o JAR e o relatório `site/jacoco/index.html`.

Esta entrega registra a validação de testes, build e cobertura do backend. O pipeline avaliado não contém uma etapa de deploy da aplicação.
