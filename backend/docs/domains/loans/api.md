# API de empréstimos

Esta documentação segue as [convenções de API](../../conventions/api.md) e as
[convenções de erros](../../conventions/errors.md). Todas as rotas exigem token Bearer;
aprovação, rejeição e devolução são exclusivas de administradores.

## Ciclo de vida

```text
REQUESTED ──approve──> APPROVED ──return──> RETURNED
    └──────reject────> REJECTED
```

| Status | Significado |
| --- | --- |
| `REQUESTED` | Solicitação registrada, aguardando decisão do administrador |
| `APPROVED` | Empréstimo aprovado; o dispositivo passa a `BORROWED` |
| `REJECTED` | Solicitação recusada; o dispositivo não é alterado |
| `RETURNED` | Devolução registrada; o empréstimo permanece como histórico |

Solicitações `REQUESTED` não reservam o dispositivo: apenas empréstimos `APPROVED`
bloqueiam um período. Dois períodos que apenas se tocam (um termina exatamente quando o
outro começa) não são considerados sobrepostos.

## POST /api/loans

Solicita o empréstimo de um dispositivo. O solicitante é sempre o usuário autenticado e
não faz parte do corpo.

**Autorização:** qualquer usuário autenticado.

### Corpo da requisição

```json
{
  "laboratoryId": 1,
  "deviceId": 7,
  "startDateTime": "2026-12-01T08:00:00",
  "endDateTime": "2026-12-01T10:00:00"
}
```

Todos os campos são obrigatórios. Datas e horários usam ISO-8601 sem fuso horário.
`endDateTime` precisa ser posterior a `startDateTime` e o dispositivo precisa pertencer
ao laboratório informado.

### Resposta de sucesso — 201

```json
{
  "id": 3,
  "userId": 2,
  "laboratoryId": 1,
  "deviceId": 7,
  "status": "REQUESTED",
  "startDateTime": "2026-12-01T08:00:00",
  "endDateTime": "2026-12-01T10:00:00"
}
```

Usuário, laboratório e dispositivo são expostos apenas por id.

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | Campo obrigatório ausente, término anterior ou igual ao início, dispositivo de outro laboratório ou JSON malformado |
| 401 | Token ausente, inválido ou expirado |
| 404 | Laboratório, dispositivo ou usuário autenticado inexistente |
| 409 | Dispositivo em manutenção ou já reservado por empréstimo aprovado no período |

```bash
curl -i http://localhost:8080/api/loans \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"laboratoryId":1,"deviceId":7,"startDateTime":"2026-12-01T08:00:00","endDateTime":"2026-12-01T10:00:00"}'
```

## GET /api/loans

Lista empréstimos. O perfil define o escopo: `ADMIN` recebe todos os empréstimos e
`PARTICIPANT` recebe apenas os próprios.

**Autorização:** qualquer usuário autenticado.

### Resposta de sucesso — 200

```json
[
  {
    "id": 3,
    "userId": 2,
    "laboratoryId": 1,
    "deviceId": 7,
    "status": "REQUESTED",
    "startDateTime": "2026-12-01T08:00:00",
    "endDateTime": "2026-12-01T10:00:00"
  }
]
```

Retorna `[]` quando não há empréstimos visíveis para o solicitante.

### Erros previstos

| Status | Situação |
| ---: | --- |
| 401 | Token ausente, inválido ou expirado |

```bash
curl -i http://localhost:8080/api/loans \
  -H 'Authorization: Bearer <token>'
```

## PATCH /api/loans/{id}/approve

Aprova uma solicitação `REQUESTED` e marca o dispositivo como `BORROWED`. A
disponibilidade é verificada novamente, pois o dispositivo pode ter entrado em
manutenção ou sido reservado depois da solicitação.

**Autorização:** `ADMIN`.

### Parâmetros de caminho

| Nome | Tipo | Descrição |
| --- | --- | --- |
| `id` | número inteiro | Identificador do empréstimo |

Não há corpo de requisição.

### Resposta de sucesso — 200

Retorna o empréstimo no formato de `POST /api/loans`, com `"status": "APPROVED"`.

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | `id` não numérico |
| 401 | Token ausente, inválido ou expirado |
| 403 | Solicitante autenticado com perfil `PARTICIPANT` |
| 404 | Empréstimo inexistente |
| 409 | Empréstimo fora do status `REQUESTED`, dispositivo em manutenção ou já reservado no período |

```bash
curl -i -X PATCH http://localhost:8080/api/loans/3/approve \
  -H 'Authorization: Bearer <token-de-administrador>'
```

## PATCH /api/loans/{id}/reject

Rejeita uma solicitação `REQUESTED`. O status do dispositivo não é alterado.

**Autorização:** `ADMIN`.

### Parâmetros de caminho

| Nome | Tipo | Descrição |
| --- | --- | --- |
| `id` | número inteiro | Identificador do empréstimo |

Não há corpo de requisição.

### Resposta de sucesso — 200

Retorna o empréstimo no formato de `POST /api/loans`, com `"status": "REJECTED"`.

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | `id` não numérico |
| 401 | Token ausente, inválido ou expirado |
| 403 | Solicitante autenticado com perfil `PARTICIPANT` |
| 404 | Empréstimo inexistente |
| 409 | Empréstimo fora do status `REQUESTED` |

```bash
curl -i -X PATCH http://localhost:8080/api/loans/3/reject \
  -H 'Authorization: Bearer <token-de-administrador>'
```

## PATCH /api/loans/{id}/return

Registra a devolução de um empréstimo `APPROVED`. O empréstimo é mantido como histórico
e o status do dispositivo é atualizado:

| Situação do dispositivo | Resultado |
| --- | --- |
| Em `MAINTENANCE` | Permanece em `MAINTENANCE` |
| Com outro empréstimo `APPROVED` | Permanece `BORROWED` |
| Sem outro empréstimo `APPROVED` | Passa a `AVAILABLE` |

**Autorização:** `ADMIN`.

### Parâmetros de caminho

| Nome | Tipo | Descrição |
| --- | --- | --- |
| `id` | número inteiro | Identificador do empréstimo |

Não há corpo de requisição.

### Resposta de sucesso — 200

Retorna o empréstimo no formato de `POST /api/loans`, com `"status": "RETURNED"`.

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | `id` não numérico |
| 401 | Token ausente, inválido ou expirado |
| 403 | Solicitante autenticado com perfil `PARTICIPANT` |
| 404 | Empréstimo inexistente |
| 409 | Empréstimo fora do status `APPROVED`, inclusive devolução já registrada |

```bash
curl -i -X PATCH http://localhost:8080/api/loans/3/return \
  -H 'Authorization: Bearer <token-de-administrador>'
```

## Verificação automatizada

```bash
cd backend
./mvnw "-Dtest=Loan*Test" test
```

`LoanServiceTest` cobre as regras de negócio com Mockito, `LoanHttpTest` cobre as rotas,
as permissões e os status de erro, e `LoanRepositoryTest` e `LoanReturnIntegrationTest`
cobrem a persistência e a devolução em SQLite em memória.
