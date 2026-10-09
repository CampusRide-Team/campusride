import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography, fonts } from '../../theme';
import { CRButton, CRIcon } from '../common';

export const LocationConfirmationWorkspace = ({
  pickupLocation,
  dropoffLocation,
  onConfirmLocations,
  onAdjustOnMap,
  onEditPickup,
  onEditDestination,
  onPressBack,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* 1. Grab Bar */}
      <View style={styles.grabBar} />

      {/* 2. Header Row with Back button */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onPressBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to search"
        >
          <CRIcon name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Route Points</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 3. Structured Location Route Card */}
      <View style={styles.routeCard}>
        {/* Pickup Row */}
        <TouchableOpacity
          style={styles.locationRow}
          onPress={onEditPickup}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Edit pickup"
        >
          <View style={styles.pickupDot} />
          <View style={styles.locationDetails}>
            <Text style={styles.locationLabel}>PICKUP</Text>
            <Text style={styles.locationName} numberOfLines={1}>
              {pickupLocation?.name || 'Current Location'}
            </Text>
          </View>
          <CRIcon name="pencil-outline" size={16} color={colors.text.muted} />
        </TouchableOpacity>

        <View style={styles.routeConnectorLine} />

        {/* Dropoff Row */}
        <TouchableOpacity
          style={styles.locationRow}
          onPress={onEditDestination}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Edit destination"
        >
          <View style={styles.dropoffDot} />
          <View style={styles.locationDetails}>
            <Text style={styles.locationLabel}>DESTINATION</Text>
            <Text style={styles.locationName} numberOfLines={1}>
              {dropoffLocation?.name || 'Select Destination'}
            </Text>
          </View>
          <CRIcon name="pencil-outline" size={16} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      {/* 4. Action Buttons */}
      <View style={styles.actionsContainer}>
        <CRButton
          title="Confirm Location"
          onPress={onConfirmLocations}
          variant="primary"
          size="large"
          disabled={!pickupLocation?.coordinates || !dropoffLocation?.coordinates}
          style={styles.confirmButton}
        />

        <TouchableOpacity
          style={styles.adjustButton}
          onPress={onAdjustOnMap}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Adjust on Map"
        >
          <CRIcon
            name="map-outline"
            size={18}
            color={colors.brand.primary}
            style={styles.adjustIcon}
          />
          <Text style={styles.adjustText}>Adjust on Map</Text>
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
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: typography.size.bodyLarge,
    color: colors.text.primary,
  },
  routeCard: {
    backgroundColor: colors.surface.base,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    marginBottom: spacing.md,
    position: 'relative',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand.primary,
    marginRight: spacing.sm,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.text.primary,
    marginRight: spacing.sm,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.text.muted,
    letterSpacing: 0.8,
  },
  locationName: {
    fontFamily: fonts.semiBold,
    fontSize: typography.size.bodyMedium,
    color: colors.text.primary,
    marginTop: 1,
  },
  routeConnectorLine: {
    position: 'absolute',
    left: 20,
    top: 32,
    bottom: 32,
    width: 1.5,
    backgroundColor: colors.border.subtle,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  confirmButton: {
    width: '100%',
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.surface.base,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
  },
  adjustIcon: {
    marginRight: spacing.xs,
  },
  adjustText: {
    fontFamily: fonts.bold,
    fontSize: typography.size.bodyMedium,
    color: colors.text.primary,
  },
});

export default LocationConfirmationWorkspace;
