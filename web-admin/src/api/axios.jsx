// web-admin/src/api/axios.jsx
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://c5m62bwc-5000.uks1.devtunnels.ms/api/v1', 
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