import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';
import { appConfig } from '../../config/appConfig';
import { fonts, spacing } from '../../theme';
import { CRIcon } from '../../components/common';

export default function SettingsScreen({ navigation }) {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { colors } = theme;
  const [notificationStatus, setNotificationStatus] = useState('Checking…');
  const [locationStatus, setLocationStatus] = useState('Checking…');

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const notificationPermission = await Notifications.getPermissionsAsync();
        setNotificationStatus(notificationPermission.granted ? 'Allowed' : 'Not allowed');
      } catch {
        setNotificationStatus('System managed');
      }

      try {
        const locationPermission = await Location.getForegroundPermissionsAsync();
        setLocationStatus(locationPermission.granted ? 'Allowed' : 'Not allowed');
      } catch {
        setLocationStatus('System managed');
      }
    };
    checkPermissions();
  }, []);

  const handleOpenDeviceSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Settings Unavailable', 'Please open your phone Settings app manually.');
    }
  };

  const handleChooseTheme = () => {
    Alert.alert('Theme', 'Choose how CampusRide should appear.', [
      { text: 'System', onPress: () => setThemeMode('system') },
      { text: 'Light', onPress: () => setThemeMode('light') },
      { text: 'Dark', onPress: () => setThemeMode('dark') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const themeLabel = themeMode === 'system'
    ? 'System'
    : themeMode === 'light'
      ? 'Light'
      : 'Dark';

  const notificationRows = [
    { icon: 'notifications-outline', title: 'Push notifications', value: notificationStatus, onPress: handleOpenDeviceSettings },
  ];

  const privacyRows = [
    { icon: 'location-outline', title: 'Location services', value: locationStatus, onPress: handleOpenDeviceSettings },
    { icon: 'shield-outline', title: 'Safety settings', onPress: () => navigation.navigate('SafetyTab') },
    { icon: 'people-outline', title: 'Trusted contacts', onPress: () => navigation.navigate('TrustedContacts') },
    { icon: 'map-outline', title: 'Add a campus place', onPress: () => navigation.navigate('AddLocation') },
  ];

  const appRows = [
    { icon: 'calendar-outline', title: 'Scheduled rides', onPress: () => navigation.navigate('ScheduledRides') },
    { icon: 'information-circle-outline', title: 'App version', value: appConfig.version },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.brand.baseBackground }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.brand.baseBackground} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <CRIcon name="arrow-back" size={21} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>Appearance</Text>
        <View style={styles.rows}>
          <SettingsRow
            icon="contrast-outline"
            title="Theme"
            value={themeLabel}
            onPress={handleChooseTheme}
            colors={colors}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>Notifications</Text>
        <View style={styles.rows}>
          {notificationRows.map((row, index) => (
            <SettingsRow key={row.title} {...row} colors={colors} showDivider={index < notificationRows.length - 1} />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>Privacy & safety</Text>
        <View style={styles.rows}>
          {privacyRows.map((row, index) => (
            <SettingsRow key={row.title} {...row} colors={colors} showDivider={index < privacyRows.length - 1} />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>App</Text>
        <View style={styles.rows}>
          {appRows.map((row, index) => (
            <SettingsRow key={row.title} {...row} colors={colors} showDivider={index < appRows.length - 1} />
          ))}
        </View>

        <TouchableOpacity style={styles.systemSettingsLink} onPress={handleOpenDeviceSettings} activeOpacity={0.75}>
          <CRIcon name="open-outline" size={16} color={colors.brand.primary} />
          <Text style={[styles.systemSettingsText, { color: colors.brand.primary }]}>Open device settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, title, value, onPress, colors, showDivider }) {
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: colors.surface.elevated }]}>
        <CRIcon name={icon} size={18} color={colors.text.primary} />
      </View>
      <Text style={[styles.rowTitle, { color: colors.text.primary }]}>{title}</Text>
      {value ? <Text style={[styles.rowValue, { color: colors.text.secondary }]}>{value}</Text> : null}
      {onPress ? <CRIcon name="chevron-forward" size={16} color={colors.text.muted} /> : null}
    </>
  );
  const rowStyle = [
    styles.settingRow,
    showDivider && { borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  ];
  return onPress ? (
    <TouchableOpacity style={rowStyle} onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>
  ) : (
    <View style={rowStyle}>{content}</View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 42 },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.extraBold, fontSize: 17 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
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
  settingRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  rowTitle: { flex: 1, fontFamily: fonts.semiBold, fontSize: 13.5 },
  rowValue: { fontFamily: fonts.medium, fontSize: 11.5, marginRight: spacing.xs },
  systemSettingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  systemSettingsText: { fontFamily: fonts.bold, fontSize: 12.5 },
});
