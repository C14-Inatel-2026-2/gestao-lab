# Usuários, autenticação e autorização

O backend recebe `POST /api/auth/login` com JSON contendo `email` e `password`.
Busca o usuário no banco por e-mail e compara a senha com BCrypt. O cadastro via
`UserService.create` armazena o hash, nunca a senha original. Usuários legados com
senha em texto puro precisam ter suas senhas redefinidas antes de usar esse login.

## Cadastro

`POST /api/auth/register` é público e cria sempre um `PARTICIPANT`.
O cliente não pode escolher o perfil de administrador.

```bash
curl -i http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Novo usuário","email":"usuario@inatel.br","password":"Senha123"}'
```

Sucesso: HTTP 201 com `userId`, `name`, `email` e `role`, sem senha ou hash.
Depois, use o e-mail e a senha no login abaixo para obter o token.
Nome e e-mail são obrigatórios; o e-mail deve ter formato válido. A senha deve ter
pelo menos oito caracteres, uma letra maiúscula e um dígito (máximo de 72 caracteres).
Dados inválidos retornam 400; e-mail já cadastrado retorna 409.
O cadastro não faz login automaticamente.

## Contrato

```bash
curl -i http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario@inatel.br","password":"Senha123"}'
```

Use as credenciais de um usuário previamente cadastrado no banco. A porta do
Compose de deploy é 8083; ajuste a URL conforme o ambiente.

Sucesso: HTTP 200, com `token`, `userId`, `name`, `email` e `role` (`ADMIN` ou
`PARTICIPANT`). A resposta não contém senha nem hash.

E-mail inexistente, senha incorreta e campos ausentes/vazios: HTTP 401 com
`{"message":"Invalid email or password"}`. JSON malformado ou corpo ausente:
HTTP 400 com `{"message":"Malformed request"}`.

Para acessar uma rota protegida, envie:

```bash
curl -i http://localhost:8080/api/ROTA_EXISTENTE \
  -H 'Authorization: Bearer TOKEN_RECEBIDO_NO_LOGIN'
```

`ROTA_EXISTENTE` é um marcador para uma rota implementada. O endpoint de promoção
de usuários descrito abaixo exige perfil de administrador. Sem token válido,
rotas protegidas retornam 401.
O login e o cadastro (POST), além de `/actuator/health` (GET), são públicos; o health é usado pelo deploy.

## Sessões e perfis

Os tokens opacos ficam em memória e expiram após uma hora. Configure a duração
com `app.auth.token-ttl` (por exemplo `PT30M`) ou `APP_AUTH_TOKEN_TTL`. Reiniciar o
backend invalida os tokens. Essa implementação serve a uma única instância;
instâncias múltiplas precisarão compartilhar o armazenamento de sessões.

O filtro associa a identidade ao contexto de segurança com `ROLE_ADMIN` ou
`ROLE_PARTICIPANT`. A segurança por método está habilitada e permite usar
`@PreAuthorize("hasRole('ADMIN')")`. As permissões específicas das operações de
cada domínio devem ser definidas pelos seus responsáveis. O teste verifica que
um participante recebe 403 em uma operação reservada ao administrador.

## Administrador inicial

A criação do primeiro administrador é opcional e ocorre durante a inicialização.
Configure as variáveis de ambiente antes de iniciar o backend:

```text
INITIAL_ADMIN_ENABLED=true
INITIAL_ADMIN_NAME=Administrador
INITIAL_ADMIN_EMAIL=admin@inatel.br
INITIAL_ADMIN_PASSWORD=<senha definida pelo responsável>
```

Não existe senha padrão. A senha segue as regras de cadastro e é salva com BCrypt;
nome e e-mail devem ser válidos. Sem essas variáveis, a funcionalidade fica desativada.
Com a criação habilitada, dados inválidos ou e-mail ocupado por outro usuário
impedem a inicialização, sem promover participantes automaticamente.

Se já existir qualquer `ADMIN`, nenhuma conta ou senha é alterada nos reinícios.
Após criar o primeiro administrador, desative `INITIAL_ADMIN_ENABLED` e remova as
credenciais do ambiente. No Docker Compose, as variáveis precisam ser repassadas
ao container em `environment`; defini-las apenas no host não as disponibiliza ao backend.
O administrador pode fazer login normalmente em `POST /api/auth/login`.

## Verificação automatizada

Na raiz do projeto:

```bash
cd backend
./mvnw test
```

`AuthHttpTest` usa Spring MVC e a cadeia de segurança reais, BCrypt real e um
repositório simulado. Verifica os dois perfis, credenciais inválidas, JSON inválido,
token ausente/inválido/expirado, isolamento entre requisições e restrição por perfil.
`UserServiceTest` verifica as regras de cadastro e validação das credenciais.

`AuthDatabaseTest` usa o contexto completo e um banco SQLite descartável no
diretório temporário do sistema. Ele executa automaticamente com a suíte e
recria o esquema com `create-drop`.

Esse teste cadastra usuários com BCrypt, força a escrita e limpa o contexto JPA
antes do login, verificando a leitura no banco para ambos os perfis. Também
verifica rejeição de senha incorreta e usuário inexistente.

O projeto usa SQLite. No Compose de deploy, o arquivo do banco fica em um volume
nomeado em `/app/data/gestaolab.db`, preservado entre reinicializações do container.

## Promoção de participantes

`PATCH /api/users/{id}/promote`

Requer `Authorization: Bearer <token>` de um usuário `ADMIN`. Não requer corpo.

```bash
curl -X PATCH http://localhost:8080/api/users/2/promote \
  -H "Authorization: Bearer <token-do-administrador>"
```

| Status | Resultado |
|---|---|
| 200 | Usuário promovido; retorna `id`, `name`, `email` e `role: ADMIN`, sem senha. |
| 401 | Token ausente, inválido ou expirado. |
| 403 | Usuário autenticado como `PARTICIPANT`, inclusive ao tentar promover a si mesmo. |
| 404 | Usuário de destino não encontrado. |

Repetir a promoção de um administrador retorna 200 e mantém seu perfil.
A alteração é persistida no SQLite. Como os tokens existentes preservam o perfil
do momento de sua emissão, o usuário promovido deve fazer login novamente para
obter as permissões de administrador.

Os cenários de promoção, repetição, persistência, novo login, acesso negado e
usuário inexistente estão cobertos em `AuthDatabaseTest`.
