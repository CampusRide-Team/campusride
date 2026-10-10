// web-admin/src/api/socket.js
import { io } from 'socket.io-client';

let socket = null;

export const getSocketUrl = () => {
  if (import.meta.env?.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  }
  return 'http://localhost:5000';
};

export const getAdminSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
    const cleanToken = token.replace(/^["']|["']$/g, '').trim().replace(/^Bearer\s+/i, '');

    socket = io(getSocketUrl(), {
      auth: { token: cleanToken },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      // Auto-join admin safety room
      socket.emit('admin:safety_join', () => {});
    });
  }
  return socket;
};

export const disconnectAdminSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getAdminSocket;
