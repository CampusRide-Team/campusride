import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import { spacing, fonts, radii } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';
import { API_BASE_URL } from '../../api/axios';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export const PassengerMapOverlays = ({
  user,
  onPressProfile,
  onPressNotifications,
  onPressRecenter,
  showTopBar = true,
  showRecenter = true,
  recenterBottomOffset = 180,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const avatarUri = resolveMediaUrl(user?.avatarUri || user?.avatarUrl, API_BASE_URL);

  return (
    <View style={[styles.overlayContainer, style]} pointerEvents="box-none">
      {/* 1. Top Header Controls: User Avatar at Top-Left (matching Reference Image 1) & Notifications at Top-Right */}
      {showTopBar && (
        <View style={styles.topBar} pointerEvents="box-none">
          {/* Left Action: User Avatar */}
          <TouchableOpacity
            style={[
              styles.avatarButton,
              {
                borderColor: colors.border.subtle,
                backgroundColor: colors.surface.base,
              },
            ]}
            onPress={onPressProfile}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.surface.tile || '#F3F3F1' }]}>
                <CRIcon name="person-outline" size={20} color={colors.text.primary} />
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1 }} pointerEvents="none" />

          {/* Right Action: Notifications Bell */}
          <View style={styles.topRightActions} pointerEvents="box-none">
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.surface.base,
                  borderColor: colors.border.subtle,
                },
              ]}
              onPress={onPressNotifications || onPressProfile}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <CRIcon name="notifications-outline" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2. Floating Recenter FAB */}
      {showRecenter && (
        <View
          style={[styles.recenterWrap, { bottom: recenterBottomOffset }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={[
              styles.recenterButton,
              {
                backgroundColor: colors.surface.base,
                borderColor: colors.border.subtle,
              },
            ]}
            onPress={onPressRecenter}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Recenter Map"
          >
            <CRIcon
              name="locate"
              size={22}
              color={colors.brand.primary}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  brandIcon: {
    width: 24,
    height: 24,
  },
  brandText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenterWrap: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 10,
  },
  recenterButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PassengerMapOverlays;
