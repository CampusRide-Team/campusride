import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/axios";

const AuthContext = createContext(null);

// Canonical role normalizer (maps legacy 'student' or 'rider' to 'passenger')
export const normalizeRole = (role) => {
  if (!role) return null;
  const lower = role.toLowerCase().trim();
  if (lower === 'student' || lower === 'rider') return 'passenger';
  return lower;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session Hydration Lifecycle: Auto-logins users if a persistent token exists on launch
  useEffect(() => {
    const hydrateAuthSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token") ||
                            await AsyncStorage.getItem("user_token") ||
                            await AsyncStorage.getItem("passenger_token") ||
                            await AsyncStorage.getItem("driver_token") ||
                            await AsyncStorage.getItem("auth_token");

        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const normalizedUser = {
            ...parsedUser,
            role: normalizeRole(parsedUser.role)
          };

          const cleanToken = storedToken.replace(/^["']|["']$/g, '').trim().replace(/^Bearer\s+/i, '');
          setToken(cleanToken);
          setUser(normalizedUser);

          // Seed the axios authorization header manually for this session instance
          api.defaults.headers.common["Authorization"] = `Bearer ${cleanToken}`;
        }
      } catch (error) {
        console.error("Failed to hydrate persistent local authentication session:", error);
      } finally {
        setLoading(false);
      }
    };

    hydrateAuthSession();
  }, []);

  // Complete Login Routine
  const login = async (userData, authToken) => {
    try {
      const cleanToken = authToken.replace(/^["']|["']$/g, '').trim().replace(/^Bearer\s+/i, '');
      const normalizedUser = {
        ...userData,
        role: normalizeRole(userData.role)
      };

      await AsyncStorage.setItem("token", cleanToken);
      await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));

      api.defaults.headers.common["Authorization"] = `Bearer ${cleanToken}`;

      setUser(normalizedUser);
      setToken(cleanToken);
    } catch (error) {
      console.error("Failed to commit user session tokens to persistent storage:", error);
      throw error;
    }
  };

  // Complete Logout Routine
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "user",
        "user_token",
        "passenger_token",
        "driver_token",
        "auth_token"
      ]);
      delete api.defaults.headers.common["Authorization"];

      setUser(null);
      setToken(null);
    } catch (error) {
      console.error("Failed to cleanly evict authentication keys during session termination:", error);
    }
  };

  const isLoggedIn = !!token;
  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{ user, token, role, isLoggedIn, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

export default AuthContext;

