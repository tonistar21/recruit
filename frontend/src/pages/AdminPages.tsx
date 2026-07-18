import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Empty, Loading, PageHeader } from '../components/States';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

type Permission = { code: string; description: string };
type Role = { code: string; name: string; system: boolean; permissions: string[] };
type SystemSettings = { system_name: string; max_upload_mb: number; allowed_mime_types: string[]; access_token_minutes: number; max_login_attempts: number; lockout_minutes: number };
type ProfileSettings = { display_name: string; notifications_enabled: boolean };

export function RolesPage() {
  const client = useQueryClient(); const { can } = useAuth();
  const roles = useQuery({ queryKey: ['roles'], queryFn: () => api<Role[]>('/roles') });
  const permissions = useQuery({ queryKey: ['permissions'], queryFn: () => api<Permission[]>('/permissions') });
  const [draft, setDraft] = useState<Record<string, Set<string>>>({});
  useEffect(() => { if (roles.data) setDraft(Object.fromEntries(roles.data.map((role) => [role.code, new Set(role.permissions)]))); }, [roles.data]);
  const save = useMutation({ mutationFn: ({ role, values }: { role: string; values: string[] }) => api<Role>(`/roles/${role}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions: values }) }), onSuccess: async () => { toast.success('Права ролі збережено'); await client.invalidateQueries({ queryKey: ['roles'] }); await client.invalidateQueries({ queryKey: ['me'] }); }, onError: (error) => toast.error(error instanceof Error ? error.message : 'Не вдалося зберегти права') });
  if (roles.isLoading || permissions.isLoading) return <Loading/>;
  if (roles.isError || permissions.isError) return <Empty title="Не вдалося завантажити матрицю" text="Перевірте backend і право roles.manage."/>;
  const groups = (permissions.data ?? []).reduce<Record<string, Permission[]>>((result, permission) => { const group = permission.code.split('.')[0]; (result[group] ??= []).push(permission); return result; }, {});
  return <><PageHeader title="Ролі доступу" subtitle="Серверна матриця granular permissions"/><div className="roles-grid">{roles.data?.map((role) => <section className="panel role-card" key={role.code}><header><div><ShieldCheck/><span><b>{role.name}</b><small>{role.code}</small></span></div>{role.code === 'admin' && <span className="badge">Захищена</span>}</header>{Object.entries(groups).map(([group, items]) => <fieldset key={group} disabled={!can('roles.manage') || role.code === 'admin'}><legend>{group}</legend>{items?.map((permission) => <label className="permission" key={permission.code}><input type="checkbox" checked={draft[role.code]?.has(permission.code) ?? false} onChange={(event) => setDraft((current) => { const next = new Set(current[role.code]); if (event.target.checked) next.add(permission.code); else next.delete(permission.code); return { ...current, [role.code]: next }; })}/><span><b>{permission.code}</b><small>{permission.description}</small></span></label>)}</fieldset>)}{role.code !== 'admin' && <button className="button primary" disabled={save.isPending || !can('roles.manage')} onClick={() => { if (window.confirm(`Зберегти зміну прав ролі «${role.name}»?`)) save.mutate({ role: role.code, values: [...(draft[role.code] ?? [])] }); }}><Save/>Зберегти права</button>}</section>)}</div></>;
}

export function SettingsPage() {
  const { can } = useAuth(); const client = useQueryClient();
  const profile = useQuery({ queryKey: ['profile-settings'], queryFn: () => api<ProfileSettings>('/settings/profile') });
  const system = useQuery({ queryKey: ['system-settings'], queryFn: () => api<SystemSettings>('/settings/system'), enabled: can('settings.manage') });
  const profileMutation = useMutation({ mutationFn: (value: ProfileSettings) => api('/settings/profile', { method: 'PUT', body: JSON.stringify(value) }), onSuccess: async () => { toast.success('Особисті налаштування збережено'); await client.invalidateQueries({ queryKey: ['me'] }); }, onError: (e) => toast.error(e instanceof Error ? e.message : 'Помилка') });
  const systemMutation = useMutation({ mutationFn: (value: SystemSettings) => api('/settings/system', { method: 'PUT', body: JSON.stringify(value) }), onSuccess: () => toast.success('Системні налаштування застосовано'), onError: (e) => toast.error(e instanceof Error ? e.message : 'Помилка') });
  if (profile.isLoading || (can('settings.manage') && system.isLoading)) return <Loading/>;
  function saveProfile(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); profileMutation.mutate({ display_name: String(data.get('display_name')), notifications_enabled: data.get('notifications_enabled') === 'on' }); }
  function saveSystem(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); systemMutation.mutate({ system_name: String(data.get('system_name')), max_upload_mb: Number(data.get('max_upload_mb')), allowed_mime_types: String(data.get('allowed_mime_types')).split(',').map((x) => x.trim()).filter(Boolean), access_token_minutes: Number(data.get('access_token_minutes')), max_login_attempts: Number(data.get('max_login_attempts')), lockout_minutes: Number(data.get('lockout_minutes')) }); }
  return <><PageHeader title="Налаштування" subtitle="Параметри PostgreSQL, які реально застосовуються backend"/><div className="settings-grid"><form className="panel settings-form" onSubmit={saveProfile}><h2>Особисті налаштування</h2><label>Відображуване ім’я<input name="display_name" defaultValue={profile.data?.display_name} required minLength={2}/></label><label className="check"><input name="notifications_enabled" type="checkbox" defaultChecked={profile.data?.notifications_enabled}/>Внутрішні сповіщення</label><button className="button primary" disabled={profileMutation.isPending}><Save/>Зберегти профіль</button></form>{can('settings.manage') && system.data && <form className="panel settings-form" onSubmit={saveSystem}><h2>Системні налаштування</h2><label>Назва системи<input name="system_name" defaultValue={system.data.system_name} required/></label><div className="form-grid"><label>Макс. файл, МБ<input name="max_upload_mb" type="number" min="1" max="50" defaultValue={system.data.max_upload_mb}/></label><label>Access-сесія, хв<input name="access_token_minutes" type="number" min="5" max="120" defaultValue={system.data.access_token_minutes}/></label><label>Спроб входу<input name="max_login_attempts" type="number" min="3" max="10" defaultValue={system.data.max_login_attempts}/></label><label>Блокування, хв<input name="lockout_minutes" type="number" min="1" max="120" defaultValue={system.data.lockout_minutes}/></label></div><label>Дозволені MIME-типи<input name="allowed_mime_types" defaultValue={system.data.allowed_mime_types.join(', ')}/></label><button className="button primary" disabled={systemMutation.isPending}><Save/>Застосувати</button></form>}<aside className="panel info-block"><h2>Резервне копіювання</h2><p>Backup виконується штатними засобами PostgreSQL разом із копією private storage. Команди наведені в <code>docs/DEPLOYMENT.md</code>.</p></aside></div></>;
}
