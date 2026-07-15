// web-admin/src/api/axios.jsx
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://orange-fiesta-wrrvpqgqgxw53x65-5000.app.github.dev/api/v1', 
  timeout: 10000,
});

// Automatically inject the JWT token into every outgoing request
api.interceptors.request.use(
  (config) => {
    // 💡 Ensure your login screen saves the token under this exact key!
    const token = localStorage.getItem('adminToken'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;