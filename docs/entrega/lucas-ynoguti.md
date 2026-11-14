# Contribuição individual — Lucas Nolasco Ynoguti

## Atividades realizadas

Atuei nos módulos de usuários e autenticação, no banco de dados e na infraestrutura de integração contínua e deploy. Também defini DTOs, repositórios e APIs, escrevi parte das regras de negócio dos serviços e preparei documentos de arquitetura e convenções.

Realizei refactors para reutilizar a mensagem de credenciais inválidas em `UserService.validateCredentials` e para centralizar a regra de expiração de sessões em `Session.isExpiredAt(Instant)`.

## Aprendizado

Durante o desenvolvimento, percebi que alguns commits foram enviados com pressa e exigiram correções logo em seguida. Em projetos futuros, a revisão das mudanças antes do push e uma cadência de trabalho mais regular devem reduzir esse tipo de retrabalho e evitar a concentração de entregas perto dos prazos.

## Uso de inteligência artificial

A IA foi utilizada para gerar código, revisar PRs e auxiliar no planejamento do projeto. O modelo utilizado na maior parte do projeto foi o GPT-5.6 Low, por meio do Codex. Utilizei um agente para definir o comportamento do Codex, priorizando código simples, cobertura de testes e segurança.

Ao gerar código com IA, priorizei a compreensão do que seria feito antes de aplicá-lo, para que eu conseguisse manter o entendimento do código como um todo.

As decisões arquiteturais, a modelagem do domínio, do banco de dados e dos relacionamentos, a definição de requisitos e parte do desenvolvimento não foram realizadas por IA.

Também defini os DTOs, o repositório e as APIs e escrevi parte das regras de negócio dos serviços e os documentos de arquitetura e de convenções.

#### Exemplo 1 — Revisão de alteração de status dos dispositivos

Prompt utilizado com a skill `review-agent`:

Use [$review-agent](/home/lucas/.codex/skills/.system/review-agent/SKILL.md) to review the requested code changes and return actionable findings. [$review-agent](/home/lucas/.codex/skills/.system/review-agent/SKILL.md) 
Review the fix/devices-status-rules pr

[P1] Make the manual availability check atomic with loan approval — backend/src/main/java/br/inatel/devices/service/DeviceService.java:73

changeStatusManually checks hasApprovedLoans and saves the device in separate repository transactions. A concurrent loan approval can commit an APPROVED loan and set the device to BORROWED after this check but before this method’s save, after which the manual request overwrites the status to AVAILABLE. The resulting approved loan / available-device mismatch defeats the rule this PR introduces. Coordinate the check-and-update with loan approval using a transaction plus appropriate locking or conditional update semantics.

Overall: the PR is otherwise coherent; the targeted 58-test suite passes. It lacks a concurrent approval-versus-manual-status test, which is how this regression escapes the current coverage.

**Decisão: aceita e adaptada.** O apontamento foi tratado no commit
943c110, de Mauro, com uma atualização condicional no banco e a inclusão
de um teste de concorrência. A correção passou pelo processo de revisão
do grupo.

- PR: https://github.com/C14-Inatel-2026-2/gestao-lab/pull/38
- Correção: https://github.com/C14-Inatel-2026-2/gestao-lab/commit/943c110
