
import axios from 'axios';
import { getToken, clearToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://coreflowfit-backend.onrender.com';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      clearToken();
      // optional: redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
