import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fonts, radii, spacing, typography } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';

export const DriverApproachWorkspace = ({
  driver,
  onPressCancelRide,
  statusTitle = 'Driver assigned',
  statusSubtitle = 'Your driver is on the way.',
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const driverName = driver?.fullName || 'Assigned driver';
  const vehicleModel = driver?.vehicleModel || '';
  const vehicleColor = driver?.vehicleColor || '';
  const licensePlate = driver?.vehicleLicensePlate || '';
  const phoneNumber = driver?.phoneNumber || '';
  const avatarUri = driver?.avatarUri || '';
  const vehicleDescription = [vehicleModel, vehicleColor].filter(Boolean).join(' · ');

  const getInitials = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'CR';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const handleCallDriver = async () => {
    if (!phoneNumber) return;
    const url = `tel:${phoneNumber}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.brand.baseBackground, borderTopColor: colors.border.subtle }, style]}>
      <View style={[styles.grabBar, { backgroundColor: colors.border.subtle }]} />

      <View style={styles.statusHeader}>
        <Text style={[styles.statusTitle, { color: colors.text.primary }]}>{statusTitle}</Text>
        <Text style={[styles.statusSubtitle, { color: colors.text.secondary }]}>{statusSubtitle}</Text>
      </View>

      <View style={[styles.driverCard, { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle, borderWidth: 1 }]}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={[styles.avatar, { backgroundColor: colors.border.subtle }]} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.surface.base }]}>
            <Text style={[styles.initials, { color: colors.text.primary }]}>{getInitials(driverName)}</Text>
          </View>
        )}

        <View style={styles.driverCopy}>
          <Text style={[styles.driverName, { color: colors.text.primary }]} numberOfLines={1}>{driverName}</Text>
          {vehicleDescription ? <Text style={[styles.vehicle, { color: colors.text.secondary }]} numberOfLines={1}>{vehicleDescription}</Text> : null}
          {licensePlate ? <Text style={[styles.plate, { color: colors.brand.primary }]} numberOfLines={1}>{licensePlate}</Text> : null}
        </View>

        {phoneNumber ? (
          <TouchableOpacity
            style={[styles.callButton, { backgroundColor: colors.brand.primary }]}
            onPress={handleCallDriver}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={`Call ${driverName}`}
          >
            <CRIcon name="call" size={19} color={colors.brand.onGoldText} />
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.cancelButton, { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle, borderWidth: 1 }]}
        onPress={onPressCancelRide}
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityLabel="Cancel ride"
      >
        <CRIcon name="close-circle" size={19} color={colors.semantic.danger} />
        <Text style={[styles.cancelText, { color: colors.text.primary }]}>Cancel ride</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 222,
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
  grabBar: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  statusHeader: { marginBottom: spacing.sm },
  statusTitle: { fontFamily: fonts.extraBold, fontSize: typography.size.titleMedium, letterSpacing: -0.35 },
  statusSubtitle: { fontFamily: fonts.regular, fontSize: typography.size.bodySmall, marginTop: 2 },
  driverCard: { minHeight: 74, borderRadius: radii.md, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: fonts.bold, fontSize: typography.size.bodyMedium },
  driverCopy: { flex: 1, marginLeft: spacing.sm },
  driverName: { fontFamily: fonts.bold, fontSize: typography.size.bodyMedium },
  vehicle: { fontFamily: fonts.regular, fontSize: typography.size.caption, marginTop: 2 },
  plate: { fontFamily: fonts.mono, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.7, marginTop: 3 },
  callButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
  cancelButton: { minHeight: 48, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  cancelText: { fontFamily: fonts.semiBold, fontSize: typography.size.bodyMedium },
});

export default DriverApproachWorkspace;
