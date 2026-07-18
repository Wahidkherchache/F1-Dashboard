import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/drivers', label: 'Drivers' },
  { to: '/constructors', label: 'Constructors' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/results', label: 'Last Race' },
  { to: '/live', label: 'Live' },
];

export default function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo">
            <span className="logo-icon">◉</span>
            <span className="logo-text">
              F1 <span className="logo-accent">Telemetry</span>
            </span>
          </NavLink>

          <nav className="nav">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''} ${to === '/live' ? 'nav-link-live' : ''}`
                }
              >
                {label}
                {to === '/live' && <span className="nav-live-dot" />}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <span>2026 Season</span>
        <span className="footer-divider">|</span>
        <span>Data via Jolpica-F1 API</span>
      </footer>
    </div>
  );
}

