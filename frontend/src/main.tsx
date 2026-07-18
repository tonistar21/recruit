import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './hooks/useAuth';
import './styles.css';
import './modules.css';
import './search.css';
import './errors.css';

const client = new QueryClient({ defaultOptions: { queries: { staleTime: 20_000, retry: 1 } } });
createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><QueryClientProvider client={client}><BrowserRouter><AuthProvider><App/><Toaster richColors position="top-right"/></AuthProvider></BrowserRouter></QueryClientProvider></ErrorBoundary></StrictMode>);
