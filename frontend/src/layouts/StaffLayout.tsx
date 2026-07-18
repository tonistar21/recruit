import { BarChart3, CalendarDays, FileText, Kanban, LayoutDashboard, LogOut, Menu, Settings, Shield, SunMoon, Users, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { GlobalSearch } from '../components/GlobalSearch';
import { useAuth } from '../hooks/useAuth';

const links = [
  ['/dashboard', 'Системний огляд', LayoutDashboard], ['/candidates', 'Кандидати', Users], ['/documents', 'Документи', FileText],
  ['/workflow', 'Статуси та етапи', Kanban], ['/interviews', 'Співбесіди', CalendarDays], ['/analytics', 'Аналітика', BarChart3],
  ['/users', 'Користувачі', Users], ['/roles', 'Ролі доступу', Shield], ['/audit', 'Журнал дій', FileText], ['/settings', 'Налаштування', Settings],
] as const;

export function StaffLayout() {
  const { user, logout, can } = useAuth(); const navigate = useNavigate(); const [open, setOpen] = useState(false);
  const allowed = (path: string) => !['/users', '/roles', '/audit', '/analytics'].includes(path) || (path === '/users' ? can('users.manage') : path === '/roles' ? can('roles.manage') : path === '/audit' ? can('audit.read') : can('analytics.read'));
  const theme = () => { const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = next; localStorage.setItem('rp-theme', next); };
  return <div className="shell"><aside className={open ? 'sidebar open' : 'sidebar'}><div className="side-top"><Logo/><button className="icon mobile" onClick={() => setOpen(false)} aria-label="Закрити меню"><X/></button></div><nav>{links.filter(([path]) => allowed(path)).map(([path, label, Icon]) => <NavLink key={path} to={path} onClick={() => setOpen(false)}><Icon size={18}/><span>{label}</span></NavLink>)}</nav><button className="logout" onClick={async () => { await logout(); navigate('/login'); }}><LogOut size={18}/>Вийти</button></aside><main className="workspace"><header className="topbar"><button className="icon mobile" onClick={() => setOpen(true)} aria-label="Відкрити меню"><Menu/></button><GlobalSearch/><button className="icon" onClick={theme} aria-label="Змінити тему"><SunMoon/></button><div className="user-cell"><span>{user?.display_name}</span><small>{user?.role_name}</small></div></header><div className="content"><Outlet/></div></main></div>;
}
