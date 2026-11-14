# Contribuição individual — Lucas Nolasco Ynoguti

## Atividades realizadas

Atuei nos módulos de usuários e autenticação, no banco de dados e na infraestrutura de integração contínua e deploy. Também defini DTOs, repositórios e APIs, escrevi parte das regras de negócio dos serviços e preparei documentos de arquitetura e convenções.

Realizei refactors para reutilizar a mensagem de credenciais inválidas em `UserService.validateCredentials` e para centralizar a regra de expiração de sessões em `Session.isExpiredAt(Instant)`.

## Aprendizado

Durante o desenvolvimento, percebi que alguns commits foram enviados com pressa e exigiram correções logo em seguida. Em projetos futuros, a revisão das mudanças antes do push e uma cadência de trabalho mais regular devem reduzir esse tipo de retrabalho e evitar a concentração de entregas perto dos prazos.

## Uso de inteligência artificial

Utilizei IA para gerar código, revisar pull requests e auxiliar no planejamento do projeto, priorizando código simples, cobertura de testes e segurança. Antes de aplicar sugestões, procurei compreender a mudança para manter o entendimento do código como um todo.

As decisões arquiteturais, a modelagem do domínio, do banco de dados e dos relacionamentos, a definição de requisitos e parte do desenvolvimento não foram realizadas por IA.

### Exemplo — revisão de alteração de status dos dispositivos

Uma revisão identificou que a verificação de disponibilidade manual e a aprovação de empréstimos podiam ocorrer concorrentemente, resultando em um empréstimo aprovado para um dispositivo marcado como disponível. A sugestão foi aceita e adaptada no commit [943c110](https://github.com/C14-Inatel-2026-2/gestao-lab/commit/943c110), com atualização condicional no banco e teste de concorrência.

- PR: [#38](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/38)
- Correção: [943c110](https://github.com/C14-Inatel-2026-2/gestao-lab/commit/943c110)
