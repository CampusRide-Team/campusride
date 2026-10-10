// frontend/src/components/safety/TrustedContactsModal.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, fonts } from '../../theme';
import { CRIcon } from '../common';
import { useSafety } from '../../context/SafetyContext';

const RELATIONSHIPS = [
  { id: 'parent', label: 'Parent' },
  { id: 'sibling', label: 'Sibling' },
  { id: 'friend', label: 'Friend' },
  { id: 'partner', label: 'Partner' },
  { id: 'guardian', label: 'Guardian' },
  { id: 'other', label: 'Other' },
];

export const TrustedContactsModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const {
    trustedContacts,
    contactsLoading,
    addContact,
    updateContact,
    deleteContact,
    requestVerification,
  } = useSafety();

  // Subview State: 'list' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState('list');
  const [editingContactId, setEditingContactId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relationship, setRelationship] = useState('friend');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setPhoneNumber('');
    setRelationship('friend');
    setEditingContactId(null);
    setViewMode('list');
  };

  const handleOpenAdd = () => {
    if (trustedContacts.length >= 5) {
      Alert.alert('Contact Limit Reached', 'You can register a maximum of 5 trusted contacts.');
      return;
    }
    resetForm();
    setViewMode('add');
  };

  const handleOpenEdit = (contact) => {
    setName(contact.name);
    setPhoneNumber(contact.phoneNumber);
    setRelationship(contact.relationship || 'friend');
    setEditingContactId(contact._id || contact.id);
    setViewMode('edit');
  };

  const handleSaveContact = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a contact name.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number (e.g. 0241234567).');
      return;
    }

    try {
      setSubmitting(true);
      if (viewMode === 'add') {
        await addContact({ name: name.trim(), phoneNumber: phoneNumber.trim(), relationship });
        Alert.alert('Contact Added', `${name} has been added to your trusted contacts.`);
      } else if (viewMode === 'edit' && editingContactId) {
        await updateContact(editingContactId, { name: name.trim(), phoneNumber: phoneNumber.trim(), relationship });
        Alert.alert('Contact Updated', 'Trusted contact details updated.');
      }
      resetForm();
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Could not save trusted contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      'Remove Trusted Contact',
      `Are you sure you want to remove ${contact.name} from your trusted contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContact(contact._id || contact.id);
            } catch (err) {
              Alert.alert('Delete Failed', err.message || 'Could not remove contact.');
            }
          },
        },
      ]
    );
  };

  const handleRequestVerification = async (contact) => {
    try {
      const res = await requestVerification(contact._id || contact.id);
      if (res.delivery?.status === 'unavailable') {
        Alert.alert(
          'Verification Notice',
          'Automated SMS verification is currently pending provider configuration. Your contact remains saved in pending status.'
        );
      } else {
        Alert.alert('Verification Sent', `A verification code was sent to ${contact.phoneNumber}.`);
      }
    } catch (err) {
      Alert.alert('Request Failed', err.message || 'Could not request verification.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={viewMode === 'list' ? onClose : resetForm}
            activeOpacity={0.7}
          >
            <CRIcon name={viewMode === 'list' ? 'close' : 'arrow-back'} size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {viewMode === 'list'
              ? 'Trusted Contacts'
              : viewMode === 'add'
              ? 'Add Trusted Contact'
              : 'Edit Contact'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {viewMode === 'list' ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Info Banner */}
            <View style={styles.infoBox}>
              <CRIcon name="shield-checkmark-outline" size={20} color={colors.brand.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Safety Network ({trustedContacts.length}/5)</Text>
                <Text style={styles.infoText}>
                  Trusted contacts receive emergency notification alerts with your trip context when SOS is activated.
                </Text>
              </View>
            </View>

            {contactsLoading ? (
              <ActivityIndicator style={{ marginTop: 24 }} size="small" color={colors.brand.primary} />
            ) : trustedContacts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <CRIcon name="people-outline" size={28} color={colors.text.muted} />
                </View>
                <Text style={styles.emptyTitle}>No Trusted Contacts Yet</Text>
                <Text style={styles.emptySub}>
                  Add family members or close friends so CampusRide can notify them during emergencies.
                </Text>
              </View>
            ) : (
              <View style={styles.contactsList}>
                {trustedContacts.map((c) => {
                  const isVerified = c.verificationStatus === 'verified';
                  return (
                    <View key={c._id || c.id} style={styles.contactCard}>
                      <View style={styles.contactMain}>
                        <View style={styles.contactAvatar}>
                          <Text style={styles.avatarText}>
                            {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                          </Text>
                        </View>
                        <View style={styles.contactDetails}>
                          <View style={styles.nameRow}>
                            <Text style={styles.contactName}>{c.name}</Text>
                            <View style={[styles.badge, isVerified ? styles.badgeVerified : styles.badgePending]}>
                              <Text style={[styles.badgeText, isVerified ? styles.badgeTextVerified : styles.badgeTextPending]}>
                                {isVerified ? 'VERIFIED' : 'PENDING'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.contactPhone}>{c.phoneNumber} • {c.relationship?.toUpperCase()}</Text>
                        </View>
                      </View>

                      {/* Actions Row */}
                      <View style={styles.contactActionsRow}>
                        {!isVerified && (
                          <TouchableOpacity
                            style={styles.verifyBtn}
                            onPress={() => handleRequestVerification(c)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.verifyBtnText}>Verify Number</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => handleOpenEdit(c)}
                          activeOpacity={0.7}
                        >
                          <CRIcon name="pencil-outline" size={14} color={colors.text.secondary} />
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteContact(c)}
                          activeOpacity={0.7}
                        >
                          <CRIcon name="trash-outline" size={14} color="#B23A2F" />
                          <Text style={styles.deleteBtnText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Add Contact Button */}
            {trustedContacts.length < 5 && (
              <TouchableOpacity
                style={styles.addContactBtn}
                onPress={handleOpenAdd}
                activeOpacity={0.8}
              >
                <CRIcon name="add" size={20} color={colors.surface.base} />
                <Text style={styles.addContactBtnText}>Add Trusted Contact</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          /* ADD / EDIT FORM */
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Kwame Mensah"
                placeholderTextColor={colors.text.muted}
                value={name}
                onChangeText={setName}
                maxLength={80}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>PHONE NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 0241234567 or +233241234567"
                placeholderTextColor={colors.text.muted}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={20}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>RELATIONSHIP</Text>
              <View style={styles.relGrid}>
                {RELATIONSHIPS.map((r) => {
                  const selected = relationship === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.relBtn, selected && styles.relBtnSelected]}
                      onPress={() => setRelationship(r.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.relBtnText, selected && styles.relBtnTextSelected]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSaveContact}
              activeOpacity={0.8}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.surface.base} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {viewMode === 'add' ? 'Save Trusted Contact' : 'Update Contact'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.baseBackground },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.surface.base,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    backgroundColor: colors.brand.baseBackground,
    padding: spacing.md,
    borderRadius: radii.lg || 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  infoTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text.primary,
  },
  infoText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.secondary,
    lineHeight: 16,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.baseBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  contactsList: {
    gap: spacing.sm + 2,
  },
  contactCard: {
    backgroundColor: colors.surface.base,
    borderRadius: radii.lg || 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  contactMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.surface.base,
  },
  contactDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  contactName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text.primary,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.sm || 4,
  },
  badgeVerified: { backgroundColor: '#DCFCE7' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  badgeTextVerified: { color: '#16A34A' },
  badgeTextPending: { color: '#D97706' },
  contactPhone: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.secondary,
  },
  contactActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  verifyBtn: {
    backgroundColor: colors.brand.baseBackground,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm || 6,
    marginRight: 'auto',
  },
  verifyBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.brand.primary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: colors.text.secondary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: '#B23A2F',
  },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.brand.primary,
    paddingVertical: 14,
    borderRadius: radii.lg || 14,
    marginTop: spacing.xs,
  },
  addContactBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.brand.onGoldText,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 11,
    color: colors.text.muted,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.md || 12,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm + 4 : spacing.sm,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.text.primary,
  },
  relGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  relBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.md || 10,
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  relBtnSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  relBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text.primary,
  },
  relBtnTextSelected: {
    color: colors.brand.onGoldText,
  },
  submitBtn: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 14,
    borderRadius: radii.lg || 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  submitBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.surface.base,
  },
});

export default TrustedContactsModal;
