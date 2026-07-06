import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// LIVE BACKEND ROUTING ENGINE
const getBaseUrl = () => {
  if (__DEV__) {
    // Android Emulator bridges on loopback 10.0.2.2, iOS Simulator handles localhost cleanly
    return Platform.OS === "android"
      ? "http://10.0.2.2:5000/api/v1"
      : "http://localhost:5000/api/v1";
  }
  return "https://your-live-backend-url.university.edu/api/v1";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Injects active JWT token structures into header signatures
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error(
        "Failed to retrieve authentication token from storage:",
        error
      );
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catches server eviction flags and safely resets session bounds
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await AsyncStorage.multiRemove(["token", "user"]);
        console.warn(
          "Session expired or unauthorized. Cleared local auth state caches."
        );
      } catch (clearError) {
        console.error(
          "Failed to flush storage keys on session eviction:",
          clearError
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;
