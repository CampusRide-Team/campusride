// web-admin/src/api/axios.jsx
import axios from 'axios';

export const getAdminApiBaseUrl = () => {
  if (import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return 'http://localhost:5000/api/v1';
};

const api = axios.create({
  baseURL: getAdminApiBaseUrl(), 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Automatically inject the JWT token into every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token'); 
    if (token) {
      const cleanToken = token.replace(/^["']|["']$/g, '').trim().replace(/^Bearer\s+/i, '');
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;