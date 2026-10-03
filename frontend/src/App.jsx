import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import { ROLE_LABELS, initials } from './api';

export default function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Confirmacao /> : <LoginPage />;
}

/** Tela pos-login: confirma quem entrou e qual perfil foi reconhecido. */
function Confirmacao() {
  const { user, logout, isAdmin } = useAuth();

  const dados = [
    ['Nome', user.name],
    ['Email', user.email],
    ['Matricula', user.registration],
    ['Perfil', <span className="badge">{ROLE_LABELS[user.role]}</span>],
  ];

  return (
    <div className="welcome">
      <div className="welcome__card">
        <div className="avatar" aria-hidden="true">{initials(user.name)}</div>

        <h1>Ola, {String(user.name).split(' ')[0]}</h1>
        <p className="muted">Autenticacao concluida com sucesso.</p>

        <dl className="welcome__dados">
          {dados.map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt>{rotulo}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>

        <p className="welcome__nota">
          {isAdmin
            ? 'Como administrador, voce gerencia laboratorios, cadastra itens e aprova emprestimos.'
            : 'Como participante, voce pode solicitar emprestimos de equipamentos para seus projetos.'}
        </p>

        <button type="button" className="btn btn--secondary" onClick={logout}>Sair</button>
      </div>
    </div>
  );
}
