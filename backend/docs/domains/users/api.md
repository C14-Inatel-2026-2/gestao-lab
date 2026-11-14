# API de usuários, autenticação e autorização

Esta documentação segue as [convenções de API](../../conventions/api.md) e as
[convenções de erros](../../conventions/errors.md). Cadastro e login são públicos; a
promoção exige token Bearer de administrador.

Cadastro e login não recebem parâmetros de caminho ou consulta. A promoção recebe
somente o parâmetro de caminho `id`. Requisições com corpo usam `Content-Type:
application/json`; as respostas com corpo são JSON. O login retorna `200`, pois
autentica uma conta existente, enquanto o cadastro cria um recurso e retorna `201`.

## Formato dos erros

Os erros usam `{ "message": "..." }`. Mensagens do domínio:

| Situação | Status | Mensagem |
| --- | --- | --- |
| Cadastro inválido (validação do DTO ou argumentos do serviço) | 400 | `Invalid registration data` |
| JSON malformado ou corpo ausente | 400 | `Malformed request` |
| Identificador não numérico ou fora do intervalo de Long | 400 | `Invalid user id` |
| Credenciais inválidas | 401 | `Invalid email or password` |
| Token ausente, inválido ou expirado | 401 | `Authentication required` |
| Perfil sem permissão | 403 | `Access denied` |
| Usuário inexistente | 404 | `User not found` |
| E-mail duplicado | 409 | `Email already registered` |
| Conflito de persistência | 409 | `Registration conflicts with existing data` |
| Falha inesperada | 500 | `Internal server error` |

O handler específico de usuários atende cadastro, login e promoção. Falhas
inesperadas são registradas no servidor; a resposta não expõe detalhes da exceção.
Erros HTTP de protocolo preservam seu status e headers e usam `Invalid request`.
Credenciais inválidas continuam retornando a mesma mensagem para e-mail inexistente
e senha incorreta. Erros dos demais domínios não são alterados por esse handler.

## POST /api/auth/register

Cria uma conta com perfil `PARTICIPANT`; o cliente não pode escolher `ADMIN`.

**Autorização:** pública.

### Corpo da requisição

```json
{
  "name": "Novo usuário",
  "email": "usuario@inatel.br",
  "password": "Senha123"
}
```

Nome e e-mail são obrigatórios e o e-mail precisa ser válido. A senha tem de conter de
8 a 72 caracteres, uma letra maiúscula e um dígito.

### Resposta de sucesso — 201

```json
{
  "userId": 1,
  "name": "Novo usuário",
  "email": "usuario@inatel.br",
  "role": "PARTICIPANT"
}
```

A resposta não contém senha ou hash e o cadastro não inicia sessão.

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | Dados ausentes, inválidos ou JSON malformado |
| 409 | E-mail já cadastrado ou conflito de persistência |

```bash
curl -i http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Novo usuário","email":"usuario@inatel.br","password":"Senha123"}'
```

## POST /api/auth/login

Autentica um usuário cadastrado e emite token opaco de sessão.

**Autorização:** pública.

### Corpo da requisição

```json
{
  "email": "usuario@inatel.br",
  "password": "Senha123"
}
```

### Resposta de sucesso — 200

```json
{
  "token": "token-recebido-no-login",
  "userId": 1,
  "name": "Novo usuário",
  "email": "usuario@inatel.br",
  "role": "PARTICIPANT"
}
```

### Erros previstos

| Status | Situação |
| ---: | --- |
| 400 | JSON malformado ou corpo ausente |
| 401 | E-mail inexistente, senha incorreta ou campos vazios |

```bash
curl -i http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario@inatel.br","password":"Senha123"}'
```

## PATCH /api/users/{id}/promote

Promove um participante a `ADMIN`. É idempotente: promover um administrador mantém o
perfil e retorna sucesso.

**Autorização:** `ADMIN`.

### Parâmetros de caminho

| Nome | Tipo | Descrição |
| --- | --- | --- |
| `id` | número inteiro | Identificador do usuário a promover |

Não há corpo de requisição.

### Resposta de sucesso — 200

```json
{
  "id": 2,
  "name": "Novo usuário",
  "email": "usuario@inatel.br",
  "role": "ADMIN"
}
```

### Erros previstos

| Status | Situação |
| ---: | --- |
| 401 | Token ausente, inválido ou expirado |
| 403 | Solicitante autenticado com perfil `PARTICIPANT` |
| 404 | Usuário de destino inexistente |
| 400 | `id` não numérico ou fora do intervalo de Long |

```bash
curl -i -X PATCH http://localhost:8080/api/users/2/promote \
  -H 'Authorization: Bearer <token-de-administrador>'
```

## Sessões e administrador inicial

Envie o token em `Authorization: Bearer <token>`. Sessões ficam em memória, expiram em
uma hora e podem ser configuradas com `app.auth.token-ttl` ou `APP_AUTH_TOKEN_TTL`.
Reiniciar o backend invalida sessões; o usuário promovido precisa entrar novamente para
receber suas novas permissões.

A conta administrativa inicial é opcional e usa as variáveis
`INITIAL_ADMIN_ENABLED`, `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL` e
`INITIAL_ADMIN_PASSWORD`. Não existe senha padrão. Após a criação, desative a opção e
remova as credenciais do ambiente.

## Verificação automatizada

```bash
cd backend
./mvnw test
```

`AuthHttpTest`, `UserServiceTest` e `AuthDatabaseTest` cobrem autenticação,
cadastro, promoção, perfis e persistência em SQLite descartável.
