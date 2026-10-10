// frontend/src/components/safety/SafetyDisclosureModal.js
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, fonts } from '../../theme';
import { CRIcon } from '../common';
import { useSafety } from '../../context/SafetyContext';

export const SafetyDisclosureModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { acceptDisclosure } = useSafety();

  const handleAcknowledge = async () => {
    try {
      await acceptDisclosure('1.0');
    } catch (e) {
      // Non-blocking
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <CRIcon name="shield-checkmark" size={22} color={colors.brand.primary} />
            </View>
            <Text style={styles.title}>CampusRide Safety Standards</Text>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.intro}>
              CampusRide is committed to providing a safe, reliable commuting experience for University of Ghana students and staff.
            </Text>

            <View style={styles.pointRow}>
              <CRIcon name="radio-button-on" size={12} color={colors.brand.primary} style={{ marginTop: 4 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>Emergency SOS & Location</Text>
                <Text style={styles.pointSub}>
                  When you activate SOS, your device's current location and active trip details may be transmitted to CampusRide operators to assist emergency response.
                </Text>
              </View>
            </View>

            <View style={styles.pointRow}>
              <CRIcon name="radio-button-on" size={12} color={colors.brand.primary} style={{ marginTop: 4 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>Trusted Contacts</Text>
                <Text style={styles.pointSub}>
                  Verified trusted contacts receive automated notifications with your ride details during active emergencies.
                </Text>
              </View>
            </View>

            <View style={styles.pointRow}>
              <CRIcon name="radio-button-on" size={12} color={colors.brand.primary} style={{ marginTop: 4 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>External Emergency Services</Text>
                <Text style={styles.pointSub}>
                  Campus Security and National Emergency Services (112) operate independently from CampusRide. Direct dial triggers launch standard native phone calls.
                </Text>
              </View>
            </View>

            <View style={styles.pointRow}>
              <CRIcon name="radio-button-on" size={12} color={colors.brand.primary} style={{ marginTop: 4 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>Shared-Ride Privacy</Text>
                <Text style={styles.pointSub}>
                  In shared rides, personal identities, phone numbers, and private stops of co-passengers are never disclosed.
                </Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.acceptBtn} onPress={handleAcknowledge} activeOpacity={0.8}>
            <Text style={styles.acceptBtnText}>I Understand & Agree</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 24, 21, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface.elevated,
    borderTopLeftRadius: radii.xl || 28,
    borderTopRightRadius: radii.xl || 28,
    borderTopWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(200, 159, 62, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  scroll: {
    marginVertical: spacing.xs,
  },
  intro: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pointTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text.primary,
  },
  pointSub: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.secondary,
    lineHeight: 16,
    marginTop: 2,
  },
  acceptBtn: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 14,
    borderRadius: radii.lg || 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  acceptBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.surface.base,
  },
});

export default SafetyDisclosureModal;
