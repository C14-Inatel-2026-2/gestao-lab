import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Alert, Button, Input } from '../components/ui';
import { USE_MOCK } from '../api';
import { ROLE_LABELS } from '../utils/constants';

// Integrantes do grupo, espelhando os usuarios semeados em src/api/mock/db.js
const DEMO_ACCOUNTS = [
  { name: 'Solange Ribeiro da Fonseca', email: 'solange@inatel.br', role: 'ADMIN' },
  { name: 'Mauro Iwama', email: 'mauro@inatel.br', role: 'ADMIN' },
  { name: 'Giovana Franciele Gonçalves Leite', email: 'giovana@inatel.br', role: 'PARTICIPANT' },
  { name: 'Igor Nogueira Olivio', email: 'igor@inatel.br', role: 'PARTICIPANT' },
  { name: 'Lucas Nolasco Ynoguti', email: 'lucas@inatel.br', role: 'PARTICIPANT' },
];

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || '/'} replace />;
  }

  function validate() {
    const next = {};
    if (!email.trim()) next.email = 'Informe o email institucional.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Email invalido.';
    if (!password) next.password = 'Informe a senha.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;

    try {
      await login(email, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (error) {
      setFormError(error.message || 'Nao foi possivel entrar.');
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
        <ul className="login__features">
          <li>
            <span aria-hidden="true">🔌</span> Inventario por laboratorio com status em tempo real
          </li>
          <li>
            <span aria-hidden="true">📁</span> Dispositivos e participantes vinculados a projetos
          </li>
          <li>
            <span aria-hidden="true">🔄</span> Solicitacao, aprovacao e devolucao rastreaveis
          </li>
          <li>
            <span aria-hidden="true">📈</span> Relatorios de movimentacao e itens em atraso
          </li>
        </ul>
      </aside>

      <div className="login__panel">
        <form className="login__box" onSubmit={handleSubmit} noValidate>
          <div>
            <h1>Entrar</h1>
            <p className="page-header__desc">Use suas credenciais institucionais.</p>
          </div>

          {formError && <Alert tone="danger">{formError}</Alert>}

          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            placeholder="nome@inatel.br"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />

          <Input
            label="Senha"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />

          <Button type="submit" className="btn--block" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          {USE_MOCK && (
            <div className="login__hint">
              <strong>Ambiente de demonstracao</strong>
              <p className="login__hint-sub">
                Senha para todos: <code>123456</code>
              </p>
              <ul className="login__accounts">
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.email}>
                    <button
                      type="button"
                      className="login__account"
                      onClick={() => {
                        setEmail(account.email);
                        setPassword('123456');
                        setErrors({});
                        setFormError('');
                      }}
                    >
                      <span className="login__account-name">{account.name}</span>
                      <span className="login__account-email">{account.email}</span>
                      <span className={`badge badge--${account.role === 'ADMIN' ? 'brand' : 'neutral'}`}>
                        {ROLE_LABELS[account.role]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="login__hint-sub">Clique em um nome para preencher os campos.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
