import axios from 'axios';

const BACKEND = (import.meta as any).env.REACT_APP_BACKEND_URL || (import.meta as any).env.VITE_BACKEND_URL || '';

export const BACKEND_URL = BACKEND;

export const api = axios.create({
  baseURL: `${BACKEND}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aasha_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== '/admin/login') {
        localStorage.removeItem('aasha_token');
        localStorage.removeItem('aasha_email');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

export function resolveImage(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return `${BACKEND}${url}`;
  return url;
}
