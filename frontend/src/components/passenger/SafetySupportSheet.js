import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Share,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { radii, spacing, fonts } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';
import { useSafety } from '../../context/SafetyContext';
import { EmergencyHoldButton } from '../safety/EmergencyHoldButton';
import { SomethingFeelsWrongSheet } from '../safety/SomethingFeelsWrongSheet';
import { triggerCampusSecurityCall, triggerNationalEmergencyCall } from '../../config/safetyConfig';

export const SafetySupportSheet = ({
  visible,
  onClose,
  activeBooking,
  activeDriver,
  pickupLocation,
  dropoffLocation,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const { triggerSOS, activeEmergency } = useSafety();
  const [showFeelsWrong, setShowFeelsWrong] = useState(false);

  const driverName = activeDriver?.fullName || 'Campus Driver';
  const vehicle = activeDriver?.vehicleModel || 'Campus Vehicle';
  const licensePlate = activeDriver?.vehicleLicensePlate || 'N/A';
  const pickup = pickupLocation?.name || activeBooking?.pickup?.name || 'Campus Pickup';
  const destination = dropoffLocation?.name || activeBooking?.dropoff?.name || 'Campus Destination';
  const rideId = activeBooking?._id || activeBooking?.id;

  // 1. Share Ride Details via Native OS Share Sheet (Sanitized)
  const handleShareRideDetails = async () => {
    try {
      const shareMessage = `CampusRide Trip Details:\n` +
        `• Destination: ${destination}\n` +
        `• Pickup: ${pickup}\n` +
        `• Driver: ${driverName}\n` +
        `• Vehicle: ${vehicle} (${licensePlate})\n` +
        `• Safety: University of Ghana Campus.`;

      await Share.share({
        message: shareMessage,
        title: 'My CampusRide Details',
      });
    } catch (error) {
      console.error('[SafetySupportSheet] Error sharing ride:', error);
    }
  };

  const handleTriggerSOS = async () => {
    await triggerSOS({
      rideId,
      source: 'in_ride',
      initialCategory: 'personal_safety_threat',
    });
    onClose?.();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={onClose}
          />

          <View style={[styles.sheetContainer, { backgroundColor: colors.surface.base }]}>
            {/* Drag Handle */}
            <View style={[styles.dragHandle, { backgroundColor: colors.border.subtle }]} />

            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerTitleWrap}>
                <View style={[styles.shieldIconWrap, { backgroundColor: colors.brand.primaryTint }]}>
                  <CRIcon name="shield-checkmark" size={18} color={colors.brand.primary} />
                </View>
                <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>In-Ride Safety & Support</Text>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.surface.elevated }]}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close Safety Sheet"
              >
                <CRIcon name="close" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sheetSubtitle, { color: colors.text.secondary }]}>
              Access instant emergency tools, report a concern, or share your live ride details.
            </Text>

            {/* Emergency Hold SOS Button */}
            {!activeEmergency && (
              <View style={[styles.sosCard, { backgroundColor: colors.semantic.dangerTint, borderColor: colors.semantic.danger }]}>
                <View style={styles.sosHeaderRow}>
                  <View style={[styles.sosBadge, { backgroundColor: colors.semantic.danger }]}>
                    <Text style={styles.sosBadgeText}>CRITICAL EMERGENCY</Text>
                  </View>
                  <Text style={[styles.sosHint, { color: colors.semantic.danger }]}>Hold 2.5s to trigger</Text>
                </View>
                <EmergencyHoldButton
                  onTriggerEmergency={handleTriggerSOS}
                  holdDurationMs={2500}
                  countdownGraceMs={3000}
                />
              </View>
            )}

            {/* Action: Something Feels Wrong (Tier-2 In-Ride Concern) */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                onClose?.();
                setShowFeelsWrong(true);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Something feels wrong"
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIconWrap, { backgroundColor: colors.semantic.warningTint }]}>
                  <CRIcon name="alert-circle" size={18} color={colors.semantic.warning} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={[styles.actionTitle, { color: colors.text.primary }]}>Something feels wrong</Text>
                  <Text style={[styles.actionDescription, { color: colors.text.secondary }]}>Off route, uncomfortable driving, or safety concern</Text>
                </View>
              </View>
              <CRIcon name="chevron-forward" size={16} color={colors.text.muted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border.divider }]} />

            {/* Action: Share Ride Details */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleShareRideDetails}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Share ride details"
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIconWrap, { backgroundColor: colors.brand.primaryTint }]}>
                  <CRIcon name="share-social-outline" size={18} color={colors.brand.primary} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={[styles.actionTitle, { color: colors.text.primary }]}>Share trip details</Text>
                  <Text style={[styles.actionDescription, { color: colors.text.secondary }]}>Send live ride details to friends or family</Text>
                </View>
              </View>
              <CRIcon name="chevron-forward" size={16} color={colors.text.muted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border.divider }]} />

            {/* Direct Calling Row */}
            <View style={styles.dialersRow}>
              <TouchableOpacity
                style={[styles.dialerButton, { backgroundColor: colors.surface.elevated, borderColor: colors.border.subtle }]}
                onPress={triggerCampusSecurityCall}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Call Campus Security"
              >
                <CRIcon name="call-outline" size={14} color={colors.text.primary} />
                <Text style={[styles.dialerText, { color: colors.text.primary }]}>Campus Security</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialerButton, styles.dialerButtonRed, { backgroundColor: colors.semantic.dangerTint, borderColor: colors.semantic.danger }]}
                onPress={triggerNationalEmergencyCall}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Call 112"
              >
                <CRIcon name="call-outline" size={14} color={colors.semantic.danger} />
                <Text style={[styles.dialerText, { color: colors.semantic.danger }]}>Call 112</Text>
              </TouchableOpacity>
            </View>

            {/* Dismiss Button */}
            <TouchableOpacity
              style={[styles.dismissButton, { backgroundColor: colors.surface.elevated }]}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Dismiss safety sheet"
            >
              <Text style={[styles.dismissButtonText, { color: colors.text.primary }]}>Back to Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Something Feels Wrong Sheet */}
      <SomethingFeelsWrongSheet
        visible={showFeelsWrong}
        onClose={() => setShowFeelsWrong(false)}
        activeBooking={activeBooking}
        activeDriver={activeDriver}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs + 4,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm + 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shieldIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  sosCard: {
    borderRadius: radii.md || 12,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sosHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sosBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sosBadgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sosHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    flex: 1,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  actionTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
  },
  actionDescription: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  dialersRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xs,
  },
  dialerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md || 10,
    borderWidth: 1,
  },
  dialerButtonRed: {},
  dialerText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  dismissButton: {
    marginTop: spacing.md,
    borderRadius: radii.md || 12,
    paddingVertical: spacing.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});

export default SafetySupportSheet;
