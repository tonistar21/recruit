const API = '/api/v1';

function csrf(): string {
  return document.cookie.split('; ').find((row) => row.startsWith('csrf_token='))?.split('=')[1] ?? '';
}

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

function errorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const value = data as { detail?: unknown; error?: { message?: unknown } };
  if (typeof value.error?.message === 'string') return value.error.message;
  if (typeof value.detail === 'string') return value.detail;
  return undefined;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method?.toUpperCase() ?? 'GET';
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-CSRF-Token', decodeURIComponent(csrf()));
  let response = await fetch(`${API}${path}`, { ...init, headers, credentials: 'include' });
  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    const refreshed = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshed.ok) response = await fetch(`${API}${path}`, { ...init, headers, credentials: 'include' });
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorMessage(data) ?? `Помилка сервера (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
