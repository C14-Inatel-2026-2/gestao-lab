import { useState } from 'react';
import { useAuth } from './AuthContext';
import { USE_MOCK, ROLE_LABELS, CONTAS_DEMO } from './api';


/** Campo de formulario com rotulo e mensagem de erro. */
function Campo({ id, label, erro, ...props }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <input id={id} className={`field__control ${erro ? 'field__control--error' : ''}`} {...props} />
      {erro && <span className="field__error">{erro}</span>}
    </div>
  );
}

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');

  function validar() {
    const novos = {};
    if (!email.trim()) novos.email = 'Informe o email institucional.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) novos.email = 'Email invalido.';
    if (!senha) novos.senha = 'Informe a senha.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function enviar(event) {
    event.preventDefault();
    setErroGeral('');
    if (!validar()) return;

    try {
      await login(email, senha);
    } catch (error) {
      setErroGeral(error.message || 'Nao foi possivel entrar.');
    }
  }

  function preencher(conta) {
    setEmail(conta.email);
    setSenha('123456');
    setErros({});
    setErroGeral('');
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

          {USE_MOCK && (
            <div className="demo">
              <strong>Ambiente de demonstracao</strong>
              <p className="demo__sub">Senha para todos: <code>123456</code></p>
              <ul className="demo__lista">
                {CONTAS_DEMO.map((conta) => (
                  <li key={conta.email}>
                    <button type="button" className="demo__conta" onClick={() => preencher(conta)}>
                      <span className="demo__nome">{conta.name}</span>
                      <span className="demo__email">{conta.email}</span>
                      <span className="badge">{ROLE_LABELS[conta.role]}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="demo__sub">Clique em um nome para preencher os campos.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
