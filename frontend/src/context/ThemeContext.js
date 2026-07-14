import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    // Read the saved user preference from storage on app load
    const loadGlobalTheme = async () => {
      try {
        const localDark = await AsyncStorage.getItem('@campusride_dark_enabled');
        if (localDark !== null) setDarkModeEnabled(JSON.parse(localDark));
      } catch (err) {
        console.error('Failed to load theme preference from hardware memory:', err);
      }
    };
    loadGlobalTheme();
  }, []);

  const toggleGlobalTheme = async (value) => {
    setDarkModeEnabled(value);
    try {
      await AsyncStorage.setItem('@campusride_dark_enabled', JSON.stringify(value));
    } catch (err) {
      console.error('Storage update failed:', err);
    }
  };

  // Central color token mapping referenced globally
  const theme = {
    background: darkModeEnabled ? '#121824' : '#FFFFFF',
    cardBackground: darkModeEnabled ? '#1E293B' : '#FFFFFF',
    mainText: darkModeEnabled ? '#F8FAFC' : '#1E2937',
    subText: darkModeEnabled ? '#94A3B8' : '#64748B',
    borderColor: darkModeEnabled ? '#334155' : '#E2E8F0',
    iconWrap: darkModeEnabled ? '#1E3A8A' : '#EFF6FF',
    iconColor: darkModeEnabled ? '#60A5FA' : '#1E3A8A',
    statusBar: darkModeEnabled ? 'light' : 'dark',
    tabBarBorder: darkModeEnabled ? '#1E293B' : '#F1F5F9',
  };

  return (
    <ThemeContext.Provider value={{ darkModeEnabled, toggleGlobalTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);