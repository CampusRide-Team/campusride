import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from './axios';

let socketInstance = null;

export const getPersistentSocket = async () => {
  const rawToken = await AsyncStorage.getItem("token") || 
                   await AsyncStorage.getItem("user_token") || 
                   await AsyncStorage.getItem("passenger_token") ||
                   await AsyncStorage.getItem("driver_token") || 
                   await AsyncStorage.getItem("auth_token");

  const cleanToken = rawToken ? rawToken.replace(/^["']|["']$/g, '').trim().replace(/^Bearer\s+/i, '') : '';

  // Guard: Unauthenticated sessions (onboarding, login, splash) do not establish active ride socket connections
  if (!cleanToken) {
    return null;
  }

  if (!socketInstance) {
    const socketServerUrl = getApiBaseUrl().replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

    socketInstance = io(socketServerUrl, {
      transports: ['websocket'],
      auth: { token: cleanToken },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2500,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    socketInstance.on("connect", () => {
      console.log("🟢 Authenticated Socket Connected:", socketInstance.id);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection notice:", err.message);
    });
  } else if (socketInstance && !socketInstance.connected) {
    socketInstance.auth = { token: cleanToken };
    socketInstance.connect();
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
};