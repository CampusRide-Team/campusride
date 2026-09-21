import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Resolves base API URL dynamically from environment or local development fallback
export const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Local development default fallback (10.0.2.2 for Android emulator, localhost for iOS/Web)
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      let cleanUrl = config.url || "";
      if (cleanUrl.startsWith("/api/v1")) {
        cleanUrl = cleanUrl.replace("/api/v1", "");
      }
      if (cleanUrl.startsWith("/")) {
        cleanUrl = cleanUrl.substring(1);
      }

      config.url = `/api/v1/${cleanUrl}`;

      // Check all possible storage keys for the auth token
      const rawToken = await AsyncStorage.getItem("token") || 
                       await AsyncStorage.getItem("user_token") || 
                       await AsyncStorage.getItem("passenger_token") || 
                       await AsyncStorage.getItem("driver_token") || 
                       await AsyncStorage.getItem("auth_token");
                       
      if (rawToken) {
        // Sanitize token: remove wrapping quotes and any accidental "Bearer " prefix
        const cleanToken = rawToken.replace(/^["']|["']$/g, '').trim().replace(/^Bearer\s+/i, '');
        config.headers.Authorization = `Bearer ${cleanToken}`;
      }
    } catch (error) {
      console.error("Failed to retrieve token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;