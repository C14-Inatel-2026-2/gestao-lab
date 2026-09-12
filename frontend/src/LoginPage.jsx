import { useState } from 'react';
import { useAuth } from './AuthContext';
import { USE_MOCK, ROLE_LABELS } from './api';

// Integrantes do grupo, espelhando os usuarios do mock em api.js
const CONTAS_DEMO = [
  { name: 'Solange Ribeiro da Fonseca', email: 'solange@inatel.br', role: 'ADMIN' },
  { name: 'Mauro Iwama', email: 'mauro@inatel.br', role: 'ADMIN' },
  { name: 'Giovana Franciele Gonçalves Leite', email: 'giovana@inatel.br', role: 'PARTICIPANT' },
  { name: 'Igor Nogueira Olivio', email: 'igor@inatel.br', role: 'PARTICIPANT' },
  { name: 'Lucas Nolasco Ynoguti', email: 'lucas@inatel.br', role: 'PARTICIPANT' },
];

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

          {erroGeral && (
            <div className="alert" role="alert">
              {erroGeral}
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="username"
              placeholder="nome@inatel.br"
              className={`field__control ${erros.email ? 'field__control--error' : ''}`}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {erros.email && <span className="field__error">{erros.email}</span>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              name="senha"
              autoComplete="current-password"
              placeholder="Sua senha"
              className={`field__control ${erros.senha ? 'field__control--error' : ''}`}
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
            />
            {erros.senha && <span className="field__error">{erros.senha}</span>}
          </div>

          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {USE_MOCK && (
            <div className="demo">
              <strong>Ambiente de demonstracao</strong>
              <p className="demo__sub">
                Senha para todos: <code>123456</code>
              </p>
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
