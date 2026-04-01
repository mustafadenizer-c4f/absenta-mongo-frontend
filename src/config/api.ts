// src/config/api.ts

export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Lightweight fetch wrapper that:
 * 1. Attaches the JWT access_token from localStorage as a Bearer token
 * 2. On 401, attempts a silent token refresh and retries the original request once
 * 3. If refresh also fails, clears tokens and redirects to /login
 */

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

function clearTokensAndRedirect(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  // Show a user-friendly message before redirect
  const lang = localStorage.getItem('user_language') || navigator.language || '';
  const isTr = lang.toLowerCase().startsWith('tr');
  alert(isTr ? 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.' : 'Your session has expired. Please log in again.');
  const base = process.env.PUBLIC_URL || '';
  window.location.href = `${base}/login`;
}

function buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T = any>(
  url: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: buildHeaders(options.headers as Record<string, string> | undefined),
  });

  if (res.status === 401 && retry) {
    // Don't attempt token refresh for auth endpoints (login, refresh, etc.)
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register');
    if (!isAuthEndpoint) {
      // Deduplicate concurrent refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = attemptTokenRefresh().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const refreshed = await (refreshPromise ?? attemptTokenRefresh());
      if (refreshed) {
        // Retry the original request with the new token (no further retries)
        return request<T>(url, options, false);
      }

      clearTokensAndRedirect();
      // Return a never-resolving promise so the page redirect completes
      // without the error propagating to React and causing a white screen
      return new Promise<T>(() => {});
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body.error || body.message || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json();
}

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const apiClient = {
  get<T = any>(path: string, queryParams?: Record<string, any>): Promise<T> {
    const qs = queryParams ? buildQueryString(queryParams) : '';
    return request<T>(`${API_BASE_URL}${path}${qs}`, { method: 'GET' });
  },

  post<T = any>(path: string, body?: any): Promise<T> {
    return request<T>(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T = any>(path: string, body?: any): Promise<T> {
    return request<T>(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = any>(path: string): Promise<T> {
    return request<T>(`${API_BASE_URL}${path}`, { method: 'DELETE' });
  },
};
