import React, { useState } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { fonts, spacing } from '../../theme';
import { CRIcon } from '../../components/common';
import { appConfig } from '../../config/appConfig';
import LogoutConfirmationModal from '../../components/passenger/LogoutConfirmationModal';
import { API_BASE_URL } from '../../api/axios';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fullName = user?.fullName?.trim() || 'Campus Passenger';
  const phoneNumber = user?.phoneNumber?.trim() || null;
  const avatarUri = resolveMediaUrl(user?.avatarUri || user?.avatarUrl, API_BASE_URL);
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'CP';

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } catch (err) {
      console.warn('Logout failed:', err.message);
    } finally {
      setLoggingOut(false);
      setLogoutModalVisible(false);
    }
  };

  const quickActions = [
    { label: 'Rides', icon: 'time-outline', onPress: () => navigation.navigate('ActivityTab') },
    { label: 'Support', icon: 'headset-outline', onPress: () => navigation.navigate('HelpSupport') },
    { label: 'Safety', icon: 'shield-checkmark-outline', onPress: () => navigation.navigate('SafetyTab') },
    { label: 'Settings', icon: 'settings-outline', onPress: () => navigation.navigate('Settings') },
  ];

  const primaryGroup = [
    {
      icon: 'person-outline',
      title: 'Personal information',
      subtitle: 'Name, phone & campus ID',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'shield-outline',
      title: 'Safety Center',
      subtitle: 'Trusted contacts, emergency SOS',
      onPress: () => navigation.navigate('SafetyTab'),
    },
  ];

  const secondaryGroup = [
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'FAQs, report issues, contact dispatch',
      onPress: () => navigation.navigate('HelpSupport'),
    },
    {
      icon: 'settings-outline',
      title: 'Preferences',
      subtitle: 'Theme, notifications & privacy',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About CampusRide',
      subtitle: `Version ${appConfig.version}`,
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.surface.base }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface.base} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Account</Text>
        </View>

        {/* 1. Large Profile Avatar & Identification Header (Reference B Style) */}
        <TouchableOpacity
          style={styles.identity}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Edit profile for ${fullName}`}
        >
          <View style={[styles.avatarWrap, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <CRIcon name="camera-outline" size={34} color={colors.text.secondary} />
            )}
            <View style={[styles.avatarBadge, { backgroundColor: colors.brand.primary }]}>
              <CRIcon name="add" size={13} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
              {fullName}
            </Text>
            <CRIcon name="chevron-forward" size={18} color={colors.text.secondary} />
          </View>
          {phoneNumber ? (
            <Text style={[styles.phone, { color: colors.text.secondary }]}>{phoneNumber}</Text>
          ) : null}
        </TouchableOpacity>

        {/* 2. Circular Quick Actions Row (Reference B Style) */}
        <View style={styles.quickRow}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickAction}
              onPress={action.onPress}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
                <CRIcon name={action.icon} size={22} color={colors.text.primary} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.text.primary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. Grouped Light-Gray Section Cards (Reference B Style) */}
        <View style={[styles.groupedCard, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
          {primaryGroup.map((row, index) => (
            <React.Fragment key={row.title}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={row.onPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={row.title}
              >
                <View style={styles.menuIconWrap}>
                  <CRIcon name={row.icon} size={20} color={colors.text.primary} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={[styles.menuTitle, { color: colors.text.primary }]}>{row.title}</Text>
                  {row.subtitle ? (
                    <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>{row.subtitle}</Text>
                  ) : null}
                </View>
                <CRIcon name="chevron-forward" size={16} color={colors.text.muted} />
              </TouchableOpacity>
              {index < primaryGroup.length - 1 && (
                <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* 4. Second Grouped Section Card */}
        <View style={[styles.groupedCard, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
          {secondaryGroup.map((row, index) => (
            <React.Fragment key={row.title}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={row.onPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={row.title}
              >
                <View style={styles.menuIconWrap}>
                  <CRIcon name={row.icon} size={20} color={colors.text.primary} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={[styles.menuTitle, { color: colors.text.primary }]}>{row.title}</Text>
                  {row.subtitle ? (
                    <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>{row.subtitle}</Text>
                  ) : null}
                </View>
                <CRIcon name="chevron-forward" size={16} color={colors.text.muted} />
              </TouchableOpacity>
              {index < secondaryGroup.length - 1 && (
                <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* 5. Danger Logout Row in Clean Tile */}
        <View style={[styles.groupedCard, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle, marginTop: 4 }]}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Log out of CampusRide"
          >
            <View style={styles.menuIconWrap}>
              <CRIcon name="log-out-outline" size={20} color={colors.semantic.danger} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={[styles.menuTitle, { color: colors.semantic.danger }]}>Log Out</Text>
            </View>
            <CRIcon name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.version, { color: colors.text.muted }]}>
          {appConfig.appName} · v{appConfig.version}
        </Text>
      </ScrollView>

      <LogoutConfirmationModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  identity: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '85%',
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  phone: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
    paddingHorizontal: 4,
  },
  quickAction: {
    alignItems: 'center',
    width: 68,
    gap: 6,
  },
  quickIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  groupedCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  menuSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    marginLeft: 40,
  },
  version: {
    fontFamily: fonts.medium,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
