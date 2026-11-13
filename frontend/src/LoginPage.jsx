import { useState } from 'react';
import { useAuth } from './AuthContext';
import { emailInvalido, senhaInvalida } from './api';
import Campo from './Campo';

export default function LoginPage({ onIrParaCadastro }) {
  const { login, loading, expirada } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');

  function validar() {
    // Mesmas regras do backend: barrar aqui evita um 400 ou 401 previsivel.
    const novos = {};
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

    try {
      await login(email.trim(), senha);
    } catch (error) {
      setErroGeral(error.message || 'Nao foi possivel entrar.');
    }
  }

  return (
    <div className="login">
      <aside className="login__aside">
        <h1>Gestao de Laboratorios e Dispositivos</h1>
        <p>
          Controle centralizado de laboratorios academicos: inventario, projetos e o fluxo completo de
          emprestimo e devolucao de equipamentos.
        </p>
      </aside>

      <div className="login__panel">
        <form className="login__box" onSubmit={enviar} noValidate>
          <div>
            <h1>Entrar</h1>
            <p className="login__desc">Use suas credenciais institucionais.</p>
          </div>

          {expirada && (
            <div className="aviso" role="status">Sua sessao expirou. Entre novamente.</div>
          )}

          {erroGeral && <div className="alert" role="alert">{erroGeral}</div>}

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
            autoComplete="current-password"
            placeholder="Sua senha"
            value={senha}
            erro={erros.senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="login__rodape">
            Primeiro acesso?{' '}
            <button type="button" className="link" onClick={onIrParaCadastro}>Criar uma conta</button>
          </p>
        </form>
      </div>
    </div>
  );
}
