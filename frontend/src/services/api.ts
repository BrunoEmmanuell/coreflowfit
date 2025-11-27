// frontend/src/services/api.ts

import axios from 'axios';

const baseURL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: baseURL,
});

// ESTE É O BLOCO CRÍTICO PARA O 401:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // <-- Lê o token salvo
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // <-- Adiciona o header
  }
  return config;
});

export default api;