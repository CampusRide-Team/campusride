import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, radii, elevation, iconSizes, motion } from '../theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    const loadGlobalTheme = async () => {
      try {
        const localDark = await AsyncStorage.getItem('@campusride_dark_enabled');
        if (localDark !== null) setDarkModeEnabled(JSON.parse(localDark));
      } catch (err) {
        console.error('Failed to load theme preference from storage:', err);
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

  // Canonical CampusRide theme tokens
  const currentTheme = {
    colors,
    typography,
    spacing,
    radii,
    elevation,
    iconSizes,
    motion,
    // Backward compatibility aliases
    background: colors.brand.baseBackground,
    cardBackground: colors.surface.base,
    mainText: colors.text.primary,
    subText: colors.text.secondary,
    borderColor: colors.border.subtle,
    iconWrap: colors.brand.primaryTint,
    iconColor: colors.brand.primary,
    statusBar: 'dark',
    tabBarBorder: colors.border.subtle,
  };

  return (
    <ThemeContext.Provider value={{ darkModeEnabled, toggleGlobalTheme, theme: currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;