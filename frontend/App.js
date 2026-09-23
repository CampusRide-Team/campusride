import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Google Fonts - Manrope
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

// Context Providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { RideProvider } from './src/context/RideContext';

// Navigation Router
import RootNavigator from './src/navigation/RootNavigator';
import api from './src/api/axios';
import { colors } from './src/theme';

// Configure foreground push notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// App Bootstrapper with Push Token Handshake
const AppContent = () => {
  const { role, token: authToken, user: authUser } = useAuth();

  const registerForPushNotificationsAsync = async () => {
    let pushToken = null;
    try {
      if (!Device.isDevice) return;

      const appConfig = require('./app.json');
      const projectId = appConfig?.expo?.extra?.eas?.projectId;
      if (!projectId) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
      pushToken = tokenResult.data;
    } catch (err) {
      console.warn('[Push] Push registration notice:', err.message);
      return;
    }

    if (pushToken) {
      try {
        await api.put('/driver/profile', { expoPushToken: pushToken });
      } catch (backendErr) {
        console.error('[Push] Could not write token to backend:', backendErr.message);
      }
    }
  };

  useEffect(() => {
    if (authToken && authUser && role === 'driver') {
      registerForPushNotificationsAsync();
    }
  }, [authToken, role]);

  return <RootNavigator />;
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <RideProvider>
            <AppContent />
          </RideProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.brand.baseBackground,
  },
});