import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

type AuthCtx = {
  email: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(localStorage.getItem('aasha_email'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('aasha_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((r) => {
        setEmail(r.data.email);
        localStorage.setItem('aasha_email', r.data.email);
      })
      .catch(() => {
        localStorage.removeItem('aasha_token');
        localStorage.removeItem('aasha_email');
        setEmail(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('aasha_token', data.access_token);
    localStorage.setItem('aasha_email', data.email);
    setEmail(data.email);
  }
  function logout() {
    localStorage.removeItem('aasha_token');
    localStorage.removeItem('aasha_email');
    setEmail(null);
    window.location.href = '/admin/login';
  }

  return <Ctx.Provider value={{ email, loading, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
