# Tela de Login — Gestão de Laboratórios e Dispositivos (C14)

apenas a autenticação.

---

**8 testes** com Jest + React Testing Library, todos passando.

---

## O que esta versão faz

1. **Tela de login** com validação de campos (email obrigatório, formato do
   email, senha obrigatória) antes de chamar a API.
2. **Autenticação** contra a API mock em memória, com três respostas possíveis:
   usuário não encontrado, senha inválida e usuário inativo.
3. **Sessão** guardada no `localStorage` (token + dados do usuário) via
   `AuthContext`.
4. **Tela de confirmação** pós-login, mostrando quem entrou, a matrícula e o
   perfil reconhecido.
5. **Sair**, que limpa a sessão e volta para o login.

Feito em React 18 com Vite. Sem React Router — com uma tela só, o `App.jsx`
alterna entre login e confirmação conforme a sessão.

---

## Cobertura dos testes

| Caso | Verifica |
|---|---|
| Formulário renderiza | Campos de email e senha presentes |
| Campos obrigatórios | Não chama a API e não cria sessão |
| Formato do email | Rejeita texto que não é email |
| Senha errada | Mostra o erro vindo da API |
| Usuário inativo | Bloqueia o acesso |
| Clique no nome | Preenche email e senha |
| Login com sucesso | Mostra a confirmação e grava a sessão |
| Sair | Limpa a sessão e volta ao login |
