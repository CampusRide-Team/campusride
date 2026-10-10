import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, getThemeColors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import spacing from '../theme/spacing';
import radii from '../theme/radii';
import elevation from '../theme/elevation';
import iconSizes from '../theme/icons';
import motion from '../theme/motion';

const THEME_STORAGE_KEY = '@campusride_theme_preference';

const ThemeContext = createContext({
  themeMode: 'system',
  isDark: false,
  setThemeMode: () => {},
  theme: {
    colors: lightColors,
    typography,
    fonts,
    spacing,
    radii,
    elevation,
    iconSizes,
    motion,
    isDark: false,
    themeMode: 'system',
  },
});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null | undefined
  const [themeMode, setThemeModeState] = useState('system'); // 'system' | 'light' | 'dark'
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedMode && ['system', 'light', 'dark'].includes(storedMode)) {
          setThemeModeState(storedMode);
        } else {
          // Backward compatibility check for legacy boolean key
          const legacyDark = await AsyncStorage.getItem('@campusride_dark_enabled');
          if (legacyDark !== null) {
            setThemeModeState(JSON.parse(legacyDark) ? 'dark' : 'light');
          }
        }
      } catch (err) {
        console.warn('Failed to load theme preference from storage:', err.message);
      } finally {
        setIsHydrated(true);
      }
    };

    loadStoredTheme();
  }, []);

  const setThemeMode = async (mode) => {
    if (!['system', 'light', 'dark'].includes(mode)) return;
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('Failed to persist theme preference:', err.message);
    }
  };

  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const activeColors = getThemeColors(isDark);

  const theme = {
    colors: activeColors,
    typography,
    fonts,
    spacing,
    radii,
    elevation,
    iconSizes,
    motion,
    isDark,
    themeMode,
    // Backward compatibility aliases
    background: activeColors.brand.baseBackground,
    cardBackground: activeColors.surface.base,
    mainText: activeColors.text.primary,
    subText: activeColors.text.secondary,
    borderColor: activeColors.border.subtle,
    iconWrap: activeColors.brand.primaryTint,
    iconColor: activeColors.brand.primary,
    statusBar: isDark ? 'light' : 'dark',
    tabBarBorder: activeColors.border.subtle,
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        setThemeMode,
        theme,
        darkModeEnabled: isDark, // legacy compatibility
        toggleGlobalTheme: (val) => setThemeMode(val ? 'dark' : 'light'), // legacy compatibility
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;