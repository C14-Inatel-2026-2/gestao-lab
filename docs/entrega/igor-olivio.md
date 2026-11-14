# Contribuição individual — Igor Nogueira Olivio

## Atividades realizadas

Minha participação se concentrou no módulo de laboratórios e na configuração do
ambiente de integração contínua. Trabalhei na consulta, no cadastro, na edição e
na exclusão de laboratórios, incluindo as permissões de administrador e a
verificação de vínculos antes da exclusão. Também ajustei as mensagens de erro ao
padrão do backend e organizei a documentação dos endpoints.

Na parte de testes, trabalhei com testes unitários e HTTP para conferir os fluxos
de laboratórios, as validações e as permissões. Configurei a exigência de cobertura
mínima de 80% no backend e registrei evidências de testes, build e cobertura no
Jenkins. Também participei das revisões de alterações de outros integrantes.

Para preparar o ambiente do frontend, adicionei Node.js e npm à imagem do agente
Jenkins, conferi as ferramentas e a conexão com o controlador e documentei a
configuração. Os plugins Coverage e HTML Publisher foram instalados no
controlador para permitir a publicação dos relatórios.

## Aprendizado

O trabalho com laboratórios me ajudou a relacionar as responsabilidades de
controller, service e repository e a entender por que as regras de negócio e os
erros precisam manter um padrão. Os testes também mostraram a importância de
verificar situações inválidas, permissões e vínculos entre registros, além do
fluxo em que tudo funciona.

Com Git e GitHub, pratiquei a separação das mudanças em branches, commits e pull
requests e a revisão antes da integração. No Jenkins e no Docker, aprendi a
diferença entre o controlador e o agente: uma ferramenta instalada no controlador
não fica automaticamente disponível no agente que executa o build. Também
aprendi a relacionar cada evidência ao commit e à execução que gerou o resultado.

## Uso de inteligência artificial

Utilizei o ChatGPT como apoio para entender mensagens de erro, analisar código e
documentação, propor ajustes de implementação e testes e preparar comandos de
Git, Maven e Docker. A ferramenta também auxiliou na revisão das pull requests e
na organização dos registros de validação.

O uso incluiu sugestões de código e de testes. As alterações foram verificadas
por leitura dos diffs, execução de testes e revisão das pull requests. Os
resultados registrados correspondem às execuções realizadas; preparar o ambiente
ou obter uma sugestão da ferramenta não comprova que o pipeline completo ou o
deploy tenham sido concluídos.

## Evidências

| Trabalho | Referência |
| --- | --- |
| Cadastro e gerenciamento de laboratórios | [SCRUM-18](https://solribeiro9147.atlassian.net/browse/SCRUM-18) e [contrato da API](../../backend/docs/domains/labs/api.md) |
| Cobertura mínima de 80% no backend | [PR #34](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/34) |
| Padronização de erros, testes e documentação de laboratórios | [PR #42](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/42) |
| Validação anterior do pipeline de backend | [Registro do build e dos resultados](../../backend/docs/operations/ci/jenkins-validacao-igor.md) |
| Agente Jenkins com Node e npm e sua documentação | [PR #43](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/43) e [SCRUM-49](https://solribeiro9147.atlassian.net/browse/SCRUM-49) |
| Validação integrada ainda pendente | [SCRUM-50](https://solribeiro9147.atlassian.net/browse/SCRUM-50) |

## Situação em 14/11/2026

A padronização de laboratórios foi integrada à `main` pela PR #42. A imagem e a
documentação do agente estão na PR #43, aguardando revisão e integração. A
validação completa do pipeline de frontend e backend, a publicação dos relatórios
da execução final e a conferência do deploy continuam pendentes na SCRUM-50.
