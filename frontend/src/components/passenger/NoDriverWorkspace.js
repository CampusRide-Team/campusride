import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography, fonts } from '../../theme';
import { CRButton, CRIcon } from '../common';

export const NoDriverWorkspace = ({
  onPressTryAgain,
  onPressCancelRequest,
  isRetrying = false,
  pickupLocationName = 'Pickup',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* 1. Grab Bar */}
      <View style={styles.grabBar} />

      {/* 2. Header Status */}
      <View style={styles.statusHeader}>
        <View style={styles.statusIconWrap}>
          <CRIcon name="car-outline" size={24} color={colors.semantic.warning} />
        </View>
        <View style={styles.statusTextWrap}>
          <Text style={styles.statusTitle}>No drivers available right now</Text>
          <Text style={styles.statusSubtitle}>
            We couldn't find an available driver for this request.
          </Text>
        </View>
      </View>

      {/* 3. Preserved Context Card */}
      <View style={styles.contextCard}>
        <View style={styles.contextRow}>
          <View style={styles.pickupDot} />
          <Text style={styles.contextText} numberOfLines={1}>
            Pickup · <Text style={styles.boldText}>{pickupLocationName}</Text>
          </Text>
        </View>
      </View>

      {/* 4. Action Buttons */}
      <View style={styles.actionsContainer}>
        {/* Try Again (Redispatches existing booking) */}
        <CRButton
          title="Try Again"
          onPress={onPressTryAgain}
          variant="primary"
          size="large"
          loading={isRetrying}
          style={styles.tryAgainButton}
        />

        {/* Cancel Request */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onPressCancelRequest}
          disabled={isRetrying}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cancel ride request"
        >
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 118, 31, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontFamily: fonts.bold,
    fontSize: typography.size.bodyLarge,
    color: colors.text.primary,
  },
  statusSubtitle: {
    fontFamily: fonts.regular,
    fontSize: typography.size.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  contextCard: {
    backgroundColor: colors.surface.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
    marginRight: spacing.sm,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.primary,
    marginRight: spacing.sm,
  },
  contextText: {
    fontFamily: fonts.medium,
    fontSize: typography.size.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  boldText: {
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  contextDivider: {
    height: 1,
    backgroundColor: colors.border.divider,
    marginVertical: spacing.xs + 2,
  },
  actionsContainer: {
    gap: spacing.xs,
  },
  tryAgainButton: {
    width: '100%',
  },
  cancelButton: {
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: typography.size.bodyMedium,
    color: colors.text.secondary,
  },
});

export default NoDriverWorkspace;
