# Gestão de Laboratórios

Sistema web para controle centralizado de laboratórios acadêmicos. Cada laboratório possui administradores e participantes vinculados e seu próprio inventário de dispositivos. O sistema gerencia o cadastro de equipamentos e o fluxo de solicitação e devolução de empréstimos, garantindo rastreabilidade e impedindo alocações conflitantes.

Projeto acadêmico - Engenharia de Software (C14)

## Índice

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do repositório](#estrutura-do-repositório) e [backend](#estrutura-do-backend)
- [Como executar](#como-executar)
- [Requisitos funcionais](#requisitos-funcionais) e [não funcionais](#requisitos-não-funcionais)
- [Metodologia](#metodologia-ágil-e-gerenciamento-do-projeto)
- [Refactors](#refactors)
- [Documentação do backend](backend/docs/README.md)
- [User stories](#user-stories)
- [Dinâmica de desenvolvimento](#dinâmica-de-desenvolvimento)
- [Contribuições individuais](#contribuições-individuais)

## Autores

- Giovana Franciele Gonçalves Leite (@GiovanaFrancieleGLeite)
- Igor Nogueira Olivio (@IgorNogueiraOlivio)
- Lucas Nolasco Ynoguti (@LucasYnoguti)
- Mauro Iwama (@Miwamma)
- Solange Ribeiro da Fonseca (@SolangeRibeiro)

## Funcionalidades

- Controle de acesso: perfis de Administrador e Participante, com permissões distintas.
- Gestão de laboratórios: administradores, participantes e inventário próprios para cada laboratório.
- Gestão de projetos: criação de projetos vinculados a laboratórios e associação de participantes e dispositivos.
- Inventário de dispositivos: cadastro de equipamentos por laboratório e controle dos status `AVAILABLE`, `BORROWED` e `MAINTENANCE`.
- Empréstimos e devoluções: solicitação de dispositivo vinculada a um projeto, validação de disponibilidade, aprovação ou rejeição pelo administrador e registro de devolução.
- Rastreabilidade e relatórios: histórico de movimentações, itens em atraso e alocações ativas por projeto.

## Tecnologias

- **Frontend**: React
- **Backend**: Java 21 + Spring Boot (Maven)
- **Banco**: SQLite
- **Testes**: JUnit + Mockito (backend), Jest + RTL (frontend)

## Estrutura do Repositório

Monorepo: backend, frontend, scripts de banco e CI/CD juntos. Consulte o [índice da documentação](backend/docs/README.md) para convenções de API e erros.

```
gestao-lab/
├── backend/
├── frontend/
├── docs/
└── README.md
```

## Estrutura do Backend

Arquitetura em camadas, organizada por domínio:

```
backend/src/main/java/br/inatel/
├── BackendApplication.java
├── users/     # Usuários & Acesso
├── labs/      # Laboratórios & Projetos
├── devices/   # Dispositivos
└── loans/     # Empréstimos & Relatórios
```

Cada domínio contém `controller/`, `service/`, `repository/`, `model/` e `dto/`.

## Como Executar

Requisito: **JDK 21**. O Maven é executado pelo wrapper incluído no projeto.

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

No Windows, utilize `mvnw.cmd` no lugar de `./mvnw`. A API inicia em `http://localhost:8080`. Para configurar o primeiro administrador, consulte [Sessões e administrador inicial](backend/docs/domains/users/api.md#sessões-e-administrador-inicial).

## 🚀 Integração Contínua (CI / Jenkins)

O projeto conta com uma pipeline automatizada no **Jenkins** configurada via `Jenkinsfile` para garantir a qualidade do código a cada alteração.

### 🔄 Fluxo da Pipeline

1. **Checkout**: obtém o código do repositório Git.
2. **Test**: executa `mvnw clean test` no backend e publica os resultados JUnit e JaCoCo.
3. **Build**: executa `mvnw verify -DskipTests`, gera o JAR e verifica a cobertura mínima de 80%.
4. **Disparar deploy no Render**: solicita o deploy do commit validado pelo Deploy Hook.

Nas ações finais, o Jenkins arquiva o relatório JaCoCo e, em caso de sucesso, o JAR gerado.

### 📷 Evidências de Execução

| Pipeline Jenkins | Resultado dos testes |
| :---: | :---: |
| [![Pipeline](backend/docs/assets/ci/jenkins-pipeline.jpeg)](backend/docs/assets/ci/jenkins-pipeline.jpeg) | [![Testes](backend/docs/assets/ci/jenkins-tests.jpeg)](backend/docs/assets/ci/jenkins-tests.jpeg) |

| Relatório JaCoCo | Build remota — Render |
| :---: | :---: |
| [![JaCoCo](backend/docs/assets/ci/jacoco-coverage.jpeg)](backend/docs/assets/ci/jacoco-coverage.jpeg) | [![Render](backend/docs/assets/ci/build-remota.jpeg)](backend/docs/assets/ci/build-remota.jpeg) |

## Requisitos Funcionais

| ID | Requisito |
|---|---|
| RF01 | O sistema deve permitir a autenticação de usuários. |
| RF02 | O sistema deve oferecer os perfis de Administrador e Participante, com permissões distintas. |
| RF03 | O sistema deve permitir o gerenciamento de laboratórios. |
| ~~RF04~~ | ~~O sistema deve permitir a criação de projetos vinculados a laboratórios.~~ |
| ~~RF05~~ | ~~O sistema deve permitir a associação de participantes a projetos.~~ |
| RF06 | O sistema deve permitir o cadastro de dispositivos por laboratório. |
| RF07 | O sistema deve controlar os status dos dispositivos: `AVAILABLE`, `BORROWED` e `MAINTENANCE`. |
| ~~RF08~~ | ~~O sistema deve permitir a solicitação de empréstimos de dispositivos vinculados a projetos.~~ |
| RF09 | O sistema deve verificar a disponibilidade dos dispositivos antes de permitir um empréstimo. |
| RF10 | O sistema deve permitir a aprovação ou rejeição de solicitações pelo administrador. |
| RF11 | O sistema deve permitir o registro de devoluções de dispositivos. |
| RF12 | O sistema deve manter o histórico de movimentações dos dispositivos. |
| RF13 | O sistema deve disponibilizar relatórios de movimentações, itens em atraso e alocações ativas por projeto. |

Os requisitos RF04, RF05 e RF08 foram retirados do escopo.

## Requisitos Não Funcionais

| ID | Requisito |
|---|---|
| RNF01 | A aplicação deve possuir uma interface web desenvolvida em React. |
| RNF02 | O backend deve ser desenvolvido em Java 21 com Spring Boot. |
| RNF03 | Os dados da aplicação devem ser armazenados em SQLite. |
| RNF04 | O sistema deve restringir o acesso às funcionalidades conforme as permissões dos usuários. |
| RNF05 | O sistema deve preservar a integridade dos dados nas operações de empréstimo e devolução, evitando alocações conflitantes. |
| RNF06 | O backend deve possuir testes automatizados com JUnit e Mockito. |
| RNF07 | O frontend deve possuir testes automatizados com Jest e React Testing Library. |
| RNF08 | O código-fonte deve ser mantido em um repositório Git compartilhado, organizado como monorepo. |

## Metodologia Ágil e Gerenciamento do Projeto

Adotamos práticas ágeis inspiradas no Scrum, adaptadas aos horários distintos dos integrantes. O Jira centralizou histórias de usuário, subtarefas, correções e refatorações, mantendo o trabalho visível para todos.

Não houve papéis fixos de PO, Scrum Master ou QA. Priorização e revisão foram compartilhadas, com as responsabilidades divididas entre os módulos de usuários, laboratórios, dispositivos, empréstimos, testes, frontend e infraestrutura.

Foi realizada uma única sprint, com cinco histórias de usuário e quatro tarefas técnicas. O alinhamento ocorreu principalmente pelo Jira, por mensagens e pelos pull requests no GitHub, com poucas reuniões formais.

Não formalizamos DoR e DoD. Na prática, as histórias eram divididas em subtarefas, e a integração na `main` exigia revisão, devido à proteção da branch. O Jenkins apoiava a validação com testes, build e relatórios de cobertura.

Os nove itens representam o escopo registrado da sprint, sem afirmar uma taxa de conclusão. As evidências estão nos itens do Jira vinculados na seção [User stories](#user-stories), nos pull requests e nos relatórios do Jenkins. Não acompanhamos formalmente lead time ou burndown.

## Refactors

| Causa | O que foi feito | Autor |
|---|---|---|

## Documentação da API

- [Índice completo: APIs, convenções, arquitetura e CI/deploy](backend/docs/README.md)
- [Usuários e autenticação](backend/docs/domains/users/api.md)
- [Devices](backend/docs/domains/devices/api.md)
- [Loans](backend/docs/domains/loans/api.md)
- [Labs](backend/docs/domains/labs/api.md)

## User stories

Consulte os itens do Jira para a descrição das histórias, critérios de aceite, prioridade e status. A tabela relaciona as histórias às entregas de backend integradas à `main` e a testes automatizados representativos.

| História no Jira | PRs de implementação e ajustes | Testes automatizados |
|---|---|---|
| [SCRUM-31 — Empréstimos de dispositivos](https://solribeiro9147.atlassian.net/browse/SCRUM-31) | [#31](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/31), [#38](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/38), [#40](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/40) | [LoanServiceTest](backend/src/test/java/br/inatel/loans/LoanServiceTest.java), [LoanHttpTest](backend/src/test/java/br/inatel/loans/controller/LoanHttpTest.java) |
| [SCRUM-19 — Promoção de administradores](https://solribeiro9147.atlassian.net/browse/SCRUM-19) | [#27](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/27) | [AuthDatabaseTest](backend/src/test/java/br/inatel/users/controller/AuthDatabaseTest.java), [InitialAdminDatabaseTest](backend/src/test/java/br/inatel/users/InitialAdminDatabaseTest.java) |
| [SCRUM-18 — Cadastro de laboratórios](https://solribeiro9147.atlassian.net/browse/SCRUM-18) | [#32](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/32) | [LaboratoryServiceTest](backend/src/test/java/br/inatel/labs/LaboratoryServiceTest.java), [LaboratoryHttpTest](backend/src/test/java/br/inatel/labs/controller/LaboratoryHttpTest.java) |
| [SCRUM-6 — Login e acesso por perfil](https://solribeiro9147.atlassian.net/browse/SCRUM-6) | [#19](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/19), [#22](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/22) | [AuthHttpTest](backend/src/test/java/br/inatel/users/controller/AuthHttpTest.java), [AuthDatabaseTest](backend/src/test/java/br/inatel/users/controller/AuthDatabaseTest.java) |
| [SCRUM-25 — Gerenciamento de dispositivos](https://solribeiro9147.atlassian.net/browse/SCRUM-25) | [#26](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/26), [#28](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/28), [#38](https://github.com/C14-Inatel-2026-2/gestao-lab/pull/38) | [DeviceHttpTest](backend/src/test/java/br/inatel/devices/controller/DeviceHttpTest.java), [DeviceStatusConcurrencyTest](backend/src/test/java/br/inatel/devices/DeviceStatusConcurrencyTest.java) |

## Dinâmica de desenvolvimento

### Divisão de tarefas e como decisões técnicas foram tomadas

Desde o início, o desenvolvimento no backend foi separado em domínios. Isso se mostrou uma decisão positiva, já que não houve muitos conflitos durante o desenvolvimento e cada um tinha suas tarefas claras. As decisões técnicas foram tomadas por meio de debates no grupo do WhatsApp, levando em conta a satisfação dos requisitos do projeto.

### Conflitos, bloqueios e como o grupo se reorganizou

Houve poucos conflitos de código devido à separação do backend por domínios. O principal desafio foi a integração entre frontend e backend: a interface avançou antes da consolidação das APIs, exigindo adaptações posteriores nos contratos e fluxos. Algumas entregas do frontend concentraram um volume maior de alterações, o que tornou a revisão e a integração mais trabalhosas. O grupo precisou retomar o alinhamento entre as duas partes e ajustar as chamadas às APIs disponíveis.

### Fluxo de branches, commits e code review

As alterações eram desenvolvidas em branches por funcionalidade ou correção e integradas à `main` por pull requests com revisão obrigatória. Adotamos Conventional Commits, embora sem aplicação uniforme. As revisões verificavam regras de negócio, testes e compatibilidade com os demais módulos.

## Contribuições individuais

- [Igor Nogueira Olivio — atividades, aprendizado e uso de IA](docs/entrega/igor-olivio.md)
- [Lucas Nolasco Ynoguti — atividades, aprendizado e uso de IA](docs/entrega/lucas-ynoguti.md)
- [Mauro Iwama — atividades, aprendizado e uso de IA](docs/entrega/mauro-iwama.md)
