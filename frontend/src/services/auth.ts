// src/services/auth.ts
import api from './api';

export type LoginPayload = { email: string; password: string };

export async function login(payload: LoginPayload) {
  const res = await api.post('/auth/login', payload);
  const data = res.data;
  if (data.access_token) localStorage.setItem('access_token', data.access_token);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout'); // opcional
  } catch (e) {}
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}
