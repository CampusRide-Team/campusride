import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { colors, fonts, radii, spacing, elevation } from '../../theme';
import { CRIcon } from '../common';
import { ReportConcernModal } from '../safety/ReportConcernModal';

export const TripDetailsSheet = ({
  visible,
  booking,
  onClose,
  onPressRate,
}) => {
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportCategory, setReportCategory] = useState('driver_behavior');

  if (!booking) return null;

  const isCompleted = booking.status === 'completed';
  const destinationName = booking.dropoff?.name || 'Destination';
  const pickupName = booking.pickup?.name || 'Pickup';

  // 1. Authoritative Mode Mapping
  let modeLabel = null;
  if (booking.rideMode === 'solo') {
    modeLabel = 'Campus Solo';
  } else if (booking.rideMode === 'shared') {
    modeLabel = 'Campus Shared';
  }

  // 2. Authoritative Timestamp Resolution
  let rawTimestamp = null;
  if (isCompleted) {
    rawTimestamp = booking.completedAt || booking.createdAt;
  } else if (booking.cancellation?.cancelledAt) {
    rawTimestamp = booking.cancellation.cancelledAt;
  } else {
    rawTimestamp = booking.createdAt;
  }

  let formattedDate = null;
  if (rawTimestamp) {
    const dateObj = new Date(rawTimestamp);
    if (!isNaN(dateObj.getTime())) {
      formattedDate = dateObj.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  // 3. Status Mapping & Visual Language
  let statusLabel = 'Completed';
  let statusBadgeBg = colors.semantic.successTint;
  let statusTextColor = colors.semantic.success;
  let statusDotColor = colors.semantic.success;

  if (booking.status === 'completed') {
    statusLabel = 'Completed';
    statusBadgeBg = colors.semantic.successTint;
    statusTextColor = colors.semantic.success;
    statusDotColor = colors.semantic.success;
  } else if (booking.status === 'cancelled') {
    const role = booking.cancellation?.cancelledByRole;
    if (role === 'passenger') {
      statusLabel = 'Cancelled by you';
    } else if (role === 'driver') {
      statusLabel = 'Cancelled by driver';
    } else {
      statusLabel = 'Cancelled';
    }
    statusBadgeBg = '#F5F2EB';
    statusTextColor = colors.text.secondary;
    statusDotColor = colors.text.secondary;
  } else if (booking.status === 'cancelled_timeout' || booking.status === 'failed_no_drivers') {
    statusLabel = 'No driver found';
    statusBadgeBg = '#F5F2EB';
    statusTextColor = colors.text.secondary;
    statusDotColor = colors.text.secondary;
  } else if (booking.status === 'emergency_cancelled') {
    statusLabel = 'Ride ended early';
    statusBadgeBg = colors.semantic.warningTint;
    statusTextColor = colors.semantic.warning;
    statusDotColor = colors.semantic.warning;
  } else {
    statusLabel = 'Cancelled';
    statusBadgeBg = '#F5F2EB';
    statusTextColor = colors.text.secondary;
    statusDotColor = colors.text.secondary;
  }

  // 5. Driver Information (Strict null safety - omit if driverId is null)
  const driver = booking.driverId;
  const driverName = driver?.fullName || '';
  const vehicleModel = driver?.driverProfile?.vehicle?.model || driver?.vehicleModel || '';
  const licensePlate = driver?.driverProfile?.vehicle?.licensePlate || driver?.vehicleLicensePlate || '';
  const hasDriver = !!(driver && (driverName || vehicleModel || licensePlate));

  const getInitials = (name) => {
    if (!name) return 'CD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // 6. Shortened Booking Reference
  const bookingIdStr = String(booking._id || booking.id || '');
  const shortReference = bookingIdStr.length >= 8
    ? bookingIdStr.substring(bookingIdStr.length - 8).toUpperCase()
    : bookingIdStr.toUpperCase();

  return (
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

        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header: Status, Destination, Time */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
                  <Text style={[styles.statusText, { color: statusTextColor }]}>
                    {statusLabel}
                  </Text>
                </View>
                <Text style={styles.destinationTitle}>{destinationName}</Text>
                {formattedDate ? (
                  <Text style={styles.timestampText}>{formattedDate}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close Trip Details"
              >
                <CRIcon name="close" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* 1. Journey Timeline Block */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>Journey</Text>
              <View style={styles.timelineContainer}>
                <View style={styles.timelineLine} />

                {/* Pickup Row */}
                <View style={styles.timelineRow}>
                  <View style={styles.pickupDotOuter}>
                    <View style={styles.pickupDotInner} />
                  </View>
                  <View style={styles.timelineTextWrap}>
                    <Text style={styles.timelinePlaceName} numberOfLines={1}>
                      {pickupName}
                    </Text>
                    <Text style={styles.timelinePlaceType}>Pickup location</Text>
                  </View>
                </View>

                {/* Dropoff Row */}
                <View style={styles.timelineRow}>
                  <View style={styles.dropoffDotOuter}>
                    <View style={styles.dropoffDotInner} />
                  </View>
                  <View style={styles.timelineTextWrap}>
                    <Text style={styles.timelinePlaceName} numberOfLines={1}>
                      {destinationName}
                    </Text>
                    <Text style={styles.timelinePlaceType}>Dropoff location</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 2. Mode and driver block */}
            {isCompleted ? (
              <View style={styles.gridRow}>
                <View style={styles.gridCard}>
                  <Text style={styles.sectionHeader}>Ride Mode</Text>
                  <Text style={styles.modeValueText}>
                    {modeLabel || 'Campus Ride'}
                  </Text>
                  <Text style={styles.modeMetaText}>
                    {booking.route?.distanceMeters ? `${(booking.route.distanceMeters / 1000).toFixed(1)} km` : 'Campus trip'}
                  </Text>
                </View>

                {/* Driver Card (if assigned) */}
                {hasDriver ? (
                  <View style={styles.gridCard}>
                    <Text style={styles.sectionHeader}>Driver</Text>
                    <View style={styles.driverSummaryRow}>
                      <View style={styles.driverAvatarCircle}>
                        <Text style={styles.driverAvatarText}>{getInitials(driverName)}</Text>
                      </View>
                      <View style={styles.driverInfoWrap}>
                        <Text style={styles.driverNameText} numberOfLines={1}>
                          {driverName}
                        </Text>
                        <Text style={styles.vehicleText} numberOfLines={1}>
                          {[vehicleModel, licensePlate].filter(Boolean).join(' • ')}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              /* Cancelled / Unsuccessful Summary Card */
              <View style={styles.sectionCard}>
                <View style={styles.unsuccessfulRow}>
                  <View>
                    <Text style={styles.sectionHeader}>Ride Mode</Text>
                    <Text style={styles.unsuccessfulModeText}>{modeLabel || 'Campus Ride'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.sectionHeader}>Status</Text>
                    <Text style={styles.unsuccessfulStatusText}>Unassigned</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 3. Driver Full Card (for non-completed rides where driver was assigned prior to cancel) */}
            {!isCompleted && hasDriver && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>Assigned Driver</Text>
                <View style={styles.driverSummaryRow}>
                  <View style={styles.driverAvatarCircle}>
                    <Text style={styles.driverAvatarText}>{getInitials(driverName)}</Text>
                  </View>
                  <View style={styles.driverInfoWrap}>
                    <Text style={styles.driverNameText} numberOfLines={1}>
                      {driverName}
                    </Text>
                    <Text style={styles.vehicleText} numberOfLines={1}>
                      {[vehicleModel, licensePlate].filter(Boolean).join(' • ')}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* 4. Rate Ride CTA (Completed Rides Only) */}
            {isCompleted && onPressRate && (
              <TouchableOpacity
                style={styles.rateRideButton}
                onPress={() => onPressRate(booking)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Rate Ride"
              >
                <CRIcon name="star" size={16} color={colors.brand.primary} />
                <Text style={styles.rateRideButtonText}>Rate Ride</Text>
              </TouchableOpacity>
            )}

            {/* 5. Safety & Support Actions Block */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>Trip Safety & Support</Text>
              
              <TouchableOpacity
                style={styles.safetyActionRow}
                onPress={() => {
                  setReportCategory('driver_behavior');
                  setReportModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.safetyActionLeft}>
                  <View style={styles.safetyActionIconWrap}>
                    <CRIcon name="shield-outline" size={16} color={colors.text.primary} />
                  </View>
                  <View>
                    <Text style={styles.safetyActionTitle}>Report a Safety Concern</Text>
                    <Text style={styles.safetyActionSubtitle}>Driver behavior, route issues, vehicle safety</Text>
                  </View>
                </View>
                <CRIcon name="chevron-forward" size={14} color={colors.text.secondary} />
              </TouchableOpacity>

              <View style={styles.safetyDivider} />

              <TouchableOpacity
                style={styles.safetyActionRow}
                onPress={() => {
                  setReportCategory('lost_item');
                  setReportModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.safetyActionLeft}>
                  <View style={styles.safetyActionIconWrap}>
                    <CRIcon name="briefcase-outline" size={16} color={colors.text.primary} />
                  </View>
                  <View>
                    <Text style={styles.safetyActionTitle}>Lost Something?</Text>
                    <Text style={styles.safetyActionSubtitle}>Report property left in vehicle</Text>
                  </View>
                </View>
                <CRIcon name="chevron-forward" size={14} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* 6. Tertiary Booking Reference */}
            {shortReference ? (
              <Text style={styles.referenceText}>
                Trip reference <Text style={styles.referenceMono}>#{shortReference}</Text>
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>

      <ReportConcernModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        prefilledRideId={bookingIdStr}
        initialCategory={reportCategory}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 24, 21, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface.elevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    borderColor: colors.border.subtle,
    maxHeight: '82%',
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    ...elevation.level3,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10.5,
    fontFamily: fonts.manrope.bold,
    fontWeight: '700',
  },
  destinationTitle: {
    fontSize: 18,
    fontFamily: fonts.manrope.extraBold,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  timestampText: {
    fontSize: 12,
    fontFamily: fonts.manrope.semiBold,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.baseBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    backgroundColor: colors.surface.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md - 2,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: fonts.manrope.extraBold,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.text.muted,
    marginBottom: spacing.xs + 2,
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 14,
    bottom: 14,
    width: 2,
    backgroundColor: colors.border.subtle,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  pickupDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface.base,
    borderWidth: 2,
    borderColor: colors.text.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  pickupDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.secondary,
  },
  dropoffDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.text.primary,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  dropoffDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelinePlaceName: {
    fontSize: 13,
    fontFamily: fonts.manrope.bold,
    fontWeight: '700',
    color: colors.text.primary,
  },
  timelinePlaceType: {
    fontSize: 10.5,
    fontFamily: fonts.manrope.regular,
    color: colors.text.muted,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: colors.surface.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.sm + 2,
  },
  modeValueText: {
    fontSize: 16,
    fontFamily: fonts.manrope.extraBold,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modeMetaText: {
    fontSize: 11,
    fontFamily: fonts.manrope.semiBold,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 2,
  },
  driverSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  driverAvatarText: {
    fontSize: 10,
    fontFamily: fonts.manrope.bold,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  driverInfoWrap: {
    flex: 1,
  },
  driverNameText: {
    fontSize: 12,
    fontFamily: fonts.manrope.bold,
    fontWeight: '700',
    color: colors.text.primary,
  },
  vehicleText: {
    fontSize: 10.5,
    fontFamily: fonts.manrope.medium,
    color: colors.text.secondary,
  },
  unsuccessfulRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unsuccessfulModeText: {
    fontSize: 13,
    fontFamily: fonts.manrope.bold,
    fontWeight: '700',
    color: colors.text.primary,
  },
  unsuccessfulStatusText: {
    fontSize: 11,
    fontFamily: fonts.manrope.semiBold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  rateRideButton: {
    backgroundColor: 'rgba(200, 159, 62, 0.15)',
    borderWidth: 1,
    borderColor: colors.brand.primary,
    borderRadius: radii.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: spacing.xs,
  },
  rateRideButtonText: {
    fontSize: 13,
    fontFamily: fonts.manrope.extraBold,
    fontWeight: '800',
    color: colors.text.primary,
  },
  safetyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
  },
  safetyActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
  },
  safetyActionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.brand.baseBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyActionTitle: {
    fontSize: 12.5,
    fontFamily: fonts.manrope.bold,
    fontWeight: '700',
    color: colors.text.primary,
  },
  safetyActionSubtitle: {
    fontSize: 10.5,
    fontFamily: fonts.manrope.regular,
    color: colors.text.secondary,
    marginTop: 1,
  },
  safetyDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.xs,
  },
  referenceText: {
    textAlign: 'center',
    fontSize: 10.5,
    fontFamily: fonts.manrope.semiBold,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  referenceMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    color: colors.text.secondary,
  },
});

export default TripDetailsSheet;
