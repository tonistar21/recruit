import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Loading } from './components/States';
import { useAuth } from './hooks/useAuth';
import { CandidateLayout } from './layouts/CandidateLayout';
import { StaffLayout } from './layouts/StaffLayout';
import { RolesPage, SettingsPage } from './pages/AdminPages';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CandidateHomePage, CandidateProfilePage, CandidateStatusPage, NotificationsPage } from './pages/CabinetPages';
import { CandidateDetailPage } from './pages/CandidateDetailPage';
import { CandidateFormPage } from './pages/CandidateFormPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { InterviewsPage } from './pages/InterviewsPage';
import { LoginPage } from './pages/LoginPage';
import { AuditPage, UsersPage } from './pages/UsersAuditPages';
import { WorkflowPage } from './pages/WorkflowPage';

function Protected({candidate=false}:{candidate?:boolean}){const {user,loading}=useAuth();if(loading)return <Loading/>;if(!user)return <Navigate to="/login" replace/>;if(candidate&&user.role!=='candidate')return <Navigate to="/dashboard" replace/>;if(!candidate&&user.role==='candidate')return <Navigate to="/cabinet" replace/>;return candidate?<CandidateLayout/>:<StaffLayout/>}
function Permission({code}:{code:string}){const {can}=useAuth();return can(code)?<Outlet/>:<ErrorPage code="403" title="Доступ заборонено"/>}
function ErrorPage({code,title}:{code:string;title:string}){return <main className="route-error"><b>{code}</b><h1>{title}</h1><a href="/">Повернутися на головну</a></main>}
export default function App(){return <Routes><Route path="/login" element={<LoginPage/>}/><Route element={<Protected/>}><Route path="/dashboard" element={<DashboardPage/>}/><Route path="/candidates" element={<CandidatesPage/>}/><Route path="/candidates/new" element={<CandidateFormPage/>}/><Route path="/candidates/:id" element={<CandidateDetailPage/>}/><Route path="/documents" element={<DocumentsPage/>}/><Route path="/workflow" element={<WorkflowPage/>}/><Route path="/interviews" element={<InterviewsPage/>}/><Route element={<Permission code="analytics.read"/>}><Route path="/analytics" element={<AnalyticsPage/>}/></Route><Route element={<Permission code="users.manage"/>}><Route path="/users" element={<UsersPage/>}/></Route><Route element={<Permission code="roles.manage"/>}><Route path="/roles" element={<RolesPage/>}/></Route><Route element={<Permission code="audit.read"/>}><Route path="/audit" element={<AuditPage/>}/></Route><Route path="/settings" element={<SettingsPage/>}/></Route><Route element={<Protected candidate/>}><Route path="/cabinet" element={<CandidateHomePage/>}/><Route path="/cabinet/profile" element={<CandidateProfilePage/>}/><Route path="/cabinet/documents" element={<DocumentsPage/>}/><Route path="/cabinet/status" element={<CandidateStatusPage/>}/><Route path="/cabinet/interviews" element={<InterviewsPage/>}/><Route path="/cabinet/messages" element={<NotificationsPage/>}/><Route path="/cabinet/settings" element={<SettingsPage/>}/></Route><Route path="*" element={<ErrorPage code="404" title="Сторінку не знайдено"/>}/></Routes>}
