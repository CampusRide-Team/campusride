import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { fonts, radii, spacing, elevation } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';

export const ActivityEmptyState = ({ onBookRide }) => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.surface.elevated,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <CRIcon name="car-outline" size={32} color={colors.text.muted} />
      </View>

      <Text style={[styles.title, { color: colors.text.primary }]}>No rides yet</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Your completed rides and past requests will appear here.
      </Text>

      {onBookRide && (
        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: colors.brand.primary }]}
          onPress={onBookRide}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Book a Ride"
        >
          <Text style={[styles.bookButtonText, { color: colors.brand.onGoldText }]}>
            Book a Ride
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl * 1.5,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.manrope.extraBold,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.manrope.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
    marginBottom: spacing.lg,
  },
  bookButton: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.level2,
  },
  bookButtonText: {
    fontSize: 13,
    fontFamily: fonts.manrope.extraBold,
    fontWeight: '800',
  },
});

export default ActivityEmptyState;
