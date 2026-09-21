import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from './axios';

let socketInstance = null;

export const getPersistentSocket = async () => {
  if (!socketInstance) {
    const rawToken = await AsyncStorage.getItem("token") || 
                     await AsyncStorage.getItem("user_token") || 
                     await AsyncStorage.getItem("passenger_token") ||
                     await AsyncStorage.getItem("driver_token") || 
                     await AsyncStorage.getItem("auth_token");
    
    const cleanToken = rawToken ? rawToken.replace(/^["']|["']$/g, '').trim().replace(/^Bearer\s+/i, '') : '';
    
    const socketServerUrl = getApiBaseUrl().replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
      
    socketInstance = io(socketServerUrl, {
      transports: ['websocket'],
      auth: { token: cleanToken },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("🟢 Persistent Socket Connected:", socketInstance.id);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err.message);
    });
  } else if (socketInstance && !socketInstance.connected) {
    const rawToken = await AsyncStorage.getItem("token") || 
                     await AsyncStorage.getItem("user_token") || 
                     await AsyncStorage.getItem("passenger_token") ||
                     await AsyncStorage.getItem("driver_token") || 
                     await AsyncStorage.getItem("auth_token");
    const cleanToken = rawToken ? rawToken.replace(/^["']|["']$/g, '').trim().replace(/^Bearer\s+/i, '') : '';
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