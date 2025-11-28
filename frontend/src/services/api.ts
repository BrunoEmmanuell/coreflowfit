// src/services/api.ts
import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

const api = axios.create({
  baseURL, // exemplo: https://coreflowfit-backend.onrender.com
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // ative se backend usa cookies HttpOnly para refresh token
});

// Adiciona Authorization automaticamente se houver token
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

export default api;
