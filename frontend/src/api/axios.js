import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  // ALWAYS double-check this matches your active Ports tab domain!
  baseURL: "https://orange-fiesta-wrrvpqgqgxw53x65-5000.app.github.dev/",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Automatically handles sub-paths and attaches JWT tokens
// Request Interceptor: Automatically handles sub-paths cleanly
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Strip out any existing leading "/api/v1" or "/" to normalize the path
      let cleanUrl = config.url || "";
      if (cleanUrl.startsWith("/api/v1")) {
        cleanUrl = cleanUrl.replace("/api/v1", "");
      }
      if (cleanUrl.startsWith("/")) {
        cleanUrl = cleanUrl.substring(1);
      }

      // 2. Set the clean, unified path with the /api/v1 prefix
      config.url = `/api/v1/${cleanUrl}`;

      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Failed to retrieve token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;