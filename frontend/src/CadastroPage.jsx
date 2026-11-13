import { useState } from 'react';
import { cadastrar, emailInvalido, senhaInvalida, SENHA_MIN } from './api';
import Campo from './Campo';

/**
 * Cadastro publico (POST /api/auth/register).
 * O backend cria sempre um PARTICIPANT e nao faz login automatico, por isso a
 * tela confirma o cadastro e devolve o usuario para o login.
 */
export default function CadastroPage({ onIrParaLogin }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  function validar() {
    const novos = {};
    if (!nome.trim()) novos.nome = 'Informe seu nome.';
    const email_ = emailInvalido(email);
    const senha_ = senhaInvalida(senha);
    if (email_) novos.email = email_;
    if (senha_) novos.senha = senha_;
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function enviar(event) {
    event.preventDefault();
    setErroGeral('');
    if (!validar()) return;

    setEnviando(true);
    try {
      await cadastrar({ name: nome.trim(), email: email.trim(), password: senha });
      setPronto(true);
    } catch (error) {
      setErroGeral(error.message || 'Nao foi possivel concluir o cadastro.');
    } finally {
      setEnviando(false);
    }
  }

  if (pronto) {
    return (
      <div className="login">
        <aside className="login__aside">
          <h1>Gestao de Laboratorios e Dispositivos</h1>
        </aside>
        <div className="login__panel">
          <div className="login__box">
            <h1>Cadastro concluido</h1>
            <p className="login__desc">
              Sua conta foi criada com o perfil de Participante. Entre com o email e a senha que
              voce acabou de cadastrar.
            </p>
            <button type="button" className="btn btn--primary" onClick={onIrParaLogin}>
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <aside className="login__aside">
        <h1>Gestao de Laboratorios e Dispositivos</h1>
        <p>Crie sua conta para solicitar emprestimos de equipamentos dos laboratorios.</p>
      </aside>

      <div className="login__panel">
        <form className="login__box" onSubmit={enviar} noValidate>
          <div>
            <h1>Criar conta</h1>
            <p className="login__desc">Novas contas recebem o perfil de Participante.</p>
          </div>

          {erroGeral && <div className="alert" role="alert">{erroGeral}</div>}

          <Campo
            id="nome"
            label="Nome"
            autoComplete="name"
            placeholder="Seu nome completo"
            value={nome}
            erro={erros.nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <Campo
            id="email"
            label="Email"
            type="email"
            autoComplete="username"
            placeholder="nome@inatel.br"
            value={email}
            erro={erros.email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Campo
            id="senha"
            label="Senha"
            type="password"
            autoComplete="new-password"
            placeholder={`No minimo ${SENHA_MIN} caracteres`}
            value={senha}
            erro={erros.senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <p className="ajuda">
            A senha precisa de no minimo {SENHA_MIN} caracteres, uma letra maiuscula e um digito.
          </p>

          <button type="submit" className="btn btn--primary" disabled={enviando}>
            {enviando ? 'Cadastrando...' : 'Criar conta'}
          </button>

          <p className="login__rodape">
            Ja tem conta?{' '}
            <button type="button" className="link" onClick={onIrParaLogin}>Entrar</button>
          </p>
        </form>
      </div>
    </div>
  );
}
