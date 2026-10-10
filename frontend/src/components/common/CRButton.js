import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, typography, radii, spacing, fonts } from '../../theme';

export const CRButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'destructive' | 'ghost'
  size = 'large',       // 'large' | 'medium' | 'small'
  disabled = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  style,
  textStyle,
  ...rest
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'destructive':
        return styles.destructiveContainer;
      case 'ghost':
        return styles.ghostContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'destructive':
        return styles.destructiveText;
      case 'ghost':
        return styles.ghostText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallSize;
      case 'medium':
        return styles.mediumSize;
      case 'large':
      default:
        return styles.largeSize;
    }
  };

  const spinnerColor = variant === 'primary' ? colors.brand.onGoldText : colors.brand.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseContainer,
        getContainerStyle(),
        getSizeStyle(),
        disabled && styles.disabledContainer,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.contentRow}>
          {leadingIcon ? <View style={styles.leadingIconWrap}>{leadingIcon}</View> : null}
          {title ? (
            <Text style={[styles.baseText, getTextStyle(), disabled && styles.disabledText, textStyle]}>
              {title}
            </Text>
          ) : null}
          {trailingIcon ? <View style={styles.trailingIconWrap}>{trailingIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingIconWrap: {
    marginRight: spacing.xs,
  },
  trailingIconWrap: {
    marginLeft: spacing.xs,
  },
  largeSize: {
    height: 54,
    paddingHorizontal: spacing.xl,
    minWidth: 48,
  },
  mediumSize: {
    height: 46,
    paddingHorizontal: spacing.lg,
    minWidth: 48,
  },
  smallSize: {
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    minWidth: 48,
  },
  primaryContainer: {
    backgroundColor: colors.brand.primary,
  },
  secondaryContainer: {
    backgroundColor: colors.surface.base,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
  },
  destructiveContainer: {
    backgroundColor: colors.semantic.dangerTint,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  disabledContainer: {
    backgroundColor: colors.surface.disabled,
    borderColor: colors.border.disabled,
  },
  baseText: {
    fontFamily: fonts.bold,
    fontSize: typography.size.bodyLarge,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
  primaryText: {
    color: colors.brand.onGoldText,
  },
  secondaryText: {
    color: colors.text.primary,
  },
  destructiveText: {
    color: colors.semantic.danger,
  },
  ghostText: {
    color: colors.brand.primary,
  },
  disabledText: {
    color: colors.text.disabled,
  },
});

export default CRButton;
