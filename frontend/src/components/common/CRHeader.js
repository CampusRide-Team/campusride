import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

export const CRHeader = ({
  title,
  onBack,
  rightAction,
  showLogo = false,
  style,
}) => {
  return (
    <View style={[styles.headerContainer, style]}>
      <View style={styles.leftSlot}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.centerSlot}>
        {showLogo ? (
          <Image
            source={require('../../../assets/brand/wordmark_transparent.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible={false}
            importantForAccessibility="no"
          />
        ) : title ? (
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightSlot}>{rightAction || null}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
  },
  leftSlot: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.base,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  titleText: {
    fontSize: typography.size.titleMedium,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  logo: {
    width: 156,
    height: 36,
  },
});

export default CRHeader;
