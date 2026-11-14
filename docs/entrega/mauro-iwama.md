# Contribuição individual — Mauro Iwama

## Atividades realizadas

Minha participação se concentrou nos módulos de empréstimos e de dispositivos.
Em empréstimos, trabalhei no domínio, na persistência e na API: solicitação,
aprovação, rejeição e devolução, com verificação de conflito de período. Em
dispositivos, trabalhei no cadastro vinculado ao laboratório, na listagem com
filtros e na alteração de status, incluindo a regra que impede o administrador
de liberar manualmente um dispositivo com empréstimo aprovado.

Padronizei os erros dos dois módulos conforme as convenções do backend (400 para
dado inválido, 404 para recurso inexistente e 409 para conflito de estado) e
escrevi a documentação dos endpoints.

Realizei dois refactors em empréstimos, sem mudança de comportamento. No
primeiro, a validação de campo obrigatório, repetida cinco vezes em
`LoanService.create`, foi extraída para o método privado `requirePresent`. No
segundo, a consulta de sobreposição de período em `LoanRepository`, que tinha um
nome de 74 caracteres e os parâmetros em ordem invertida (`end` antes de
`start`), foi renomeada para `existsOverlapping`, com `@Query` explícita e os
parâmetros na ordem natural.

Na parte de testes, trabalhei com testes unitários, HTTP, de repositório e um
teste de concorrência. No pipeline, adicionei o Jenkinsfile inicial com o
relatório de cobertura do JaCoCo. Também participei das revisões de alterações
de outros integrantes.

## Aprendizado

A padronização de erros me mostrou a diferença entre dado inválido e operação
incompatível com o estado atual, e por que a API precisa responder de forma
previsível. A revisão da PR #38 apontou uma condição de corrida no meu código:
verificar e depois salvar são duas operações, e outra requisição pode entrar no
meio. Aprendi a resolver isso com uma atualização condicional no banco e a
comprovar com um teste de concorrência.

Também aprendi a separar refatoração de correção: a refatoração preserva o
comportamento e é comprovada pelos testes existentes, enquanto a correção muda o
comportamento e precisa de uma regra que a justifique. Com Git e GitHub,
pratiquei uma mudança por branch, a resolução de conflitos de merge e a resposta
a comentários de revisão.

## Uso de inteligência artificial

### Modelos utilizados

- **Claude (Anthropic):** plano gratuito nas primeiras entregas e modelo
  Fable 5.2 na reta final.
- **ChatGPT (OpenAI):** plano gratuito.

### Para quê foram usados

- **Geração de código e testes (Claude):** módulos de empréstimos e de
  dispositivos, incluindo testes unitários, HTTP e de concorrência.
- **Refatoração (Claude):** extração de `requirePresent` em `LoanService` e
  renomeação da consulta de sobreposição em `LoanRepository`.
- **Revisão e debugging (Claude):** auditoria da `main`, leitura das pull
  requests dos colegas e correção de uma condição de corrida apontada na PR #38.
- **Documentação, CI e Git (Claude):** documentação da API, configuração do
  pipeline, commits e descrições de pull request.
- **Engenharia de prompt (ChatGPT):** estruturação dos prompts mais longos antes
  de enviá-los ao Claude.

### Exemplos de prompts e destino das respostas

1. **Auditoria do projeto — resposta aceita.**

   > "Quero que você realize uma análise técnica aprofundada do projeto C14
   > [...] A prioridade é preservar tudo aquilo que já está funcionando
   > corretamente [...] Não faça alterações diretamente no código durante essa
   > primeira análise."

   O prompt foi estruturado com ajuda do ChatGPT. O diagnóstico foi aceito como
   base de priorização e originou as PRs #38 e #40. Os demais pontos ficaram
   registrados, sem implementação.

2. **Regra de status dos dispositivos — resposta ajustada.**

   > "O ADMIN não pode marcar como available um dispositivo com empréstimo
   > ativo [...] Quero que você utilize backend/docs/conventions/api.md como
   > padrão para os endpoints e errors.md como padrão para os erros."

   Antes de gerar código, a ferramenta devolveu cinco decisões em aberto e o
   resultado seguiu as minhas respostas. A sugestão de alterar o `api.md` foi
   descartada, e a minha ideia inicial de um `DeviceDTO` único foi abandonada
   depois da explicação sobre o padrão `Request`/`Response` do projeto.

3. **Correção após revisão — código da IA corrigido.**

   > "A verificação de empréstimos aprovados e o salvamento do dispositivo são
   > operações separadas [...] torne a verificação e a atualização atômicas
   > [...] e adicione um teste de concorrência."

   A primeira versão gerada pela ferramenta tinha uma condição de corrida,
   encontrada na revisão da PR #38. A correção, no commit
   [943c110](https://github.com/C14-Inatel-2026-2/gestao-lab/commit/943c110),
   foi aceita depois de todos os testes passarem na minha máquina.

### Dinâmica de uso

O uso foi individual, no formato de pair programming: a ferramenta propõe, eu
decido entre as opções, executo os testes na minha máquina e faço os commits. A
ferramenta não fez commits nem abriu pull requests. Nas revisões, as pull
requests foram lidas com apoio de IA, mas a decisão de pedir mudanças ou aprovar
foi minha. Os testes foram gerados junto com o código e validados com
`./mvnw clean verify` antes de cada push.

### O que não foi feito por IA

- **Histórias de usuário:** as histórias e os critérios de aceite de empréstimos
  no Jira foram escritos à mão.
- **Regras de negócio e escopo:** decididas por mim e pelo grupo; quando a
  ferramenta propôs alternativas, a escolha foi nossa.
- **Instalação do Jenkins:** download e instalação feitos por conta própria. Na
  configuração houve consulta ao Claude e a vídeos.
- **Validação e integração:** execução dos testes, commits, abertura das pull
  requests, resolução de conflitos de merge e aprovação das revisões.

O código dos módulos de empréstimos e de dispositivos foi gerado com IA e
revisado por mim; não há trechos escritos inteiramente à mão nesses módulos.

## Evidências

| Trabalho | Referência |
| --- | --- |
| Domínio, persistência e API de empréstimos | PRs [#5](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/5), [#20](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/20), [#21](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/21) e [#24](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/24); SCRUM-14, SCRUM-15 e SCRUM-16 |
| Testes unitários de empréstimos | [PR #12](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/12) |
| API de dispositivos | [PR #28](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/28) e [SCRUM-25](https://solribeiro9147.atlassian.net/browse/SCRUM-25) |
| Empréstimo de dispositivos com aprovação e devolução | [PR #31](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/31) e [SCRUM-31](https://solribeiro9147.atlassian.net/browse/SCRUM-31) |
| Regra de status manual e erros de dispositivos | [PR #38](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/38) e [contrato da API](../../backend/docs/domains/devices/api.md) |
| Padronização de erros e documentação de empréstimos | [PR #40](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/40) e [contrato da API](../../backend/docs/domains/loans/api.md) |
| Refactor da validação de campos obrigatórios | [PR #41](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/41) |
| Refactor da consulta de sobreposição | [PR #44](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/44) |

## Situação em 14/11/2026

As PRs #38, #40, #41 e #44 foram integradas à `main`. Não há alterações minhas
aguardando revisão.
