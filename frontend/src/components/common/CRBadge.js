import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radii, spacing } from '../../theme';

export const CRBadge = ({
  label,
  variant = 'info', // 'success' | 'warning' | 'danger' | 'info' | 'gold'
  icon,
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successContainer;
      case 'warning':
        return styles.warningContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'gold':
        return styles.goldContainer;
      case 'info':
      default:
        return styles.infoContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successText;
      case 'warning':
        return styles.warningText;
      case 'danger':
        return styles.dangerText;
      case 'gold':
        return styles.goldText;
      case 'info':
      default:
        return styles.infoText;
    }
  };

  return (
    <View style={[styles.badge, getContainerStyle(), style]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={[styles.badgeText, getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
  },
  iconWrap: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
  },
  successContainer: {
    backgroundColor: colors.semantic.successTint,
  },
  successText: {
    color: colors.semantic.success,
  },
  warningContainer: {
    backgroundColor: colors.semantic.warningTint,
  },
  warningText: {
    color: colors.semantic.warning,
  },
  dangerContainer: {
    backgroundColor: colors.semantic.dangerTint,
  },
  dangerText: {
    color: colors.semantic.danger,
  },
  infoContainer: {
    backgroundColor: colors.semantic.infoTint,
  },
  infoText: {
    color: colors.semantic.info,
  },
  goldContainer: {
    backgroundColor: colors.brand.primaryTint,
  },
  goldText: {
    color: colors.brand.primary,
  },
});

export default CRBadge;
