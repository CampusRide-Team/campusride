import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fonts, radii, spacing, typography } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';

export const MatchingWorkspace = ({
  rideMode = 'solo',
  onPressCancelRequest,
  onPressEditPickup,
  bottomInset = 16,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Indeterminate progress bar animation matching Bolt Reference Image 1
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [progressAnim]);

  const progressTranslate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 320],
  });

  return (
    <View style={[styles.overlay, style]} pointerEvents="box-none">
      {/* Transparent map spacer above sheet */}
      <View style={styles.mapSpacer} pointerEvents="none" />

      {/* Bolt-Style "Ride requested" Bottom Sheet matching Reference Image 1 */}
      <View
        style={[
          styles.bottomSheet,
          {
            paddingBottom: Math.max(bottomInset, 20),
            backgroundColor: colors.surface.base,
            borderTopColor: colors.border.subtle,
          },
        ]}
      >
        {/* Grab Handle */}
        <View style={styles.grabBar} />

        {/* Title & Subtitle */}
        <Text style={[styles.title, { color: colors.text.primary }]}>Ride requested</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Finding drivers nearby</Text>

        {/* Theme Primary Linear Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.brand.primary,
                transform: [{ translateX: progressTranslate }],
              },
            ]}
          />
        </View>

        {/* Circular Action Buttons Row: Edit pickup | Cancel ride */}
        <View style={styles.actionRow}>
          {/* 1. Edit Pickup */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={onPressEditPickup}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Edit pickup"
          >
            <View style={[styles.actionCircle, { backgroundColor: colors.surface.tile || '#F3F4F6' }]}>
              <CRIcon name="location" size={24} color={colors.text.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text.primary }]}>Edit pickup</Text>
          </TouchableOpacity>

          {/* 2. Cancel Ride */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={onPressCancelRequest}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Cancel ride"
          >
            <View style={[styles.actionCircle, { backgroundColor: colors.surface.tile || '#F3F4F6' }]}>
              <CRIcon family="MaterialCommunityIcons" name="car-off" size={24} color={colors.text.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text.primary }]}>Cancel ride</Text>
          </TouchableOpacity>
        </View>

        {/* Section: News & highlights */}
        <View style={styles.newsSection}>
          <Text style={[styles.newsHeader, { color: colors.text.primary }]}>News & highlights</Text>
          <View
            style={[
              styles.newsCard,
              {
                backgroundColor: colors.surface.tile || '#F9FAFB',
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <View style={[styles.newsIconWrap, { backgroundColor: colors.brand.primaryTint }]}>
              <CRIcon name="shield-checkmark" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.newsCopy}>
              <Text style={[styles.newsTitle, { color: colors.text.primary }]}>
                Campus Security Monitored
              </Text>
              <Text style={[styles.newsSub, { color: colors.text.secondary }]}>
                All active CampusRide trips are verified with the Legon security patrol desk.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: 'flex-end',
  },
  mapSpacer: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  grabBar: {
    width: 44,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -0.4,
    color: '#111827',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  progressTrack: {
    height: 3.5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginVertical: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 90,
    borderRadius: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.xl,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  newsSection: {
    marginTop: 20,
  },
  newsHeader: {
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm + 2,
  },
  newsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsCopy: {
    flex: 1,
  },
  newsTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  newsSub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 16,
  },
});

export default MatchingWorkspace;
