
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { getToken as readToken, setToken as saveToken, clearToken } from '../services/auth';
import type { ReactNode } from 'react';

type IUser = { id?: number; username?: string; email?: string };
type AuthContextType = {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const t = readToken();
    setToken(t);
    if (t) {
      api.get('/api/v1/alunos/')
        .then(() => {})
        .catch(() => { saveToken(null); setToken(null); })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  async function login(username: string, password: string) {
    setLoading(true);
    try {
      const payload = { username, password };
      const res = await api.post('/api/v1/instrutores/login', payload);
      const accessToken = res?.data?.access_token ?? res?.data?.access ?? res?.data?.token ?? null;
      if (!accessToken) throw new Error('Token não retornado pelo backend: ' + JSON.stringify(res?.data));
      saveToken(accessToken);
      setToken(accessToken);
    } finally { setLoading(false); }
  }

  function logout() { clearToken(); setToken(null); setUser(null); }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
