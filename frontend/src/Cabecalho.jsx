import { useAuth } from './AuthContext';
import { initials, ROLE_LABELS } from './api';

const ABAS = [
  ['inventario', 'Inventario'],
  ['emprestimos', 'Emprestimos'],
];

/** Barra superior da area autenticada: usuario, perfil, abas e sair. */
export default function Cabecalho({ aba, onTrocarAba }) {
  const { user, logout } = useAuth();

  return (
    <header className="topo">
      <div className="topo__marca">
        <span className="topo__logo" aria-hidden="true">GL</span>
        <div>
          <strong>Gestao Lab</strong>
          <span className="topo__sub">Laboratorios e dispositivos</span>
        </div>
      </div>

      <nav className="abas" aria-label="Secoes">
        {ABAS.map(([chave, rotulo]) => (
          <button
            key={chave}
            type="button"
            className={`aba ${aba === chave ? 'aba--ativa' : ''}`}
            aria-current={aba === chave ? 'page' : undefined}
            onClick={() => onTrocarAba(chave)}
          >
            {rotulo}
          </button>
        ))}
      </nav>

      <div className="topo__usuario">
        <span className="avatar avatar--sm" aria-hidden="true">{initials(user?.name)}</span>
        <div>
          <h1 className="topo__ola">Ola, {String(user?.name ?? '').split(' ')[0]}</h1>
          <span className="badge">{ROLE_LABELS[user?.role] ?? user?.role}</span>
        </div>
        <button type="button" className="btn btn--secondary btn--sm" onClick={logout}>Sair</button>
      </div>
    </header>
  );
}
