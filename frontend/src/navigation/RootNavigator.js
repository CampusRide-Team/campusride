import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

import AuthNavigator from './AuthNavigator';
import PassengerNavigator from './PassengerNavigator';
import DriverNavigator from './DriverNavigator';
import AccountSuspendedModal from '../context/AccountSuspendedModal';
import { colors } from '../theme';

export const RootNavigator = () => {
  const { isLoggedIn, role, loading, user: authUser, logout } = useAuth();
  const { theme } = useTheme();

  // Global Suspension Modal State
  const [suspendedModalVisible, setSuspendedModalVisible] = useState(false);
  const [attemptedEmail, setAttemptedEmail] = useState('');

  // Global Axios Interceptor for 403 ACCOUNT_SUSPENDED
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorCode = error.response?.data?.error?.code;
        if (errorCode === 'ACCOUNT_SUSPENDED') {
          setAttemptedEmail(
            error.config?.data
              ? JSON.parse(error.config.data)?.email || authUser?.email || ''
              : authUser?.email || ''
          );
          setSuspendedModalVisible(true);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [authUser]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
        {!isLoggedIn ? (
          <AuthNavigator />
        ) : role === 'driver' ? (
          <DriverNavigator />
        ) : (
          <PassengerNavigator />
        )}

        <AccountSuspendedModal
          visible={suspendedModalVisible}
          userEmail={attemptedEmail}
          onClose={() => {
            setSuspendedModalVisible(false);
            logout();
          }}
        />
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.brand.baseBackground,
  },
});

export default RootNavigator;
