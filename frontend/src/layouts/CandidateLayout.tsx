import { Bell, CalendarDays, FileText, Home, LogOut, MessageSquare, Settings, UserRound } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAuth } from '../hooks/useAuth';

export function CandidateLayout() { const { user, logout } = useAuth(); const navigate = useNavigate(); return <div className="candidate-shell"><header><Logo/><span>Вітаємо, {user?.display_name}</span><button className="button ghost" onClick={async()=>{await logout();navigate('/login')}}><LogOut size={17}/>Вийти</button></header><div className="candidate-body"><nav><NavLink to="/cabinet" end><Home/>Мій кабінет</NavLink><NavLink to="/cabinet/profile"><UserRound/>Моя анкета</NavLink><NavLink to="/cabinet/documents"><FileText/>Мої документи</NavLink><NavLink to="/cabinet/status"><Bell/>Мій статус</NavLink><NavLink to="/cabinet/interviews"><CalendarDays/>Співбесіди</NavLink><NavLink to="/cabinet/messages"><MessageSquare/>Повідомлення</NavLink><NavLink to="/cabinet/settings"><Settings/>Налаштування профілю</NavLink></nav><main><Outlet/></main></div></div> }
