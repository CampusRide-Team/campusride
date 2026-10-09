import React from 'react';
import { Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fonts, radii, spacing, typography } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';

export const ActiveTripWorkspace = ({
  driver,
  pickupLocation,
  dropoffLocation,
  rideMode = 'solo',
  isDropoffArrived = false,
  stopsAheadCount = null,
  connectionStatus = 'ONLINE',
  onPressSafety,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const destinationName = dropoffLocation?.name || 'Selected destination';
  const driverName = driver?.fullName || '';
  const phoneNumber = driver?.phoneNumber || '';
  const vehicleDescription = [driver?.vehicleModel, driver?.vehicleColor].filter(Boolean).join(' · ');
  const isShared = rideMode === 'shared';
  const isReconnecting = connectionStatus === 'OFFLINE' || connectionStatus === 'RECONNECTING';

  const handleShareTrip = async () => {
    const details = [
      'CampusRide trip',
      pickupLocation?.name ? `Pickup: ${pickupLocation.name}` : null,
      `Destination: ${destinationName}`,
      driverName ? `Driver: ${driverName}` : null,
      vehicleDescription ? `Vehicle: ${vehicleDescription}` : null,
      driver?.vehicleLicensePlate ? `Plate: ${driver.vehicleLicensePlate}` : null,
    ].filter(Boolean);
    await Share.share({ title: 'My CampusRide trip', message: details.join('\n') });
  };

  const handleCallDriver = async () => {
    if (!phoneNumber) return;
    const url = `tel:${phoneNumber}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };

  const sharedProgress = isShared && stopsAheadCount !== null
    ? (stopsAheadCount === 0 ? 'Your stop is next' : `${stopsAheadCount} ${stopsAheadCount === 1 ? 'stop' : 'stops'} before yours`)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.brand.baseBackground, borderTopColor: colors.border.subtle }]}>
      {isReconnecting ? (
        <View style={[styles.connectionBanner, { backgroundColor: colors.text.primary }]}>
          <View style={[styles.connectionDot, { backgroundColor: colors.brand.primary }]} />
          <Text style={[styles.connectionText, { color: colors.brand.baseBackground }]}>Reconnecting to live trip updates…</Text>
        </View>
      ) : null}

      <View style={[styles.grabBar, { backgroundColor: colors.border.subtle }]} />
      <Text style={[styles.title, { color: colors.text.primary }]}>{isDropoffArrived ? 'At your destination' : 'On your way'}</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>{sharedProgress || (isShared ? 'Shared ride in progress' : 'Solo ride in progress')}</Text>

      <View style={[styles.destinationCard, { backgroundColor: colors.surface.base, borderColor: colors.border.subtle }]}>
        <View style={[styles.destinationIcon, { backgroundColor: colors.semantic.dangerTint }]}>
          <CRIcon name="location" size={22} color={colors.semantic.danger} />
        </View>
        <View style={styles.destinationCopy}>
          <Text style={[styles.destinationLabel, { color: colors.text.muted }]}>Destination</Text>
          <Text style={[styles.destinationName, { color: colors.text.primary }]} numberOfLines={2}>{destinationName}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TripAction icon="share-social" label="Share trip" onPress={handleShareTrip} colors={colors} />
        <TripAction icon="shield-checkmark" label="Safety" onPress={onPressSafety} colors={colors} />
        {phoneNumber ? <TripAction icon="call" label="Call driver" onPress={handleCallDriver} colors={colors} /> : null}
      </View>
    </View>
  );
};

const TripAction = ({ icon, label, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor: colors.surface.base }]}
    onPress={onPress}
    activeOpacity={0.72}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <CRIcon name={icon} size={20} color={colors.text.primary} />
    <Text style={[styles.actionLabel, { color: colors.text.primary }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    minHeight: 226,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  connectionBanner: { position: 'absolute', top: -38, left: spacing.xl, right: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.full, gap: 6 },
  connectionDot: { width: 6, height: 6, borderRadius: 3 },
  connectionText: { fontFamily: fonts.semiBold, fontSize: 10.5 },
  grabBar: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  title: { fontFamily: fonts.extraBold, fontSize: typography.size.titleMedium, letterSpacing: -0.35 },
  subtitle: { fontFamily: fonts.regular, fontSize: typography.size.bodySmall, marginTop: 2, marginBottom: spacing.sm },
  destinationCard: { minHeight: 64, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  destinationIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  destinationCopy: { flex: 1 },
  destinationLabel: { fontFamily: fonts.medium, fontSize: 10 },
  destinationName: { fontFamily: fonts.semiBold, fontSize: typography.size.bodyMedium, marginTop: 1 },
  actionsRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  actionButton: { flex: 1, minHeight: 54, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4 },
  actionLabel: { fontFamily: fonts.semiBold, fontSize: 10.5, textAlign: 'center' },
});

export default ActiveTripWorkspace;
