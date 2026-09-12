import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from './ui';
import { ROLE_LABELS } from '../utils/constants';
import { initials } from '../utils/format';
import { USE_MOCK } from '../api';

const NAV_ITEMS = [
  { to: '/', label: 'Painel', icon: '📊', end: true },
  { to: '/laboratorios', label: 'Laboratorios', icon: '🏢' },
  { to: '/projetos', label: 'Projetos', icon: '📁' },
  { to: '/dispositivos', label: 'Dispositivos', icon: '🔌' },
  { to: '/emprestimos', label: 'Emprestimos', icon: '🔄' },
  { to: '/relatorios', label: 'Relatorios', icon: '📈' },
];

const ADMIN_ITEMS = [{ to: '/usuarios', label: 'Usuarios', icon: '👥' }];

const TITLES = {
  '/': 'Visao geral',
  '/laboratorios': 'Laboratorios',
  '/projetos': 'Projetos',
  '/dispositivos': 'Inventario de dispositivos',
  '/emprestimos': 'Emprestimos e devolucoes',
  '/relatorios': 'Relatorios',
  '/usuarios': 'Usuarios',
};

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const title = TITLES[location.pathname] || 'Gestao Lab';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">GL</div>
          <div>
            <div className="sidebar__brand-name">Gestao Lab</div>
            <div className="sidebar__brand-sub">Inatel - C14</div>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Navegacao principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            >
              <span className="sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sidebar__label">{item.label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="sidebar__section">Administracao</div>
              {ADMIN_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                >
                  <span className="sidebar__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="sidebar__label">{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar__footer">
          {USE_MOCK ? 'Modo demonstracao (API mock)' : 'Conectado a API'}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="topbar__title">{title}</span>
          <div className="topbar__right">
            <div className="topbar__user">
              <div className="avatar" aria-hidden="true">
                {initials(user?.name)}
              </div>
              <div>
                <div className="topbar__user-name">{user?.name}</div>
                <div className="topbar__user-role">{ROLE_LABELS[user?.role] || user?.role}</div>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sair
            </Button>
          </div>
        </header>

        <main className="content">
          <div className="content__inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
