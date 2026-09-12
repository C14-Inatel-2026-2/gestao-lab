# Gestão de Laboratórios

Sistema web para controle centralizado de laboratórios acadêmicos: inventário de dispositivos, empréstimos/devoluções, projetos vinculados e relatórios.

Projeto acadêmico - Engenharia de Software (C14)

## Status

🚧 Em desenvolvimento

## Autores
- Giovana Franciele Gonçalves Leite (@GiovanaFrancieleGLeite)
- Igor Nogueira Olivio (@IgorNogueiraOlivio)
- Lucas Nolasco Ynoguti (@LucasYnoguti)
- Mauro Iwama (@Miwamma)
- Solange Ribeiro da Fonseca (@SolangeRibeiro)

##  Funcionalidades
- Controle de Acesso: perfis de Administrador (gerencia laboratório, cadastra itens e aprova ações) e Participante (solicita empréstimos)
- Gestão de Projetos: criação de projetos e vinculação de dispositivos e participantes
- Inventário de Dispositivos: cadastro de equipamentos por laboratório e controle de status (Disponível, Emprestado, Em Manutenção)
- Empréstimos e Devoluções: solicitação de item atrelada a um projeto, validação de disponibilidade e registro de devolução, impedindo alocações conflitantes
- Relatórios: histórico de movimentações, itens em atraso e alocações ativas por projeto

## Tecnologias

- **Frontend**: React
- **Backend**: Java 21 + Spring Boot (Maven)
- **Banco**: PostgreSQL
- **Testes**: JUnit + Mockito (backend), Jest + RTL (frontend)

## Estrutura do Repositório

Monorepo: backend, frontend, scripts de banco e CI/CD juntos.

```
gestao-lab/
├── backend/
├── frontend/
├── db/
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

## Como Executar (ainda em desenvolvimento, testes funcionam)

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```