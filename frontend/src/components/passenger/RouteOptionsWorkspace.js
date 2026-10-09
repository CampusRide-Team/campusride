import React, { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fonts, radii, spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRButton, CRIcon } from '../common';
import RideModeRow from './RideModeRow';

export const RouteOptionsWorkspace = ({
  pickupLocation,
  dropoffLocation,
  isRoutingLoading = false,
  routeError = null,
  routeEstimateOnly = false,
  distanceLabel,
  etaLabel,
  selectedRideMode = 'solo',
  canRequestRide = false,
  onSelectRideMode,
  onRequestRide,
  departureMode = 'now',
  scheduledTime = new Date(Date.now() + 30 * 60 * 1000),
  onChangeDepartureMode,
  onChangeScheduledTime,
  isRequesting = false,
  onRetryRoute,
  onPressEditRoute,
  onPressBack,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const isSolo = selectedRideMode === 'solo';
  const handleEdit = onPressEditRoute || onPressBack;
  const [pickerMode, setPickerMode] = useState(null);

  const ctaTitle = departureMode === 'scheduled' ? 'Schedule Ride' : 'Confirm Ride';
  const scheduleIsValid = departureMode !== 'scheduled' || scheduledTime.getTime() >= Date.now() + 60 * 1000;
  const requestEnabled = canRequestRide && scheduleIsValid;
  const applyPickerValue = (event, value) => {
    if (Platform.OS === 'android') setPickerMode(null);
    if (event?.type === 'dismissed' || !value) return;
    if (pickerMode === 'date') {
      onChangeScheduledTime?.(new Date(value.getFullYear(), value.getMonth(), value.getDate(), scheduledTime.getHours(), scheduledTime.getMinutes()));
    } else {
      onChangeScheduledTime?.(new Date(scheduledTime.getFullYear(), scheduledTime.getMonth(), scheduledTime.getDate(), value.getHours(), value.getMinutes()));
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface.base,
          borderTopColor: colors.border.subtle,
        },
        style,
      ]}
    >
      {/* 1. Drag / Sheet Handle */}
      <View style={[styles.grabBar, { backgroundColor: colors.border.subtle }]} />

      {/* 2. Sheet Header matching Approved Screen 3 */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Ride options</Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
          Choose the ride that works for you
        </Text>
      </View>

      {/* 3. Routing Loader or Error Banner */}
      {isRoutingLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={colors.brand.primary} />
          <Text style={[styles.stateText, { color: colors.text.secondary }]}>Preparing ride options…</Text>
        </View>
      ) : routeError ? (
        <View style={styles.stateContainer}>
          <CRIcon name="alert-circle-outline" size={24} color={colors.semantic.danger} />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>Ride options unavailable</Text>
          <Text style={[styles.stateText, { color: colors.text.secondary }]}>{routeError}</Text>
          <CRButton title="Try again" onPress={onRetryRoute} variant="secondary" size="small" style={styles.retryButton} />
        </View>
      ) : (
        <View>
          {/* 4. Selectable Ride Cards */}
          <RideModeRow
            mode="solo"
            title="Solo Ride"
            subtitle="Direct and private"
            seats="1–4"
            eta={etaLabel || ''}
            isSelected={isSolo}
            onSelect={() => onSelectRideMode?.('solo')}
            disabled={isRequesting}
          />

          <RideModeRow
            mode="shared"
            title="Shared Ride"
            subtitle="Share with fellow students"
            seats="1–3"
            eta={etaLabel || ''}
            isSelected={!isSolo}
            onSelect={() => onSelectRideMode?.('shared')}
            disabled={isRequesting}
          />

          {/* 5. Route Details Section matching Approved Screen 3 */}
          <View style={[styles.routeDetailsCard, { backgroundColor: colors.surface.base, borderColor: colors.border.subtle }]}>
            <View style={styles.routeHeaderRow}>
              <Text style={[styles.routeDetailsTitle, { color: colors.text.primary }]}>Route details</Text>
              {handleEdit ? (
                <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
                  <Text style={[styles.editRouteText, { color: colors.brand.primary }]}>Edit</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Timeline Row: Pickup */}
            <View style={styles.timelinePoint}>
              <View style={[styles.pointDot, { backgroundColor: colors.brand.primary }]} />
              <View style={styles.pointCopy}>
                <Text style={[styles.pointTitle, { color: colors.text.primary }]}>Pickup</Text>
                <Text style={[styles.pointSub, { color: colors.text.secondary }]}>
                  {pickupLocation?.name || 'Selected pickup location'}
                </Text>
              </View>
            </View>

            <View style={[styles.timelineTrack, { backgroundColor: colors.border.subtle }]} />

            {/* Timeline Row: Destination */}
            <View style={styles.timelinePoint}>
              <View style={[styles.pointDot, { backgroundColor: colors.semantic.danger }]} />
              <View style={styles.pointCopy}>
                <Text style={[styles.pointTitle, { color: colors.text.primary }]}>Destination</Text>
                <Text style={[styles.pointSub, { color: colors.text.secondary }]}>
                  {dropoffLocation?.name || 'Selected destination'}
                </Text>
              </View>
            </View>

            {/* Distance and ETA metrics */}
            {(distanceLabel || etaLabel) ? (
              <Text style={[styles.routeMetricsText, { color: colors.text.muted }]}>
                {[distanceLabel, etaLabel].filter(Boolean).join(' • ')}
              </Text>
            ) : null}
          </View>

          <View style={styles.departureSection}>
            <Text style={[styles.routeDetailsTitle, { color: colors.text.primary }]}>Departure</Text>
            <View style={[styles.departureToggle, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
              {[
                { id: 'now', label: 'Leave now' },
                { id: 'scheduled', label: 'Schedule' },
              ].map((option) => {
                const selected = departureMode === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.departureOption, selected && { backgroundColor: colors.brand.primary }]}
                    onPress={() => onChangeDepartureMode?.(option.id)}
                    disabled={isRequesting}
                  >
                    <Text style={[styles.departureOptionText, { color: selected ? colors.brand.onGoldText : colors.text.secondary }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {departureMode === 'scheduled' ? (
              <>
                <View style={[styles.dateTimeRow, { borderColor: colors.border.subtle }]}>
                  <TouchableOpacity style={[styles.dateTimeButton, { backgroundColor: colors.surface.tile }]} onPress={() => setPickerMode('date')}>
                    <CRIcon name="calendar-outline" size={17} color={colors.brand.primary} />
                    <Text style={[styles.dateTimeText, { color: colors.text.primary }]}>{scheduledTime.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.dateTimeButton, { backgroundColor: colors.surface.tile }]} onPress={() => setPickerMode('time')}>
                    <CRIcon name="time-outline" size={17} color={colors.brand.primary} />
                    <Text style={[styles.dateTimeText, { color: colors.text.primary }]}>{scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </TouchableOpacity>
                </View>
                {!scheduleIsValid ? <Text style={[styles.scheduleError, { color: colors.semantic.danger }]}>Choose a time at least one minute from now.</Text> : null}
                {pickerMode ? (
                  <DateTimePicker
                    value={scheduledTime}
                    mode={pickerMode}
                    minimumDate={pickerMode === 'date' ? new Date() : undefined}
                    maximumDate={pickerMode === 'date' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined}
                    onChange={applyPickerValue}
                  />
                ) : null}
              </>
            ) : null}
          </View>

          {/* 6. Primary Action Button matching Approved Screen 3 */}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              {
                backgroundColor: colors.brand.primary,
                opacity: !requestEnabled || isRequesting ? 0.6 : 1,
              },
            ]}
            onPress={onRequestRide}
            disabled={!requestEnabled || isRequesting}
            activeOpacity={0.85}
          >
            {isRequesting ? (
              <ActivityIndicator size="small" color={colors.brand.onGoldText} />
            ) : (
              <Text style={[styles.confirmButtonText, { color: colors.brand.onGoldText }]}>
                {ctaTitle}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  grabBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    marginBottom: spacing.sm + 2,
  },
  headerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 2,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  stateText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  retryButton: {
    marginTop: spacing.sm,
  },

  // Route details card
  routeDetailsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  routeDetailsTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  editRouteText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  timelinePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  pointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  pointCopy: {
    flex: 1,
  },
  pointTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  pointSub: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    marginTop: 1,
  },
  timelineTrack: {
    width: 2,
    height: 14,
    marginLeft: 4,
    marginVertical: 2,
  },
  routeMetricsText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    marginTop: spacing.xs,
    marginLeft: 18,
  },

  // Confirm CTA
  confirmButton: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C89F3E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmButtonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  departureSection: { marginBottom: spacing.md, gap: spacing.xs },
  departureToggle: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 3 },
  departureOption: { flex: 1, minHeight: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  departureOptionText: { fontFamily: fonts.bold, fontSize: 13 },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: spacing.xs },
  dateTimeButton: { flex: 1, minHeight: 42, borderRadius: 12, paddingHorizontal: 10, marginHorizontal: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dateTimeText: { fontFamily: fonts.bold, fontSize: 12 },
  scheduleError: { fontFamily: fonts.medium, fontSize: 11.5, marginTop: 2 },
});

export default RouteOptionsWorkspace;
