import axios from 'axios';

// En producción (Vercel) usa VITE_API_URL configurada en las Environment Variables.
// En desarrollo local, si no existe el .env, apunta al backend desplegado.
const BASE_URL = import.meta.env.VITE_API_URL || 'https://back-end-ashy-delta.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor: agrega el token JWT si existe en localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
