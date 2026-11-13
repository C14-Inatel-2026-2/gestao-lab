# Laboratórios

API de gerenciamento de laboratórios, relacionada ao RF03 e à história SCRUM-18.
Todas as rotas exigem `Authorization: Bearer <token>`.
Consulte [usuários e autenticação](users.md) para obter o token e configurar o administrador inicial.

## Endpoints

| Método | Rota | Acesso | Sucesso |
|---|---|---|---|
| GET | `/api/labs` | Usuário autenticado | 200, lista de laboratórios |
| GET | `/api/labs/{id}` | Usuário autenticado | 200, laboratório encontrado |
| POST | `/api/labs` | ADMIN | 201, laboratório criado |
| PUT | `/api/labs/{id}` | ADMIN | 200, laboratório atualizado |
| DELETE | `/api/labs/{id}` | ADMIN | 204, sem corpo |

## Cadastro e edição

Envie `Content-Type: application/json` e o corpo:

```json
{"name":"Laboratório de Software"}
```

O nome é obrigatório e não pode ser vazio ou conter apenas espaços.
O cadastro gera o ID; a edição preserva o ID existente.
Cadastro, consulta por ID e edição retornam um objeto neste formato:

```json
{"id":1,"name":"Laboratório de Software"}
```

A listagem retorna um array desses objetos, ou `[]` quando não há laboratórios.
A interface deve exibir a confirmação do cadastro e as mensagens de erro retornadas pela API.

## Exclusão e erros

A exclusão verifica os vínculos com dispositivos e empréstimos.
Se houver algum vínculo, retorna 409 e preserva os registros.
Um laboratório sem vínculos pode ser excluído pelo administrador.

| Status | Situação |
|---|---|
| 400 | Nome inválido ou corpo da requisição inválido |
| 401 | Token ausente, inválido ou expirado |
| 403 | Participante tentando cadastrar, editar ou excluir |
| 404 | ID inexistente na consulta, edição ou exclusão |
| 409 | Exclusão de laboratório com dispositivos ou empréstimos vinculados |

Os erros retornam JSON com o campo `message`.

## Testes

Na pasta `backend`, execute no PowerShell:

```powershell
.\mvnw.cmd "-Dtest=Laboratory*Test" clean test
```

No Linux, use `sh ./mvnw "-Dtest=Laboratory*Test" clean test`.

`LaboratoryServiceTest` verifica as regras do service com Mockito.
`LaboratoryHttpTest` verifica os endpoints, as permissões e a persistência com SQLite em memória.
Os perfis são simulados com `@WithMockUser`; cada teste HTTP é revertido ao terminar.
Os testes de laboratórios não utilizam o arquivo `gestaolab.db` de desenvolvimento.
