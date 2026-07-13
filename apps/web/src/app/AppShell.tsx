import { Link, NavLink, Outlet } from 'react-router-dom';
import { useSession } from '../features/access/SessionProvider';
import { OfflineBanner } from '../components/OfflineBanner';

const nav = [
  { to: '/today', icon: 'today', label: '今日' },
  { to: '/history', icon: 'calendar_month', label: '历史' },
  { to: '/pet', icon: 'pets', label: '宠物' },
];
export function AppShell() {
  const { session } = useSession();
  return (
    <div className="app-frame">
      <header className="topbar">
        <div>
          <span className="eyebrow">{session?.workspace.name}</span>
          <strong>Soft Habit</strong>
        </div>
        <Link className="icon-button" aria-label="打开设置" to="/settings">
          <span className="material-symbols-rounded">settings</span>
        </Link>
      </header>
      <OfflineBanner />
      <main>
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="主导航">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="material-symbols-rounded">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
