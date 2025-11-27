import axios from 'axios';

// Pega a URL do ambiente ou usa localhost como padrão
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: baseURL,
});

// Adiciona o Token automaticamente em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;