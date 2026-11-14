# API de dispositivos

Esta documentação segue as [convenções de API](../../conventions/api.md) e as
[convenções de erros](../../conventions/errors.md). Todas as rotas exigem token Bearer;
cadastro e alteração de status são exclusivos de administradores.

Um dispositivo pertence a um laboratório e tem um dos status `AVAILABLE`, `BORROWED` ou
`MAINTENANCE`. Todo dispositivo é criado como `AVAILABLE`.

## POST /api/devices

Cadastra um dispositivo no inventário de um laboratório.

**Autorização:** `ADMIN`.

### Corpo da requisição

```json
{
  "name": "Osciloscópio",
  "description": "Osciloscópio digital de 100 MHz",
  "laboratoryId": 1
}
```

`name` e `laboratoryId` são obrigatórios; `name` não pode ser vazio ou conter apenas
espaços. `description` é opcional.

### Resposta de sucesso — 201

```json
{
  "id": 7,
  "name": "Osciloscópio",
  "description": "Osciloscópio digital de 100 MHz",
  "status": "AVAILABLE",
  "laboratoryId": 1,
  "laboratoryName": "Laboratório de IoT"
}
```

O laboratório é exposto apenas por id e nome, nunca como entidade aninhada.

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | Nome vazio, `laboratoryId` ausente ou JSON malformado |
| 401 | Token ausente, inválido ou expirado |
| 403 | Solicitante autenticado com perfil `PARTICIPANT` |
| 404 | Laboratório inexistente |

```bash
curl -i http://localhost:8080/api/devices \
  -H 'Authorization: Bearer <token-de-administrador>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Osciloscópio","description":"Osciloscópio digital de 100 MHz","laboratoryId":1}'
```

## GET /api/devices

Lista os dispositivos. Os filtros são opcionais e podem ser combinados.

**Autorização:** qualquer usuário autenticado.

### Parâmetros de consulta

| Nome | Tipo | Descrição |
| --- | --- | --- |
| `laboratoryId` | número inteiro | Retorna apenas os dispositivos do laboratório |
| `status` | `AVAILABLE`, `BORROWED` ou `MAINTENANCE` | Retorna apenas os dispositivos nesse status |

### Resposta de sucesso — 200

```json
[
  {
    "id": 7,
    "name": "Osciloscópio",
    "description": "Osciloscópio digital de 100 MHz",
    "status": "AVAILABLE",
    "laboratoryId": 1,
    "laboratoryName": "Laboratório de IoT"
  }
]
```

Retorna `[]` quando nenhum dispositivo atende aos filtros.

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | Valor de `laboratoryId` ou `status` inválido |
| 401 | Token ausente, inválido ou expirado |

```bash
curl -i 'http://localhost:8080/api/devices?laboratoryId=1&status=AVAILABLE' \
  -H 'Authorization: Bearer <token>'
```

## PATCH /api/devices/{id}/status

Altera manualmente o status de um dispositivo.

**Autorização:** `ADMIN`.

### Parâmetros de caminho

| Nome | Tipo | Descrição |
| --- | --- | --- |
| `id` | número inteiro | Identificador do dispositivo |

### Corpo da requisição

```json
{
  "status": "MAINTENANCE"
}
```

`status` é obrigatório e aceita apenas o nome do valor; números são recusados.

### Regras da alteração manual

O status precisa permanecer coerente com os empréstimos do dispositivo:

| Status solicitado | Regra |
| --- | --- |
| `MAINTENANCE` | Sempre aceito |
| `AVAILABLE` | Recusado enquanto o dispositivo tiver empréstimo aprovado e não devolvido |
| `BORROWED` | Sempre recusado: o dispositivo só passa a `BORROWED` pela aprovação de um empréstimo |

Um dispositivo em manutenção com empréstimo aprovado só pode voltar a `AVAILABLE`
depois que a devolução for registrada em `PATCH /api/loans/{id}/return`.

### Resposta de sucesso — 200

```json
{
  "id": 7,
  "name": "Osciloscópio",
  "description": "Osciloscópio digital de 100 MHz",
  "status": "MAINTENANCE",
  "laboratoryId": 1,
  "laboratoryName": "Laboratório de IoT"
}
```

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | `status` ausente ou desconhecido, `id` não numérico ou JSON malformado |
| 401 | Token ausente, inválido ou expirado |
| 403 | Solicitante autenticado com perfil `PARTICIPANT` |
| 404 | Dispositivo inexistente |
| 409 | `BORROWED` solicitado manualmente, ou `AVAILABLE` com empréstimo aprovado |

```bash
curl -i -X PATCH http://localhost:8080/api/devices/7/status \
  -H 'Authorization: Bearer <token-de-administrador>' \
  -H 'Content-Type: application/json' \
  -d '{"status":"MAINTENANCE"}'
```

## Verificação automatizada

```bash
cd backend
./mvnw "-Dtest=Device*Test" test
```

`DeviceServiceTest` cobre as regras de negócio com Mockito, `DeviceHttpTest` cobre as
rotas, as permissões e os status de erro, e `DeviceRepositoryTest` cobre a persistência
e a consulta de empréstimos aprovados em SQLite em memória.
