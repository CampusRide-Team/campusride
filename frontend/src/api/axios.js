import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Resolves and normalizes base API URL dynamically from environment or local development fallback
export const getApiBaseUrl = () => {
  let url = process.env.EXPO_PUBLIC_API_URL;
  if (url && typeof url === 'string') {
    // Strip trailing /api/v1 or trailing slash to normalize base host URL
    return url.trim().replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
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

      // When sending FormData (multipart), let React Native / Axios set boundary automatically
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        if (config.headers) {
          delete config.headers['Content-Type'];
        }
      }

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

/**
 * Categorizes and formats errors into human-readable messages
 */
export const formatApiError = (err, fallbackMessage = 'An unexpected error occurred. Please try again.') => {
  if (!err) return fallbackMessage;

  // 1. Response received from backend
  if (err.response) {
    const status = err.response.status;
    const errorData = err.response.data;
    const backendCode = errorData?.error?.code || errorData?.code;
    const backendMsg = errorData?.error?.message || errorData?.message;

    if (backendCode === 'PENDING_APPROVAL') {
      return 'Driver account is pending safety verification. University of Ghana approval takes 24–48 hours.';
    }
    if (backendCode === 'ROLE_MISMATCH') {
      return backendMsg || 'This account belongs to a different role. Please switch portal.';
    }
    if (backendCode === 'ACCOUNT_SUSPENDED') {
      return 'Your account has been suspended by campus administration.';
    }
    if (backendCode === 'USER_EXISTS') {
      return 'An account with this email or phone number already exists. Please sign in.';
    }
    if (backendCode === 'AUTH_FAILED' || status === 401) {
      return 'The phone number/email or password entered is incorrect.';
    }
    if (backendCode === 'MISSING_CREDENTIALS' || backendCode === 'MISSING_FIELDS') {
      return backendMsg || 'Please fill in all required fields.';
    }
    if (status >= 500) {
      return 'CampusRide server is temporarily busy. Please try again in a few moments.';
    }
    if (backendMsg && typeof backendMsg === 'string') {
      return backendMsg;
    }
  }

  // 2. Network connectivity error (no response received)
  if (err.request || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
    return "We couldn't connect to CampusRide. Please check your internet connection and verify that your phone is on the campus/development network.";
  }

  return err.message || fallbackMessage;
};

export default api;