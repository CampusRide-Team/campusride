import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radii, spacing } from '../../theme';

export const CRInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  isPhone = false,
  isSearch = false,
  leadingIcon,
  trailingIcon,
  style,
  inputStyle,
  disabled = false,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPasswordToggle = secureTextEntry;
  const isActualSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedContainer,
          Boolean(error) && styles.errorContainer,
          disabled && styles.disabledContainer,
        ]}
      >
        {isPhone ? (
          <View style={styles.phonePrefixWrap}>
            <Text style={styles.flagEmoji}>🇬🇭</Text>
            <Text style={styles.prefixText}>+233</Text>
            <View style={styles.prefixDivider} />
          </View>
        ) : null}

        {isSearch && !isPhone ? (
          <Ionicons
            name="search-outline"
            size={20}
            color={isFocused ? colors.brand.primary : colors.text.muted}
            style={styles.leadingIcon}
          />
        ) : null}

        {leadingIcon && !isPhone && !isSearch ? (
          <View style={styles.leadingIconWrap}>{leadingIcon}</View>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          secureTextEntry={isActualSecure}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, isPhone && styles.phoneInput, inputStyle]}
          {...rest}
        />

        {showPasswordToggle ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.trailingAction}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        ) : null}

        {trailingIcon && !showPasswordToggle ? (
          <View style={styles.trailingAction}>{trailingIcon}</View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={colors.semantic.danger} style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.surface.base,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.sm,
  },
  focusedContainer: {
    borderColor: colors.brand.primary,
  },
  errorContainer: {
    borderColor: colors.semantic.danger,
  },
  disabledContainer: {
    backgroundColor: colors.surface.disabled,
    borderColor: colors.border.disabled,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: typography.size.bodyLarge,
    color: colors.text.primary,
  },
  phonePrefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  prefixText: {
    fontSize: typography.size.bodyLarge,
    fontWeight: typography.weight.semiBold,
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  prefixDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border.subtle,
    marginRight: spacing.xs,
  },
  phoneInput: {
    letterSpacing: 1,
  },
  leadingIcon: {
    marginRight: spacing.xs,
  },
  leadingIconWrap: {
    marginRight: spacing.xs,
  },
  trailingAction: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  errorIcon: {
    marginRight: 4,
  },
  errorText: {
    fontSize: typography.size.caption,
    color: colors.semantic.danger,
    fontWeight: typography.weight.medium,
  },
});

export default CRInput;
