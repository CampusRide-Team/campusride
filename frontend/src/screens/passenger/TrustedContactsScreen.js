import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CRIcon } from '../../components/common';
import TrustedContactsModal from '../../components/safety/TrustedContactsModal';
import { useSafety } from '../../context/SafetyContext';
import { useTheme } from '../../context/ThemeContext';
import { fonts, spacing } from '../../theme';

const SHARE_MODES = [
  { id: 'every_ride', title: 'Every ride', subtitle: 'Share trip progress whenever a ride starts' },
  { id: 'night_only', title: 'Only rides at night', subtitle: 'Automatically share rides from 9 p.m. to 6 a.m.' },
  { id: 'never', title: 'Never share automatically', subtitle: 'Emergency SOS alerts can still be sent' },
];

export default function TrustedContactsScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { trustedContacts, contactsLoading, refreshContacts, updateContact } = useSafety();
  const [selectedId, setSelectedId] = useState(null);
  const [shareMode, setShareMode] = useState('never');
  const [saving, setSaving] = useState(false);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => { refreshContacts(); }, [refreshContacts]);
  useEffect(() => {
    if (!selectedId && trustedContacts[0]) setSelectedId(trustedContacts[0]._id || trustedContacts[0].id);
  }, [trustedContacts, selectedId]);

  const selectedContact = useMemo(
    () => trustedContacts.find((contact) => String(contact._id || contact.id) === String(selectedId)) || null,
    [trustedContacts, selectedId],
  );

  useEffect(() => {
    if (!selectedContact) return;
    const existing = selectedContact.notificationPreferences?.rideShareMode
      || (selectedContact.notificationPreferences?.rideStartShare ? 'every_ride' : 'never');
    setShareMode(existing);
  }, [selectedContact]);

  const save = async () => {
    if (!selectedContact) {
      setShowManager(true);
      return;
    }
    try {
      setSaving(true);
      await updateContact(selectedContact._id || selectedContact.id, {
        notificationPreferences: { rideShareMode: shareMode, rideStartShare: shareMode !== 'never' },
      });
      Alert.alert('Sharing updated', `Ride-sharing settings for ${selectedContact.name} were saved.`);
    } catch (error) {
      Alert.alert('Could not save', error.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.brand.baseBackground }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}><CRIcon name="arrow-back" size={22} color={colors.text.primary} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Trusted contacts</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowManager(true)}><CRIcon name="add" size={24} color={colors.brand.primary} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) + 86 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.heroTitle, { color: colors.text.primary }]}>Who should receive your ride updates?</Text>
        <Text style={[styles.heroCopy, { color: colors.text.secondary }]}>Choose a trusted contact, then decide when CampusRide should share your ride with them.</Text>

        {contactsLoading ? <ActivityIndicator style={styles.loader} color={colors.brand.primary} /> : trustedContacts.length === 0 ? (
          <TouchableOpacity style={[styles.emptyCard, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]} onPress={() => setShowManager(true)}>
            <CRIcon name="person-add-outline" size={30} color={colors.brand.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Add your first emergency contact</Text>
            <Text style={[styles.emptyCopy, { color: colors.text.secondary }]}>You can register up to five trusted people.</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contactRail}>
            {trustedContacts.map((contact) => {
              const id = contact._id || contact.id;
              const selected = String(id) === String(selectedId);
              return (
                <TouchableOpacity key={id} style={[styles.contactCard, { borderColor: selected ? colors.brand.primary : colors.border.subtle, backgroundColor: selected ? colors.brand.primaryTint : colors.surface.base }]} onPress={() => setSelectedId(id)}>
                  <View style={[styles.avatar, { backgroundColor: colors.brand.primary }]}><Text style={[styles.avatarText, { color: colors.brand.onGoldText }]}>{contact.name?.charAt(0)?.toUpperCase() || 'C'}</Text></View>
                  <Text style={[styles.contactName, { color: colors.text.primary }]} numberOfLines={1}>{contact.name}</Text>
                  <Text style={[styles.contactPhone, { color: colors.text.secondary }]} numberOfLines={1}>{contact.phoneNumber}</Text>
                  {selected ? <CRIcon name="checkmark-circle" size={18} color={colors.brand.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {selectedContact ? (
          <View style={styles.settingsSection}>
            <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>SHARE SETTINGS</Text>
            <Text style={[styles.sectionIntro, { color: colors.text.secondary }]}>Choose when rides are shared with {selectedContact.name}.</Text>
            <View style={[styles.settingsCard, { borderColor: colors.border.subtle, backgroundColor: colors.surface.base }]}>
              {SHARE_MODES.map((mode, index) => {
                const selected = shareMode === mode.id;
                return (
                  <TouchableOpacity key={mode.id} style={[styles.optionRow, index < SHARE_MODES.length - 1 && { borderBottomColor: colors.border.divider, borderBottomWidth: 1 }]} onPress={() => setShareMode(mode.id)}>
                    <View style={styles.optionCopy}>
                      <Text style={[styles.optionTitle, { color: colors.text.primary }]}>{mode.title}</Text>
                      <Text style={[styles.optionSubtitle, { color: colors.text.secondary }]}>{mode.subtitle}</Text>
                    </View>
                    <View style={[styles.radio, { borderColor: selected ? colors.brand.primary : colors.border.subtle, backgroundColor: selected ? colors.brand.primary : colors.surface.tile }]}>
                      {selected ? <CRIcon name="checkmark" size={18} color={colors.brand.onGoldText} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.manageLink} onPress={() => setShowManager(true)}>
              <CRIcon name="pencil-outline" size={16} color={colors.brand.primary} />
              <Text style={[styles.manageText, { color: colors.brand.primary }]}>Edit contact details</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.brand.baseBackground, paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.brand.primary, opacity: saving ? 0.65 : 1 }]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.brand.onGoldText} /> : <Text style={[styles.saveText, { color: colors.brand.onGoldText }]}>{selectedContact ? 'Save and close' : 'Add trusted contact'}</Text>}
        </TouchableOpacity>
      </View>
      <TrustedContactsModal visible={showManager} onClose={() => { setShowManager(false); refreshContacts(); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 18, letterSpacing: -0.35 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  heroTitle: { fontFamily: fonts.extraBold, fontSize: 27, lineHeight: 33, letterSpacing: -0.75, maxWidth: 340 },
  heroCopy: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 20, marginTop: spacing.xs, marginBottom: spacing.lg },
  loader: { marginVertical: spacing.xl },
  contactRail: { gap: spacing.sm, paddingBottom: spacing.lg },
  contactCard: { width: 142, minHeight: 150, borderWidth: 1.5, borderRadius: 20, padding: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarText: { fontFamily: fonts.extraBold, fontSize: 18 },
  contactName: { fontFamily: fonts.extraBold, fontSize: 14 },
  contactPhone: { fontFamily: fonts.medium, fontSize: 11, marginTop: 2, marginBottom: 7 },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { fontFamily: fonts.extraBold, fontSize: 16, marginTop: spacing.sm },
  emptyCopy: { fontFamily: fonts.medium, fontSize: 12, marginTop: 3 },
  settingsSection: { marginTop: spacing.sm },
  sectionLabel: { fontFamily: fonts.extraBold, fontSize: 11, letterSpacing: 0.9 },
  sectionIntro: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, marginTop: 8, marginBottom: spacing.md },
  settingsCard: { borderWidth: 1, borderRadius: 20, paddingHorizontal: spacing.md },
  optionRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center' },
  optionCopy: { flex: 1, paddingRight: spacing.md },
  optionTitle: { fontFamily: fonts.extraBold, fontSize: 15 },
  optionSubtitle: { fontFamily: fonts.medium, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  radio: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  manageLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.md },
  manageText: { fontFamily: fonts.bold, fontSize: 13 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  saveButton: { height: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: fonts.extraBold, fontSize: 16 },
});
