import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from './axios';

let socketInstance = null;
let socketAuthToken = null;
const reconnectListeners = new Set();

export const onSocketReconnect = (callback) => {
  if (typeof callback === 'function') {
    reconnectListeners.add(callback);
    return () => reconnectListeners.delete(callback);
  }
  return () => {};
};

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

    if (__DEV__) {
      console.info('[CampusRide Network] Socket origin', socketServerUrl);
    }

    socketAuthToken = cleanToken;
    socketInstance = io(socketServerUrl, {
      // Polling-first is Socket.IO's most compatible negotiation path; it
      // upgrades to WebSocket when the Android/network stack permits it.
      transports: ['polling', 'websocket'],
      tryAllTransports: true,
      auth: { token: cleanToken },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      randomizationFactor: 0.3,
      timeout: 10000,
    });

    socketInstance.on("connect", () => {
      console.log("🟢 Authenticated Socket Connected:", {
        id: socketInstance.id,
        transport: socketInstance.io.engine?.transport?.name || 'unknown',
      });
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // The server forcibly disconnected the socket (e.g. auth revoked), try reconnecting manually
        socketInstance.connect();
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection notice:", {
        origin: socketServerUrl,
        message: err.message,
        description: err.description || null,
        transport: socketInstance.io.engine?.transport?.name || 'unavailable',
      });
    });

    socketInstance.io.on("reconnect_attempt", (attempt) => {
      if (__DEV__) {
        console.info('[CampusRide Network] Socket reconnect attempt', {
          attempt,
          origin: socketServerUrl,
        });
      }
    });

    // In Socket.IO v4 client, the Manager emits 'reconnect' on socketInstance.io
    socketInstance.io.on("reconnect", (attempt) => {
      console.log(`🟢 Socket Reconnected successfully after attempt #${attempt}`);
      reconnectListeners.forEach((listener) => {
        try {
          listener(attempt);
        } catch (e) {
          console.error("Error in socket reconnect listener:", e);
        }
      });
    });
  } else if (socketInstance) {
    // If instance exists but token or connection state needs update
    const tokenChanged = socketAuthToken !== cleanToken;
    socketAuthToken = cleanToken;
    socketInstance.auth = { token: cleanToken };
    if (tokenChanged && socketInstance.connected) {
      // Re-authenticate the transport after an account/session change.
      socketInstance.disconnect().connect();
    } else if (!socketInstance.connected) {
      socketInstance.connect();
    }
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    reconnectListeners.clear();
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    socketAuthToken = null;
  }
};
