import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';
import { fonts, radii, spacing } from '../../theme';
import { CRIcon } from '../../components/common';
import { appConfig } from '../../config/appConfig';
import api from '../../api/axios';

const STORAGE_KEYS = {
  PUSH: '@campusride_push_enabled',
  EMAIL: '@campusride_email_enabled',
};

export default function DriverSettings({ onBack, onNavigate }) {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { colors } = theme;

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Checking…');
  const [notificationStatus, setNotificationStatus] = useState('Checking…');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [localPush, localEmail] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PUSH),
          AsyncStorage.getItem(STORAGE_KEYS.EMAIL),
        ]);

        if (localPush !== null) setPushEnabled(JSON.parse(localPush));
        if (localEmail !== null) setEmailEnabled(JSON.parse(localEmail));
      } catch (err) {
        console.warn('Failed to load driver settings:', err.message);
      }

      try {
        const notif = await Notifications.getPermissionsAsync();
        setNotificationStatus(notif.granted ? 'Allowed' : 'Not allowed');
      } catch {
        setNotificationStatus('System managed');
      }

      try {
        const loc = await Location.getForegroundPermissionsAsync();
        setLocationStatus(loc.granted ? 'Allowed' : 'Not allowed');
      } catch {
        setLocationStatus('System managed');
      }
    };

    loadSettings();
  }, []);

  const syncPreferencesWithBackend = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      await api.patch('/driver/profile/preferences', {
        preferences: {
          pushNotifications: key === STORAGE_KEYS.PUSH ? value : pushEnabled,
          emailNotifications: key === STORAGE_KEYS.EMAIL ? value : emailEnabled,
          darkMode: isDark,
        },
      });
    } catch (err) {
      console.warn('Preference sync notice:', err.message);
    }
  };

  const handlePushToggle = async (value) => {
    setPushEnabled(value);
    await syncPreferencesWithBackend(STORAGE_KEYS.PUSH, value);
  };

  const handleEmailToggle = async (value) => {
    setEmailEnabled(value);
    await syncPreferencesWithBackend(STORAGE_KEYS.EMAIL, value);
  };

  const handleChooseTheme = () => {
    Alert.alert('Theme', 'Choose how CampusRide Driver should appear.', [
      { text: 'System', onPress: () => setThemeMode('system') },
      { text: 'Light', onPress: () => setThemeMode('light') },
      { text: 'Dark', onPress: () => setThemeMode('dark') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleOpenDeviceSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Settings Unavailable', 'Please open your phone Settings app manually.');
    }
  };

  const themeLabel = themeMode === 'system'
    ? 'System'
    : themeMode === 'light'
      ? 'Light'
      : 'Dark';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.brand.baseBackground }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.brand.baseBackground}
      />

      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={[styles.backButton, { backgroundColor: colors.surface.elevated }]}
          >
            <CRIcon name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <Text style={[styles.sectionHeading, { color: colors.text.secondary }]}>APPEARANCE</Text>
        <View style={styles.rows}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleChooseTheme}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.surface.elevated }]}>
              <CRIcon name="contrast-outline" size={18} color={colors.text.primary} />
            </View>
            <Text style={[styles.rowTitle, { color: colors.text.primary }]}>Theme</Text>
            <Text style={[styles.rowValue, { color: colors.text.secondary }]}>{themeLabel}</Text>
            <CRIcon name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <Text style={[styles.sectionHeading, { color: colors.text.secondary }]}>NOTIFICATIONS</Text>
        <View style={styles.rows}>
          {/* Push Notifications Toggle */}
          <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: colors.border.divider }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surface.elevated }]}>
              <CRIcon name="notifications-outline" size={18} color={colors.text.primary} />
            </View>
            <View style={styles.toggleTextCol}>
              <Text style={[styles.rowTitle, { color: colors.text.primary }]}>Push Notifications</Text>
              <Text style={[styles.rowSubtitle, { color: colors.text.secondary }]}>
                Dispatch requests & ride alerts
              </Text>
            </View>
            <Switch
              trackColor={{ false: colors.border.subtle, true: colors.brand.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.border.subtle}
              onValueChange={handlePushToggle}
              value={pushEnabled}
            />
          </View>

          {/* Email Notifications Toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surface.elevated }]}>
              <CRIcon name="mail-outline" size={18} color={colors.text.primary} />
            </View>
            <View style={styles.toggleTextCol}>
              <Text style={[styles.rowTitle, { color: colors.text.primary }]}>Email Summaries</Text>
              <Text style={[styles.rowSubtitle, { color: colors.text.secondary }]}>
                Trip updates & campus news
              </Text>
            </View>
            <Switch
              trackColor={{ false: colors.border.subtle, true: colors.brand.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.border.subtle}
              onValueChange={handleEmailToggle}
              value={emailEnabled}
            />
          </View>
        </View>

        {/* Hardware & Permissions Section */}
        <Text style={[styles.sectionHeading, { color: colors.text.secondary }]}>
          HARDWARE & PERMISSIONS
        </Text>
        <View style={styles.rows}>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: colors.border.divider }]}
            onPress={handleOpenDeviceSettings}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.surface.elevated }]}>
              <CRIcon name="location-outline" size={18} color={colors.text.primary} />
            </View>
            <Text style={[styles.rowTitle, { color: colors.text.primary }]}>Location Access</Text>
            <Text style={[styles.rowValue, { color: colors.text.secondary }]}>{locationStatus}</Text>
            <CRIcon name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleOpenDeviceSettings}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.surface.elevated }]}>
              <CRIcon name="notifications-circle-outline" size={18} color={colors.text.primary} />
            </View>
            <Text style={[styles.rowTitle, { color: colors.text.primary }]}>System Notifications</Text>
            <Text style={[styles.rowValue, { color: colors.text.secondary }]}>{notificationStatus}</Text>
            <CRIcon name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <Text style={[styles.sectionHeading, { color: colors.text.secondary }]}>APPLICATION</Text>
        <View style={styles.rows}>
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surface.elevated }]}>
              <CRIcon name="information-circle-outline" size={18} color={colors.text.primary} />
            </View>
            <Text style={[styles.rowTitle, { color: colors.text.primary }]}>App Version</Text>
            <Text style={[styles.rowValue, { color: colors.text.secondary }]}>
              {appConfig.appName} · v{appConfig.version}
            </Text>
          </View>
        </View>

        {/* System Settings Shortcut */}
        <TouchableOpacity
          style={styles.systemSettingsLink}
          onPress={handleOpenDeviceSettings}
          activeOpacity={0.75}
        >
          <CRIcon name="open-outline" size={16} color={colors.brand.primary} />
          <Text style={[styles.systemSettingsText, { color: colors.brand.primary }]}>
            Open device settings
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  sectionHeading: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    marginBottom: spacing.xs + 2,
    marginTop: spacing.md,
  },
  rows: {
    backgroundColor: '#F3F3F1',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    flex: 1,
  },
  toggleTextCol: {
    flex: 1,
  },
  rowSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 1,
  },
  rowValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  systemSettingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xl,
  },
  systemSettingsText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
  },
});
