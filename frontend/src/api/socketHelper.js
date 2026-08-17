import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './axios';

let socketInstance = null;

export const getPersistentSocket = async () => {
  if (!socketInstance) {
    const token = await AsyncStorage.getItem("token") || 
                  await AsyncStorage.getItem("user_token") || 
                  await AsyncStorage.getItem("driver_token") || 
                  await AsyncStorage.getItem("auth_token");
    
    const socketServerUrl = api.defaults.baseURL 
      ? api.defaults.baseURL.replace('/api/v1', '').replace(/\/$/, '') 
      : 'https://c5m62bwc-5000.uks1.devtunnels.ms';
      
    socketInstance = io(socketServerUrl, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      console.log("🟢 Persistent Driver Socket Connected:", socketInstance.id);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err.message);
    });

    // 🔍 CATCH-ALL DEBUGGER: Prints every event received from the backend
    socketInstance.onAny((eventName, ...args) => {
      console.log(`📡 [SOCKET EVENT RECEIVED] Event: "${eventName}"`, args);
    });
  }
  return socketInstance;
};