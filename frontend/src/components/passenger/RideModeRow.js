import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fonts, radii, spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';

export const RideModeRow = ({
  mode = 'solo',
  title,
  subtitle,
  seats = '1–4',
  eta = '',
  isSelected = false,
  onSelect,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const isSolo = mode === 'solo';

  const defaultTitle = isSolo ? 'Solo Ride' : 'Shared Ride';
  const defaultSubtitle = isSolo ? 'Direct and private' : 'Share with fellow students';
  const defaultSeats = isSolo ? '1–4' : '1–3';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface.base,
          borderColor: isSelected ? colors.brand.primary : colors.border.subtle,
          borderWidth: isSelected ? 2 : 1,
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onSelect}
      activeOpacity={0.82}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected, disabled }}
      accessibilityLabel={title || defaultTitle}
    >
      {/* Left Icon Wrap: Car badge with subtle warm tone */}
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: isSelected ? colors.brand.primaryTint : colors.surface.elevated },
        ]}
      >
        <CRIcon
          name={isSolo ? 'car-sport' : 'car'}
          size={24}
          color={colors.text.primary}
        />
      </View>

      {/* Middle Content: Title, Subtitle, Capacity & ETA chips */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {title || defaultTitle}
          </Text>
        </View>

        <Text style={[styles.subtitle, { color: colors.text.secondary }]} numberOfLines={1}>
          {subtitle || defaultSubtitle}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <CRIcon name="person-outline" size={11} color={colors.text.muted} />
            <Text style={[styles.metaText, { color: colors.text.muted }]}>
              {seats || defaultSeats}
            </Text>
          </View>

          {eta ? (
            <>
              <Text style={[styles.metaDot, { color: colors.text.muted }]}>•</Text>
              <View style={styles.metaChip}>
                <CRIcon name="time-outline" size={11} color={colors.text.muted} />
                <Text style={[styles.metaText, { color: colors.text.muted }]}>
                  {eta}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </View>

      {/* Right Side: Radio / Checkmark Badge */}
      <View style={styles.trailing}>
        <View
          style={[
            styles.checkIndicator,
            isSelected
              ? { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary }
              : { backgroundColor: 'transparent', borderColor: colors.border.subtle },
          ]}
        >
          {isSelected ? (
            <CRIcon name="checkmark" size={11} color={colors.brand.onGoldText} />
          ) : null}
        </View>

      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 76,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  content: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  metaDot: {
    fontSize: 10,
    marginHorizontal: 1,
  },
  trailing: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 2,
    gap: 8,
  },
  checkIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RideModeRow;
