import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, elevation } from '../../theme';

export const CRCard = ({
  children,
  variant = 'base', // 'base' | 'elevated' | 'selected'
  style,
  onPress,
  ...rest
}) => {
  const isInteractive = typeof onPress === 'function';
  const CardComponent = isInteractive ? TouchableOpacity : View;

  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevatedCard;
      case 'selected':
        return styles.selectedCard;
      case 'base':
      default:
        return styles.baseCard;
    }
  };

  return (
    <CardComponent
      activeOpacity={isInteractive ? 0.85 : 1}
      onPress={onPress}
      style={[styles.card, getVariantStyle(), style]}
      {...rest}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    padding: spacing.md,
    ...elevation.level1,
  },
  baseCard: {
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  elevatedCard: {
    backgroundColor: colors.surface.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...elevation.level2,
  },
  selectedCard: {
    backgroundColor: colors.surface.elevated,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    ...elevation.level2,
  },
});

export default CRCard;
