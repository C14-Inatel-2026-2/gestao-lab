# Convenções de API

Estas regras definem contratos HTTP para as APIs REST do Gestão de Laboratórios.
Cada documentação de domínio deve seguir esta convenção e registrar apenas rotas que
existem no backend.

## Endereçamento e recursos

- Toda rota começa com `/api`.
- Recursos usam substantivos no plural e letras minúsculas: `/api/users`,
  `/api/devices` e `/api/loans`.
- A rota identifica o recurso; ações excepcionais usam um sufixo explícito, como
  `PATCH /api/users/{id}/promote`.
- Identificadores fazem parte do caminho: `/api/devices/{id}`.
- Filtros, ordenação e paginação usam parâmetros de consulta, por exemplo
  `GET /api/devices?laboratoryId=1&status=AVAILABLE`.

## Métodos e respostas de sucesso

| Operação | Método | Status esperado |
| --- | --- | ---: |
| Criar recurso | `POST` | 201 |
| Consultar recurso ou coleção | `GET` | 200 |
| Alterar parcialmente um recurso | `PATCH` | 200 |
| Substituir integralmente um recurso | `PUT` | 200 |
| Remover recurso | `DELETE` | 204 |

O corpo de criação e alteração é JSON. Respostas retornam DTOs, nunca entidades JPA,
senhas, hashes, tokens internos ou detalhes de persistência. Datas e horários usam
ISO-8601. Campos de enumeração usam os valores definidos pela API, como `ADMIN`,
`PARTICIPANT`, `AVAILABLE`, `BORROWED` e `IN_MAINTENANCE`.

## Documentação de cada endpoint

Cada endpoint deve apresentar, nesta ordem:

1. método e caminho;
2. finalidade e autorização necessária;
3. parâmetros de caminho ou consulta;
4. corpo de requisição, quando existir;
5. resposta de sucesso, com status e exemplo;
6. erros previstos, referenciando as [convenções de erros](errors.md).

Use exemplos `curl` somente com valores fictícios. Segredos, senhas reais, tokens e
URLs privadas não devem ser incluídos na documentação.

## Autenticação e autorização

Rotas protegidas recebem `Authorization: Bearer <token>`. A documentação da rota deve
indicar se ela é pública ou quais perfis podem executá-la. A ausência, invalidez ou
expiração do token resulta em `401`; um usuário autenticado sem a permissão necessária
recebe `403`.
