import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, type PropsWithChildren } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

type AuthValue = { user?: User; loading: boolean; login: (email: string, password: string, remember_me: boolean) => Promise<User>; logout: () => Promise<void>; can: (permission: string) => boolean };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/auth/me'), retry: false });
  const login = async (email: string, password: string, remember_me: boolean) => { const user = await api<User>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, remember_me }) }); client.setQueryData(['me'], user); return user; };
  const logout = async () => { await api('/auth/logout', { method: 'POST' }); client.setQueryData(['me'], null); };
  return <AuthContext.Provider value={{ user: query.data, loading: query.isLoading, login, logout, can: (p) => query.data?.permissions.includes(p) ?? false }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider missing'); return value; }
