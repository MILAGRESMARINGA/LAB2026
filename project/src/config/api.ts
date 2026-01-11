import axios from 'axios';

// Configure sua URL do backend aqui
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3333';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token se necessário
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
      console.warn('Backend não disponível. Verifique se o servidor WPPConnect está rodando.');
    } else {
      console.error('API Error:', error);
    }
    return Promise.reject(error);
  }
);