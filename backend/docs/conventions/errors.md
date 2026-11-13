# Convenções de erros

As APIs retornam erros em JSON com uma mensagem segura para consumo pelo cliente:

```json
{
  "message": "Device name must not be blank"
}
```

`message` é obrigatório, legível e não deve expor SQL, stack traces, hashes, tokens
ou outros detalhes internos. A mensagem descreve o problema, sem depender da classe
Java que o originou.

## Mapeamento HTTP

| Situação | Status | Exemplo de uso |
| --- | ---: | --- |
| Requisição malformada ou dado inválido | 400 | JSON inválido, campo obrigatório ausente ou regra de formato violada |
| Autenticação ausente, inválida ou expirada | 401 | Token Bearer ausente ou inválido |
| Autenticação válida sem permissão | 403 | Participante em operação exclusiva de administrador |
| Recurso não encontrado | 404 | Dispositivo ou usuário inexistente |
| Conflito de estado ou unicidade | 409 | E-mail já cadastrado ou operação incompatível com o estado atual |
| Falha inesperada | 500 | Erro não tratado pelo backend |

## Origem e tratamento

- Controllers traduzem HTTP para chamadas de serviço; não concentram regras de negócio
  nem fazem `try/catch` para montar respostas.
- Serviços lançam exceções de domínio para regras inválidas e recursos inexistentes.
- `@RestControllerAdvice` converte exceções em status HTTP e no formato acima.
- Validações de DTO feitas com Bean Validation retornam `400`.

## Estado atual e meta de padronização

O formato atualmente exposto pelos handlers existentes já é `{ "message": "..." }`.
Porém, as mensagens de validação ainda variam entre domínios: usuários usa mensagem
genérica, enquanto dispositivos e empréstimos agregam mensagens de campos. Novos
endpoints devem escolher uma mensagem consistente e, quando os handlers atuais forem
refatorados, todos os domínios devem adotar o mesmo comportamento.
