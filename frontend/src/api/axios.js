import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "https://c5m62bwc-5000.uks1.devtunnels.ms/",
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
        console.log(`[Axios] Attached token to ${config.url} (Token preview: ${cleanToken.substring(0, 10)}...)`);
      } else {
        console.warn(`[Axios] NO TOKEN FOUND in AsyncStorage for request: ${config.url}`);
      }
    } catch (error) {
      console.error("Failed to retrieve token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;