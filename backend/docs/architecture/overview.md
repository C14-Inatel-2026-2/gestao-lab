# Visão de arquitetura

O Gestão de Laboratórios é um monorepo com backend Java 21/Spring Boot, frontend React
e banco SQLite. O código do backend é separado primeiramente por domínio de negócio e,
dentro de cada domínio, organizado em camadas.

## Organização do repositório

```text
gestao-lab/
├── backend/     # API Spring Boot e acesso ao SQLite
│   └── docs/    # contratos, convenções e guias operacionais
├── frontend/    # aplicação React
└── Jenkinsfile  # pipeline de integração contínua
```

## Separação por domínio

O backend agrupa o código relacionado ao mesmo conceito de negócio. Os domínios atuais
estão em `backend/src/main/java/br/inatel/`:

```text
br/inatel/
├── users/       # usuários, autenticação e autorização
├── devices/     # inventário e status dos dispositivos
├── labs/        # laboratórios
└── loans/       # solicitações e ciclo de empréstimos
```

Essa estrutura mantém próximas as regras, DTOs e persistência de cada área do sistema,
reduzindo o acoplamento entre domínios distintos.

## Arquitetura em camadas dentro de cada domínio

Os domínios seguem a mesma divisão quando a camada é necessária:

```text
<domínio>/
├── controller/  # rotas HTTP, entrada e saída da API
├── service/     # regras de negócio e coordenação das operações
├── repository/  # acesso a dados com Spring Data JPA
├── model/       # entidades e enumerações do domínio
├── dto/         # contratos de requisição e resposta HTTP
├── exception/   # exceções específicas do domínio, quando aplicável
└── config/      # configuração específica, quando aplicável
```

Nem todo domínio possui todas as pastas: elas existem somente quando há uma
responsabilidade correspondente. Por exemplo, as configurações de autenticação e
autorização pertencem a `users/config`.

## Fluxo de uma requisição

```text
Cliente HTTP
    → controller
    → service
    → repository
    → SQLite
```

O controller recebe a requisição, valida o DTO e traduz HTTP para uma chamada de
serviço. O service aplica regras de negócio e usa repositories para consultar ou
persistir entidades. O controller retorna um DTO de resposta, sem expor a entidade JPA.
Exceções são convertidas em respostas HTTP por `@RestControllerAdvice`.

## Fronteiras entre domínios

Um domínio pode depender de outro para executar uma regra de negócio. Por exemplo, um
empréstimo consulta usuário, laboratório e dispositivo antes de ser criado. Essa
colaboração ocorre pelos componentes já existentes, mantendo as regras principais no
domínio responsável pela operação.

As convenções de interface estão em [API](../conventions/api.md) e
[erros](../conventions/errors.md). Os contratos concretos ficam na documentação de
cada domínio.
