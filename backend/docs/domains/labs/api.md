# API de laboratórios

Esta documentação segue as [convenções de API](../../conventions/api.md) e as
[convenções de erros](../../conventions/errors.md). O domínio atende ao RF03 e à
história SCRUM-18.

Todas as rotas exigem `Authorization: Bearer <token>`. Cadastro, edição e exclusão
são exclusivos de administradores. Consulte [usuários e autenticação](../users/api.md)
para obter o token e configurar o administrador inicial.

## POST /api/labs

Cadastra um laboratório e gera seu identificador.

**Autorização:** `ADMIN`.

### Corpo da requisição

Envie `Content-Type: application/json`:

```json
{
  "name": "Laboratório de Software"
}
```

`name` é obrigatório e não pode ser vazio ou conter apenas espaços.

### Resposta de sucesso — 201

```json
{
  "id": 1,
  "name": "Laboratório de Software"
}
```

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | Nome ausente, vazio ou composto apenas de espaços; corpo ausente ou JSON malformado |
| 401 | Token ausente, inválido ou expirado |
| 403 | Solicitante autenticado com perfil `PARTICIPANT` |

## GET /api/labs

Lista os laboratórios cadastrados. Não há filtros, ordenação ou paginação definidos
para este endpoint.

**Autorização:** qualquer usuário autenticado.

### Resposta de sucesso — 200

```json
[
  {
    "id": 1,
    "name": "Laboratório de Software"
  }
]
```

Retorna `[]` quando não há laboratórios.

### Erros previstos

| Status | Situação |
| ---: | --- |
| 401 | Token ausente, inválido ou expirado |

## GET /api/labs/{id}

Consulta um laboratório pelo identificador.

**Autorização:** qualquer usuário autenticado.

### Parâmetros de caminho

| Nome | Tipo | Descrição |
| --- | --- | --- |
| `id` | número inteiro (`Long`) | Identificador do laboratório |

### Resposta de sucesso — 200

```json
{
  "id": 1,
  "name": "Laboratório de Software"
}
```

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | `id` não numérico ou fora do intervalo de `Long` |
| 401 | Token ausente, inválido ou expirado |
| 404 | Laboratório inexistente |

## PUT /api/labs/{id}

Substitui os dados editáveis do laboratório, atualmente apenas o nome. O identificador
é preservado; um laboratório inexistente não é criado por esta operação.

**Autorização:** `ADMIN`.

### Parâmetros de caminho

| Nome | Tipo | Descrição |
| --- | --- | --- |
| `id` | número inteiro (`Long`) | Identificador do laboratório |

### Corpo da requisição

Envie `Content-Type: application/json`:

```json
{
  "name": "Laboratório de Redes"
}
```

`name` é obrigatório e não pode ser vazio ou conter apenas espaços.

### Resposta de sucesso — 200

```json
{
  "id": 1,
  "name": "Laboratório de Redes"
}
```

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | Nome inválido, `id` não numérico ou fora do intervalo de `Long`, corpo ausente ou JSON malformado |
| 401 | Token ausente, inválido ou expirado |
| 403 | Solicitante autenticado com perfil `PARTICIPANT` |
| 404 | Laboratório inexistente |

## DELETE /api/labs/{id}

Exclui um laboratório sem dispositivos nem empréstimos vinculados. Se houver algum
vínculo, a operação é recusada e os registros são preservados.

**Autorização:** `ADMIN`.

### Parâmetros de caminho

| Nome | Tipo | Descrição |
| --- | --- | --- |
| `id` | número inteiro (`Long`) | Identificador do laboratório |

### Resposta de sucesso — 204

Sem corpo de resposta.

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | `id` não numérico ou fora do intervalo de `Long` |
| 401 | Token ausente, inválido ou expirado |
| 403 | Solicitante autenticado com perfil `PARTICIPANT` |
| 404 | Laboratório inexistente |
| 409 | Laboratório com dispositivos ou empréstimos vinculados |

## Mensagens de erro

Conforme as [convenções de erros](../../conventions/errors.md), a resposta contém
somente uma mensagem segura para o cliente:

```json
{
  "message": "Laboratory name is required"
}
```

| Status | Mensagem |
| ---: | --- |
| 400 | `Laboratory name is required` |
| 400 | `Invalid value for parameter 'id'` |
| 400 | `Malformed request` |
| 401 | `Authentication required` |
| 403 | `Access denied` |
| 404 | `Laboratory not found` |
| 409 | `Laboratory has linked devices or loans` |

## Verificação automatizada

Na pasta `backend`, execute no PowerShell:

```powershell
.\mvnw.cmd "-Dtest=Laboratory*Test" clean test
```

No Linux, use `sh ./mvnw "-Dtest=Laboratory*Test" clean test`.

`LaboratoryServiceTest` verifica as regras do serviço com Mockito.
`LaboratoryHttpTest` verifica endpoints, permissões, contratos de erro e persistência
com SQLite em memória. Os perfis são simulados com `@WithMockUser`; cada teste HTTP
é revertido ao terminar. Os testes de laboratórios não utilizam o arquivo
`gestaolab.db` de desenvolvimento.
