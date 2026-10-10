import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts, spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../../components/common';
import { useSafety } from '../../context/SafetyContext';
import {
  EmergencyHoldButton,
  TrustedContactsModal,
  ReportConcernModal,
  SafetyDisclosureModal,
} from '../../components/safety';
import { triggerCampusSecurityCall, triggerNationalEmergencyCall } from '../../config/safetyConfig';

export default function SafetyCenterScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const {
    activeEmergency,
    isEmergencyActive,
    triggerSOS,
    isActivatingSOS,
    reportSafe,
    clearEmergency,
    trustedContacts,
  } = useSafety();

  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDisclosureModal, setShowDisclosureModal] = useState(false);
  const [isSubmittingSafe, setIsSubmittingSafe] = useState(false);

  // Digital elapsed timer for active SOS (e.g. 00:02:15)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isEmergencyActive && activeEmergency) {
      const startTime = new Date(activeEmergency.createdAt || Date.now()).getTime();
      const updateElapsed = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - startTime) / 1000));
        setElapsedSeconds(diff);
      };
      updateElapsed();
      timerRef.current = setInterval(updateElapsed, 1000);
    } else {
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isEmergencyActive, activeEmergency]);

  const formatTimer = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const startTimeString = activeEmergency?.createdAt
    ? new Date(activeEmergency.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const hasPassengerReportedSafe =
    activeEmergency?.passengerResolutionIntent?.intent === 'safe' ||
    activeEmergency?.status === 'resolved';

  const isAck = Boolean(
    activeEmergency?.acknowledgement?.acknowledgedAt ||
    activeEmergency?.status === 'acknowledged' ||
    activeEmergency?.status === 'responding' ||
    activeEmergency?.status === 'resolved' ||
    activeEmergency?.timeline?.some(t => t.type === 'acknowledged')
  );

  const isResponding =
    activeEmergency?.status === 'responding' ||
    activeEmergency?.status === 'resolved' ||
    Boolean(activeEmergency?.escalation?.escalatedAt);

  const isResolved = activeEmergency?.status === 'resolved';

  const coordsLabel = activeEmergency?.location?.coordinates
    ? `${Number(activeEmergency.location.coordinates[1]).toFixed(4)}° N, ${Number(activeEmergency.location.coordinates[0]).toFixed(4)}° W`
    : 'University of Ghana, Legon';

  const handleSOSActivation = async () => {
    try {
      await triggerSOS({ source: 'safety_center_fab', initialCategory: 'personal_safety_threat' });
    } catch {
      Alert.alert(
        'Emergency Request Error',
        'Could not reach CampusRide emergency dispatch. You can still call emergency services directly.',
        [
          { text: 'Call 112', onPress: triggerNationalEmergencyCall },
          { text: 'Close', style: 'cancel' },
        ]
      );
    }
  };

  const handleReportSafeAction = async () => {
    Alert.alert(
      'Confirm You Are Safe',
      'This will notify Campus Security and the CampusRide dispatch team that you are now safe.',
      [
        { text: 'Back', style: 'cancel' },
        {
          text: "I'm Safe",
          style: 'default',
          onPress: async () => {
            try {
              setIsSubmittingSafe(true);
              await reportSafe({ reason: 'user_reported_safe', notes: 'Passenger confirmed safe via Safety Center' });
            } catch (err) {
              Alert.alert('Notice', err.message || 'Safe report submitted to Campus Security.');
            } finally {
              setIsSubmittingSafe(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelSOSAction = async () => {
    Alert.alert(
      'Cancel SOS',
      'Was this an accidental activation? Reporting false alarm will cancel the alert.',
      [
        { text: 'Keep Alert Active', style: 'cancel' },
        {
          text: 'Cancel SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmittingSafe(true);
              await reportSafe({ reason: 'false_alarm', notes: 'Passenger reported accidental activation' });
            } catch (err) {
              Alert.alert('Notice', err.message || 'Cancellation request sent.');
            } finally {
              setIsSubmittingSafe(false);
            }
          },
        },
      ]
    );
  };

  const quickActions = [
    { label: 'SOS', icon: 'alert-circle-outline', onPress: handleSOSActivation },
    { label: 'Contacts', icon: 'people-outline', onPress: () => navigation.navigate('TrustedContacts') },
    { label: 'Security', icon: 'call-outline', onPress: triggerCampusSecurityCall },
    { label: 'Guide', icon: 'book-outline', onPress: () => setShowDisclosureModal(true) },
  ];

  const primaryGroup = [
    {
      icon: 'people-outline',
      title: 'Trusted contacts',
      subtitle: `${trustedContacts.length}/5 configured · Automatic SMS alert`,
      onPress: () => navigation.navigate('TrustedContacts'),
    },
    {
      icon: 'book-outline',
      title: 'Ride safety guide',
      subtitle: 'Practical tips & verified driver protocols',
      onPress: () => setShowDisclosureModal(true),
    },
    {
      icon: 'flag-outline',
      title: 'Report a concern',
      subtitle: 'Help keep the campus community safe',
      onPress: () => setShowReportModal(true),
    },
  ];

  const emergencyGroup = [
    {
      icon: 'shield-checkmark-outline',
      title: 'Campus Security Dispatch',
      subtitle: 'Direct emergency telephone line to UG patrol',
      onPress: triggerCampusSecurityCall,
    },
    {
      icon: 'call-outline',
      title: 'National Emergency (112)',
      subtitle: 'Ghana Police Service & Ambulance',
      onPress: triggerNationalEmergencyCall,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.surface.base }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface.base}
      />

      {/* Top Header */}
      <View style={styles.topBar}>
        {navigation?.canGoBack?.() ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <CRIcon name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Safety Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ========================================================================= */}
        {/* ACTIVE SOS STATE — FULL EMERGENCY PROGRESSION PRESERVED                   */}
        {/* ========================================================================= */}
        {isEmergencyActive ? (
          <View style={styles.activeSosContainer}>
            {/* 1. Large Red / Coral SOS Active Card */}
            <View style={[styles.sosActiveCard, { backgroundColor: colors.semantic.dangerTint, borderColor: colors.semantic.danger }]}>
              <View style={[styles.sosIconCircle, { backgroundColor: colors.semantic.danger }]}>
                <CRIcon name="alert" size={24} color="#FFFFFF" />
              </View>

              <Text style={[styles.sosCardTitle, { color: colors.semantic.danger }]}>SOS Active</Text>
              <Text style={[styles.sosCardSubtitle, { color: colors.semantic.danger }]}>Help is on the way</Text>

              <Text style={[styles.sosCardDesc, { color: colors.text.secondary }]}>
                Your location has been shared with Campus Security. Started at {startTimeString}
              </Text>

              {/* Digital Elapsed Timer */}
              <Text style={[styles.digitalTimer, { color: colors.semantic.danger }]}>
                {formatTimer(elapsedSeconds)}
              </Text>

              {/* Actions based on state */}
              {hasPassengerReportedSafe ? (
                <View style={styles.safeConfirmedBox}>
                  <View style={styles.safeConfirmedHeader}>
                    <CRIcon name="checkmark-circle" size={20} color={colors.semantic.success} />
                    <Text style={[styles.safeConfirmedText, { color: colors.semantic.success }]}>
                      Safe Report Recorded
                    </Text>
                  </View>
                  <Text style={[styles.safeConfirmedSubtext, { color: colors.text.secondary }]}>
                    Campus Security dispatch has received your safety confirmation.
                  </Text>
                  <TouchableOpacity
                    style={[styles.dismissSafeBtn, { backgroundColor: colors.semantic.success }]}
                    onPress={clearEmergency}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dismissSafeBtnText}>Dismiss Alert</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.sosActionRow}>
                  <TouchableOpacity
                    style={[styles.imSafeButton, { backgroundColor: colors.semantic.danger }]}
                    onPress={handleReportSafeAction}
                    activeOpacity={0.85}
                    disabled={isSubmittingSafe}
                  >
                    {isSubmittingSafe ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.imSafeButtonText}>I'm Safe</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cancelSosButton, { borderColor: colors.semantic.danger }]}
                    onPress={handleCancelSOSAction}
                    activeOpacity={0.8}
                    disabled={isSubmittingSafe}
                  >
                    <Text style={[styles.cancelSosButtonText, { color: colors.semantic.danger }]}>Cancel SOS</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 2. Live Status Vertical Timeline in Grouped Tile */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.groupTitle, { color: colors.text.secondary }]}>LIVE STATUS</Text>

              <View style={[styles.groupedCard, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
                {/* Node 1: SOS alert sent */}
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDotChecked, { backgroundColor: colors.brand.primary }]}>
                    <CRIcon name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                  <View style={styles.timelineTextWrap}>
                    <Text style={[styles.timelineHeading, { color: colors.text.primary }]}>SOS alert sent</Text>
                    <Text style={[styles.timelineSub, { color: colors.text.secondary }]}>{startTimeString}</Text>
                  </View>
                </View>

                <View style={[styles.timelineTrackLine, { backgroundColor: colors.border.subtle }]} />

                {/* Node 2: Campus Security notified */}
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      isAck ? styles.timelineDotChecked : styles.timelineDotOpen,
                      {
                        backgroundColor: isAck ? colors.brand.primary : 'transparent',
                        borderColor: isAck ? colors.brand.primary : colors.border.subtle,
                      },
                    ]}
                  >
                    {isAck ? <CRIcon name="checkmark" size={12} color="#FFFFFF" /> : null}
                  </View>
                  <View style={styles.timelineTextWrap}>
                    <Text style={[styles.timelineHeading, { color: colors.text.primary }]}>Campus Security notified</Text>
                    <Text style={[styles.timelineSub, { color: isAck ? colors.text.secondary : colors.text.muted }]}>
                      {isAck
                        ? (activeEmergency?.acknowledgement?.acknowledgedAt
                            ? `Acknowledged at ${new Date(activeEmergency.acknowledgement.acknowledgedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                            : 'Acknowledged by security desk')
                        : 'Alert received by security desk'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.timelineTrackLine, { backgroundColor: colors.border.subtle }]} />

                {/* Node 3: Response Unit */}
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      isResponding ? styles.timelineDotChecked : styles.timelineDotOpen,
                      {
                        backgroundColor: isResponding ? colors.brand.primary : 'transparent',
                        borderColor: isResponding ? colors.brand.primary : colors.border.subtle,
                      },
                    ]}
                  >
                    {isResponding ? <CRIcon name="checkmark" size={12} color="#FFFFFF" /> : null}
                  </View>
                  <View style={styles.timelineTextWrap}>
                    <Text style={[styles.timelineHeading, { color: colors.text.primary }]}>Response Unit</Text>
                    <Text style={[styles.timelineSub, { color: isResponding ? colors.text.secondary : colors.text.muted }]}>
                      {isResponding
                        ? (activeEmergency?.escalation?.escalatedTo ? `Escalated to ${activeEmergency.escalation.escalatedTo}` : 'Patrol team dispatched')
                        : 'On standby for rapid response'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.timelineTrackLine, { backgroundColor: colors.border.subtle }]} />

                {/* Node 4: Resolution / Safe Status */}
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      hasPassengerReportedSafe ? styles.timelineDotChecked : styles.timelineDotOpen,
                      {
                        backgroundColor: hasPassengerReportedSafe
                          ? (isResolved ? colors.semantic.success : colors.brand.primary)
                          : 'transparent',
                        borderColor: hasPassengerReportedSafe
                          ? (isResolved ? colors.semantic.success : colors.brand.primary)
                          : colors.border.subtle,
                      },
                    ]}
                  >
                    {hasPassengerReportedSafe ? <CRIcon name="checkmark" size={12} color="#FFFFFF" /> : null}
                  </View>
                  <View style={styles.timelineTextWrap}>
                    <Text style={[styles.timelineHeading, { color: colors.text.primary }]}>
                      {isResolved
                        ? 'Case Resolved by Security'
                        : hasPassengerReportedSafe
                        ? 'Passenger Reported Safe'
                        : 'Case Active'}
                    </Text>
                    <Text style={[styles.timelineSub, { color: hasPassengerReportedSafe ? colors.text.secondary : colors.text.muted }]}>
                      {isResolved
                        ? 'Incident safely closed'
                        : hasPassengerReportedSafe
                        ? 'Awaiting final operator case closure'
                        : 'Emergency protocols active'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 3. Live Location Card */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.groupTitle, { color: colors.text.secondary }]}>YOUR LIVE LOCATION</Text>

              <View style={[styles.groupedCard, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
                <View style={styles.miniMapCanvas}>
                  <View style={styles.radarOuterRing}>
                    <View style={styles.radarMiddleRing}>
                      <View style={[styles.radarCoreDot, { backgroundColor: colors.semantic.danger }]} />
                    </View>
                  </View>

                  <View style={[styles.liveBadge, { backgroundColor: colors.semantic.danger }]}>
                    <Text style={styles.liveBadgeText}>★ Live</Text>
                  </View>

                  <View style={styles.locationStamp}>
                    <Text style={styles.locationStampText}>{coordsLabel}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* ========================================================================= */
          /* IDLE SAFETY CENTER STATE — REFERENCE B REDESIGN                           */
          /* ========================================================================= */
          <View>
            {/* 1. Large Summary Header (Reference B Style) */}
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryAvatarWrap, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
                <CRIcon name="shield-checkmark" size={38} color={colors.text.primary} />
                <View style={[styles.summaryBadge, { backgroundColor: colors.semantic.success }]}>
                  <CRIcon name="checkmark" size={12} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.nameRow}>
                <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
                  Campus Safety Center
                </Text>
                <CRIcon name="chevron-forward" size={18} color={colors.text.secondary} />
              </View>
              <Text style={[styles.summarySub, { color: colors.text.secondary }]}>
                Live security dispatch, emergency SOS & trusted contacts
              </Text>
            </View>

            {/* 2. Circular Quick Actions Row (Reference B Style) */}
            <View style={styles.quickRow}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={styles.quickAction}
                  onPress={action.onPress}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                >
                  <View style={[styles.quickIconCircle, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
                    <CRIcon name={action.icon} size={22} color={action.label === 'SOS' ? colors.semantic.danger : colors.text.primary} />
                  </View>
                  <Text style={[styles.quickLabel, { color: colors.text.primary }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 3. Grouped Light-Gray Section Cards (Reference B Style) */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.groupTitle, { color: colors.text.secondary }]}>SAFETY TOOLS</Text>
              <View style={[styles.groupedCard, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
                {primaryGroup.map((row, index) => (
                  <React.Fragment key={row.title}>
                    <TouchableOpacity
                      style={styles.menuRow}
                      onPress={row.onPress}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={row.title}
                    >
                      <View style={styles.menuIconWrap}>
                        <CRIcon name={row.icon} size={20} color={colors.text.primary} />
                      </View>
                      <View style={styles.menuTextCol}>
                        <Text style={[styles.menuTitle, { color: colors.text.primary }]}>{row.title}</Text>
                        <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>{row.subtitle}</Text>
                      </View>
                      <CRIcon name="chevron-forward" size={16} color={colors.text.muted} />
                    </TouchableOpacity>
                    {index < primaryGroup.length - 1 && (
                      <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* 4. Second Grouped Section Card: Emergency Hotlines */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.groupTitle, { color: colors.text.secondary }]}>HOTLINES & ASSISTANCE</Text>
              <View style={[styles.groupedCard, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
                {emergencyGroup.map((row, index) => (
                  <React.Fragment key={row.title}>
                    <TouchableOpacity
                      style={styles.menuRow}
                      onPress={row.onPress}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={row.title}
                    >
                      <View style={styles.menuIconWrap}>
                        <CRIcon name={row.icon} size={20} color={colors.text.primary} />
                      </View>
                      <View style={styles.menuTextCol}>
                        <Text style={[styles.menuTitle, { color: colors.text.primary }]}>{row.title}</Text>
                        <Text style={[styles.menuSubtitle, { color: colors.text.secondary }]}>{row.subtitle}</Text>
                      </View>
                      <CRIcon name="chevron-forward" size={16} color={colors.text.muted} />
                    </TouchableOpacity>
                    {index < emergencyGroup.length - 1 && (
                      <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* 5. Emergency SOS Hold-to-Activate Control */}
            <View style={styles.emergencyHoldContainer}>
              <EmergencyHoldButton
                onTriggerSOS={handleSOSActivation}
                isActivating={isActivatingSOS}
              />
            </View>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <TrustedContactsModal visible={showContactsModal} onClose={() => setShowContactsModal(false)} />
      <ReportConcernModal visible={showReportModal} onClose={() => setShowReportModal(false)} />
      <SafetyDisclosureModal visible={showDisclosureModal} onClose={() => setShowDisclosureModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    height: 52,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  summaryHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  summaryAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  summaryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  summarySub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 300,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
    paddingHorizontal: 4,
  },
  quickAction: {
    alignItems: 'center',
    width: 68,
    gap: 6,
  },
  quickIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  sectionWrap: {
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  groupedCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  menuSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    marginLeft: 40,
  },
  emergencyHoldContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  // Active SOS styles
  activeSosContainer: {
    gap: spacing.lg,
  },
  sosActiveCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: 'center',
  },
  sosIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  sosCardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    marginBottom: 2,
  },
  sosCardSubtitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  sosCardDesc: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  digitalTimer: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  sosActionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  imSafeButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imSafeButtonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  cancelSosButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelSosButtonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  safeConfirmedBox: {
    alignItems: 'center',
    width: '100%',
    paddingTop: spacing.xs,
  },
  safeConfirmedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  safeConfirmedText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  safeConfirmedSubtext: {
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  dismissSafeBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissSafeBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  // Timeline styles
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  timelineDotChecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  timelineDotOpen: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginRight: 12,
    marginTop: 2,
  },
  timelineTrackLine: {
    width: 2,
    height: 16,
    marginLeft: 10,
    marginVertical: -4,
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelineHeading: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  timelineSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  // Live location map
  miniMapCanvas: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarOuterRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(217, 66, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarMiddleRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(217, 66, 53, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCoreDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  locationStamp: {
    position: 'absolute',
    bottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(38, 38, 38, 0.7)',
  },
  locationStampText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#FFFFFF',
  },
});
