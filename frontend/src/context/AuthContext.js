import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/axios"; // Mapped directly to your updated folder tree setup

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session Hydration Lifecycle: Auto-logins users if a persistent token exists on launch
  useEffect(() => {
    const hydrateAuthSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          // Seed the axios authorization header manually for this session instance
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error(
          "Failed to hydrate persistent local authentication session:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    hydrateAuthSession();
  }, []);

  // Complete Login Routine
  const login = async (userData, authToken) => {
    try {
      await AsyncStorage.setItem("token", authToken);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

      setUser(userData);
      setToken(authToken);
    } catch (error) {
      console.error(
        "Failed to commit user session tokens to persistent storage:",
        error
      );
      throw error;
    }
  };

  // Complete Logout Routine
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user"]);
      delete api.defaults.headers.common["Authorization"];

      setUser(null);
      setToken(null);
    } catch (error) {
      console.error(
        "Failed to cleanly evict authentication keys during session termination:",
        error
      );
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
