// frontend/src/components/safety/SafetyPreferencesModal.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, fonts } from '../../theme';
import { CRIcon } from '../common';
import { useSafety } from '../../context/SafetyContext';

export const SafetyPreferencesModal = ({
  visible,
  onClose,
  onOpenContacts,
  onOpenDisclosure,
}) => {
  const insets = useSafeAreaInsets();
  const { safetyPreferences, updatePreferences, trustedContacts } = useSafety();

  const [autoShare, setAutoShare] = useState(safetyPreferences?.autoShareAllRides || false);
  const [saving, setSaving] = useState(false);

  const handleToggleAutoShare = async (val) => {
    setAutoShare(val);
    try {
      setSaving(true);
      await updatePreferences({
        autoShareAllRides: val,
        selectedTrustedContactIds: safetyPreferences?.selectedTrustedContactIds || [],
      });
    } catch (err) {
      setAutoShare(!val);
      Alert.alert('Update Failed', err.message || 'Could not save preference.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <Text style={styles.title}>Safety Preferences</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <CRIcon name="close" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Auto-Share Rides</Text>
              <Text style={styles.settingSub}>
                Automatically notify verified trusted contacts when you begin a trip.
              </Text>
            </View>
            <Switch
              value={autoShare}
              onValueChange={handleToggleAutoShare}
              trackColor={{ false: colors.border.subtle, true: colors.brand.primary }}
              thumbColor={colors.surface.base}
              disabled={saving}
            />
          </View>

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => {
              onClose();
              if (onOpenContacts) onOpenContacts();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.navRowLeft}>
              <CRIcon name="people-outline" size={18} color={colors.text.primary} />
              <View>
                <Text style={styles.navRowTitle}>Manage Trusted Contacts</Text>
                <Text style={styles.navRowSub}>{trustedContacts.length} of 5 contacts added</Text>
              </View>
            </View>
            <CRIcon name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => {
              onClose();
              if (onOpenDisclosure) onOpenDisclosure();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.navRowLeft}>
              <CRIcon name="document-text-outline" size={18} color={colors.text.primary} />
              <View>
                <Text style={styles.navRowTitle}>Safety & Location Disclosure</Text>
                <Text style={styles.navRowSub}>Review data handling and safety protocols</Text>
              </View>
            </View>
            <CRIcon name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Close</Text>
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
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.baseBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface.base,
    padding: spacing.md,
    borderRadius: radii.lg || 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.sm,
  },
  settingTextWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.text.primary,
  },
  settingSub: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.secondary,
    lineHeight: 16,
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface.base,
    padding: spacing.md,
    borderRadius: radii.lg || 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.sm,
  },
  navRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  navRowTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.text.primary,
  },
  navRowSub: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.secondary,
    marginTop: 1,
  },
  doneBtn: {
    backgroundColor: colors.brand.baseBackground,
    paddingVertical: 12,
    borderRadius: radii.md || 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  doneBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text.primary,
  },
});

export default SafetyPreferencesModal;
