// frontend/src/components/safety/GlobalEmergencyOverlay.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, fonts } from '../../theme';
import { CRIcon } from '../common';
import { useSafety } from '../../context/SafetyContext';
import { triggerCampusSecurityCall, triggerNationalEmergencyCall } from '../../config/safetyConfig';

const CATEGORY_OPTIONS = [
  { id: 'medical', label: 'Medical', icon: 'medkit-outline' },
  { id: 'accident_vehicle', label: 'Accident / Vehicle Issue', icon: 'car-outline' },
  { id: 'personal_safety_threat', label: 'Personal Safety / Threat', icon: 'shield-outline' },
  { id: 'other', label: 'Other', icon: 'help-circle-outline' },
];

export const GlobalEmergencyOverlay = () => {
  const insets = useSafeAreaInsets();
  const {
    activeEmergency,
    isEmergencyActive,
    emergencyOverlayVisible,
    dismissEmergencyOverlay,
    openEmergencyOverlay,
    updateCategory,
    reportSafe,
  } = useSafety();

  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isReportingSafe, setIsReportingSafe] = useState(false);

  if (!isEmergencyActive || !activeEmergency) {
    return null;
  }

  const status = activeEmergency.status;
  const isAcknowledged = !!activeEmergency.acknowledgement?.acknowledgedAt;
  const operatorName = activeEmergency.acknowledgement?.operatorName || 'CampusRide Operator';
  const isResponding = status === 'responding';
  const isEscalated = !!activeEmergency.escalation?.isRecorded;
  const currentCategory = activeEmergency.category;
  const contacts = activeEmergency.trustedContactsSnapshot || [];
  const passengerIntent = activeEmergency.passengerResolutionIntent?.intent;

  // Handle Category Selection
  const handleSelectCategory = async (catId) => {
    if (currentCategory === catId || isUpdatingCategory) return;
    try {
      setIsUpdatingCategory(true);
      await updateCategory(catId);
    } catch (err) {
      Alert.alert('Update Failed', err.message || 'Could not update category');
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  // Handle "I'm Safe" Intent
  const handleReportSafe = () => {
    Alert.alert(
      'Confirm You Are Safe',
      'This will notify the CampusRide operator handling your emergency that you are in a safe situation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "I'm Safe",
          style: 'default',
          onPress: async () => {
            try {
              setIsReportingSafe(true);
              await reportSafe({ reason: 'user_reported_safe', notes: 'Passenger confirmed safe from mobile UI' });
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not update status');
            } finally {
              setIsReportingSafe(false);
            }
          },
        },
      ]
    );
  };

  // Handle False Alarm
  const handleReportFalseAlarm = () => {
    Alert.alert(
      'Accidental Activation',
      'Report to the operator that this SOS was triggered accidentally.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Accidental',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsReportingSafe(true);
              await reportSafe({ reason: 'false_alarm', notes: 'Accidental trigger reported by passenger' });
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not update status');
            } finally {
              setIsReportingSafe(false);
            }
          },
        },
      ]
    );
  };

  // If minimized, render persistent top alert pill (unless passenger reported safe/cancelled)
  if (!emergencyOverlayVisible) {
    if (passengerIntent === 'safe' || passengerIntent === 'false_alarm') {
      return null;
    }
    return (
      <TouchableOpacity
        style={[styles.minimizedBanner, { top: insets.top + 8 }]}
        onPress={openEmergencyOverlay}
        activeOpacity={0.9}
      >
        <View style={styles.minimizedLeft}>
          <View style={styles.pulseIndicator} />
          <Text style={styles.minimizedText}>EMERGENCY ACTIVE • TAP TO OPEN</Text>
        </View>
        <CRIcon name="chevron-forward" size={16} color={colors.surface.base} />
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={emergencyOverlayVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={dismissEmergencyOverlay}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <View style={styles.headerDot} />
            <Text style={styles.headerTitle}>Emergency Active</Text>
          </View>
          <TouchableOpacity
            style={styles.minimizeBtn}
            onPress={dismissEmergencyOverlay}
            activeOpacity={0.7}
          >
            <Text style={styles.minimizeText}>Minimize</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Status Callout */}
          <View style={styles.statusCallout}>
            <Text style={styles.calloutTitle}>Help Requested • Alert Confirmed</Text>
            <Text style={styles.calloutSub}>
              CampusRide received your emergency request. An operator is monitoring this event.
            </Text>

            {passengerIntent && (
              <View style={styles.intentBanner}>
                <CRIcon name="checkmark-circle" size={16} color="#15803D" />
                <Text style={styles.intentText}>
                  You indicated: {passengerIntent === 'false_alarm' ? 'Accidental activation' : "You are safe"}
                </Text>
              </View>
            )}
          </View>

          {/* Operational Progress Milestones */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>EVENT STATUS</Text>

            <View style={styles.milestoneRow}>
              <View style={[styles.milestoneCheck, styles.milestoneCheckActive]}>
                <CRIcon name="checkmark" size={14} color={colors.surface.base} />
              </View>
              <View style={styles.milestoneTextWrap}>
                <Text style={styles.milestoneTitle}>Alert Received by Server</Text>
                <Text style={styles.milestoneSub}>Emergency event persisted authoritatively</Text>
              </View>
            </View>

            <View style={styles.milestoneRow}>
              <View style={[styles.milestoneCheck, isAcknowledged && styles.milestoneCheckActive]}>
                {isAcknowledged ? (
                  <CRIcon name="checkmark" size={14} color={colors.surface.base} />
                ) : (
                  <ActivityIndicator size="small" color={colors.text.muted} />
                )}
              </View>
              <View style={styles.milestoneTextWrap}>
                <Text style={[styles.milestoneTitle, !isAcknowledged && styles.milestoneTitlePending]}>
                  {isAcknowledged ? `Acknowledged by ${operatorName}` : 'Awaiting Operator Acknowledgment'}
                </Text>
                <Text style={styles.milestoneSub}>
                  {isAcknowledged ? 'CampusRide operator is actively reviewing event' : 'Notification in operator queue'}
                </Text>
              </View>
            </View>

            {isResponding && (
              <View style={styles.milestoneRow}>
                <View style={[styles.milestoneCheck, styles.milestoneCheckActive]}>
                  <CRIcon name="checkmark" size={14} color={colors.surface.base} />
                </View>
                <View style={styles.milestoneTextWrap}>
                  <Text style={styles.milestoneTitle}>Operator Responding</Text>
                  <Text style={styles.milestoneSub}>Actively coordinating response context</Text>
                </View>
              </View>
            )}

            {isEscalated && (
              <View style={styles.milestoneRow}>
                <View style={[styles.milestoneCheck, styles.milestoneCheckActive]}>
                  <CRIcon name="shield-checkmark" size={14} color={colors.surface.base} />
                </View>
                <View style={styles.milestoneTextWrap}>
                  <Text style={styles.milestoneTitle}>Escalated to Campus Security</Text>
                  <Text style={styles.milestoneSub}>Operator logged external security escalation</Text>
                </View>
              </View>
            )}
          </View>

          {/* Trusted Contacts Notification Snapshot */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>TRUSTED CONTACTS NOTIFIED</Text>
            {contacts.length > 0 ? (
              contacts.map((c, idx) => (
                <View key={idx} style={styles.contactItem}>
                  <View>
                    <Text style={styles.contactName}>{c.name} ({c.relationship})</Text>
                    <Text style={styles.contactPhone}>{c.phoneNumber}</Text>
                  </View>
                  <View style={[
                    styles.deliveryPill,
                    c.deliveryStatus === 'delivered' ? styles.deliveryDelivered :
                    c.deliveryStatus === 'sent' ? styles.deliverySent :
                    c.deliveryStatus === 'failed' ? styles.deliveryFailed : styles.deliveryUnavailable
                  ]}>
                    <Text style={styles.deliveryPillText}>
                      {c.deliveryStatus === 'delivered' ? 'DELIVERED' :
                       c.deliveryStatus === 'sent' ? 'SENT' :
                       c.deliveryStatus === 'failed' ? 'FAILED' : 'UNAVAILABLE'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyContactsText}>No verified trusted contacts were registered.</Text>
            )}
          </View>

          {/* Category Refinement (Optional) */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>REFINE EMERGENCY TYPE (OPTIONAL)</Text>
            <Text style={styles.categoryPrompt}>Select a category to help the operator prioritize:</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((cat) => {
                const selected = currentCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryBtn, selected && styles.categoryBtnSelected]}
                    onPress={() => handleSelectCategory(cat.id)}
                    activeOpacity={0.7}
                    disabled={isUpdatingCategory}
                  >
                    <CRIcon
                      name={cat.icon}
                      size={18}
                      color={selected ? colors.surface.base : colors.text.primary}
                    />
                    <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Emergency Direct Dialer Actions */}
          <View style={styles.dialerRow}>
            <TouchableOpacity
              style={[styles.dialerBtn, styles.dialerSecurity]}
              onPress={triggerCampusSecurityCall}
              activeOpacity={0.8}
            >
              <CRIcon name="call" size={16} color={colors.surface.base} />
              <Text style={styles.dialerText}>Call Campus Security</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dialerBtn, styles.dialerEmergency]}
              onPress={triggerNationalEmergencyCall}
              activeOpacity={0.8}
            >
              <CRIcon name="call" size={16} color={colors.surface.base} />
              <Text style={styles.dialerText}>Call 112 Ghana</Text>
            </TouchableOpacity>
          </View>

          {/* Resolution Intent Actions */}
          <View style={styles.resolutionContainer}>
            {passengerIntent === 'safe' || passengerIntent === 'false_alarm' ? (
              <View style={styles.safeConfirmedBox}>
                <View style={styles.safeConfirmedHeader}>
                  <CRIcon name="checkmark-circle" size={20} color={colors.semantic.success} />
                  <Text style={[styles.safeConfirmedText, { color: colors.semantic.success }]}>
                    {passengerIntent === 'safe' ? 'Safe Report Recorded' : 'Cancellation Recorded'}
                  </Text>
                </View>
                <Text style={[styles.safeConfirmedSubtext, { color: colors.text.secondary }]}>
                  {passengerIntent === 'safe'
                    ? 'Campus Security dispatch has received your safety confirmation.'
                    : 'Dispatch has been notified that this alert was triggered accidentally.'}
                </Text>
                <TouchableOpacity
                  style={[styles.dismissSafeBtn, { backgroundColor: colors.semantic.success }]}
                  onPress={dismissEmergencyOverlay}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dismissSafeBtnText}>Dismiss & Close Overlay</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.safeBtn, { backgroundColor: colors.semantic.danger }]}
                  onPress={handleReportSafe}
                  activeOpacity={0.8}
                  disabled={isReportingSafe}
                >
                  {isReportingSafe ? (
                    <ActivityIndicator size="small" color={colors.surface.base} />
                  ) : (
                    <>
                      <CRIcon name="checkmark-circle-outline" size={18} color={colors.surface.base} />
                      <Text style={styles.safeBtnText}>I'm Safe</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.falseAlarmBtn}
                  onPress={handleReportFalseAlarm}
                  activeOpacity={0.8}
                  disabled={isReportingSafe}
                >
                  <Text style={styles.falseAlarmText}>Accidental Activation / Cancel SOS</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.baseBackground,
  },
  minimizedBanner: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.semantic.danger,
    borderRadius: radii.lg || 16,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    shadowColor: colors.semantic.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  minimizedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface.base,
  },
  minimizedText: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    color: colors.surface.base,
    letterSpacing: 0.5,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.surface.base,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.semantic.danger,
  },
  headerTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.semantic.danger,
    letterSpacing: -0.3,
  },
  minimizeBtn: {
    backgroundColor: colors.brand.baseBackground,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.md || 10,
  },
  minimizeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  statusCallout: {
    backgroundColor: '#F3E0DD',
    borderWidth: 1.5,
    borderColor: '#B23A2F',
    borderRadius: radii.lg || 16,
    padding: spacing.md,
  },
  calloutTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: '#B23A2F',
    marginBottom: 4,
  },
  calloutSub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },
  intentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: '#DCFCE7',
    padding: 8,
    borderRadius: radii.sm || 8,
    marginTop: spacing.sm,
  },
  intentText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#15803D',
  },
  card: {
    backgroundColor: colors.surface.base,
    borderRadius: radii.lg || 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardHeader: {
    fontFamily: fonts.extrabold,
    fontSize: 11,
    color: colors.text.muted,
    letterSpacing: 1,
    marginBottom: spacing.sm + 2,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    marginBottom: spacing.sm + 4,
  },
  milestoneCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand.baseBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  milestoneCheckActive: {
    backgroundColor: '#16A34A',
  },
  milestoneTextWrap: {
    flex: 1,
  },
  milestoneTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.text.primary,
  },
  milestoneTitlePending: {
    color: colors.text.muted,
  },
  milestoneSub: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.secondary,
    marginTop: 1,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  contactName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text.primary,
  },
  contactPhone: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.secondary,
  },
  deliveryPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.sm || 6,
  },
  deliveryDelivered: { backgroundColor: '#DCFCE7' },
  deliverySent: { backgroundColor: '#FEF3C7' },
  deliveryFailed: { backgroundColor: '#FEE2E2' },
  deliveryUnavailable: { backgroundColor: '#F1F5F9' },
  deliveryPillText: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  emptyContactsText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text.muted,
  },
  categoryPrompt: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.md || 10,
    backgroundColor: colors.brand.baseBackground,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  categoryBtnSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  categoryLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text.primary,
  },
  categoryLabelSelected: {
    color: colors.brand.onGoldText,
  },
  dialerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dialerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingVertical: 12,
    borderRadius: radii.lg || 14,
  },
  dialerSecurity: {
    backgroundColor: colors.brand.primary,
  },
  dialerEmergency: {
    backgroundColor: colors.semantic.danger,
  },
  dialerText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.surface.base,
  },
  resolutionContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  safeConfirmedBox: {
    backgroundColor: colors.surface.base,
    borderRadius: radii.lg || 16,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.semantic.success,
  },
  safeConfirmedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  safeConfirmedText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  safeConfirmedSubtext: {
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
  },
  dismissSafeBtn: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  dismissSafeBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  safeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.semantic.danger,
    paddingVertical: 14,
    borderRadius: radii.lg || 14,
  },
  safeBtnText: {
    fontFamily: fonts.extrabold,
    fontSize: 14,
    color: colors.surface.base,
    letterSpacing: 0.2,
  },
  falseAlarmBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  falseAlarmText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text.muted,
    textDecorationLine: 'underline',
  },
});

export default GlobalEmergencyOverlay;
