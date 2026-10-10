// frontend/src/components/safety/SomethingFeelsWrongSheet.js
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
  Linking,
  Platform,
} from 'react-native';
import { colors, radii, spacing, fonts } from '../../theme';
import { CRIcon } from '../common';
import { safetyService } from '../../api/services/safetyService';

const CONCERN_CATEGORIES = [
  { id: 'harassment', label: 'Driver conduct / uncomfortable interaction', icon: 'person-outline' },
  { id: 'dangerous_driving', label: 'Unsafe driving / speeding', icon: 'speedometer-outline' },
  { id: 'vehicle_condition', label: 'Vehicle condition / mismatch', icon: 'car-outline' },
  { id: 'service_concern', label: 'Service concern', icon: 'alert-circle-outline' },
  { id: 'other', label: 'Route deviation / other concern', icon: 'map-outline' },
];

export const SomethingFeelsWrongSheet = ({
  visible,
  onClose,
  activeBooking,
  onLaunchSOS,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReset = () => {
    setSelectedCategory(null);
    setDescription('');
    setIsSubmitting(false);
    setIsSubmitted(false);
    onClose();
  };

  const handleSubmitConcern = async () => {
    if (!selectedCategory) {
      Alert.alert('Selection Required', 'Please select what feels wrong.');
      return;
    }

    try {
      setIsSubmitting(true);
      const descText = description.trim() 
        ? `In-ride concern: ${description.trim()}`
        : `In-ride concern recorded during active trip: ${selectedCategory}`;

      await safetyService.createIncidentReport({
        bookingId: activeBooking?._id || activeBooking?.id || null,
        category: selectedCategory,
        description: descText.length >= 10 ? descText : `${descText} (reported via in-ride prompt)`,
        severity: selectedCategory === 'harassment' || selectedCategory === 'dangerous_driving' ? 'high' : 'medium',
      });

      setIsSubmitted(true);
    } catch (err) {
      Alert.alert('Report Failed', err.message || 'Could not record concern.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImmediateSOS = () => {
    handleReset();
    if (onLaunchSOS) {
      onLaunchSOS();
    }
  };

  const handleCall112 = () => {
    Linking.openURL('tel:112').catch(() => {
      Alert.alert('Call Failed', 'Unable to launch native phone dialer for 112');
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleReset}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleReset} />

        <View style={styles.sheetContainer}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.warningIconWrap}>
                <CRIcon name="shield-outline" size={18} color="#C9761F" />
              </View>
              <Text style={styles.sheetTitle}>Something feels wrong?</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleReset} activeOpacity={0.7}>
              <CRIcon name="close" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {isSubmitted ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconWrap}>
                <CRIcon name="checkmark-circle" size={32} color="#16A34A" />
              </View>
              <Text style={styles.successTitle}>Your concern has been recorded</Text>
              <Text style={styles.successSub}>
                CampusRide has logged this safety concern. If you are in immediate physical danger, please activate SOS below or call emergency services directly.
              </Text>

              <TouchableOpacity style={styles.sosButton} onPress={handleImmediateSOS} activeOpacity={0.8}>
                <CRIcon name="alert-circle" size={18} color={colors.surface.base} />
                <Text style={styles.sosButtonText}>Activate Emergency SOS</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneButton} onPress={handleReset} activeOpacity={0.8}>
                <Text style={styles.doneButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetSubtitle}>
                Tell us what you are experiencing so we can log it with your trip context.
              </Text>

              <View style={styles.categoryList}>
                {CONCERN_CATEGORIES.map((c) => {
                  const selected = selectedCategory === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                      onPress={() => setSelectedCategory(c.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.categoryIconWrap, selected && styles.categoryIconWrapSelected]}>
                        <CRIcon
                          name={c.icon}
                          size={18}
                          color={selected ? colors.surface.base : colors.text.primary}
                        />
                      </View>
                      <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ADDITIONAL DETAILS (OPTIONAL)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe the situation or location..."
                  placeholderTextColor={colors.text.muted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Immediate Danger Callout */}
              <View style={styles.dangerNotice}>
                <Text style={styles.dangerNoticeText}>In immediate physical danger?</Text>
                <View style={styles.dangerActionsRow}>
                  <TouchableOpacity style={styles.sosMiniBtn} onPress={handleImmediateSOS} activeOpacity={0.8}>
                    <Text style={styles.sosMiniText}>Activate SOS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.call112Btn} onPress={handleCall112} activeOpacity={0.8}>
                    <Text style={styles.call112Text}>Call 112</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitConcern}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.surface.base} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Record Safety Concern</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
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
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.lg,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  warningIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.baseBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm + 2,
  },
  scroll: {
    flexGrow: 0,
  },
  categoryList: {
    gap: 8,
    marginBottom: spacing.sm + 2,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 10,
    borderRadius: radii.md || 12,
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  categoryCardSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primaryTint,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.baseBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconWrapSelected: {
    backgroundColor: colors.brand.primary,
  },
  categoryLabel: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.text.primary,
    flex: 1,
  },
  categoryLabelSelected: {
    color: colors.brand.primary,
  },
  inputGroup: {
    marginBottom: spacing.sm + 2,
  },
  inputLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 10.5,
    color: colors.text.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.md || 10,
    padding: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.text.primary,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  dangerNotice: {
    backgroundColor: '#F3E0DD',
    borderWidth: 1,
    borderColor: '#B23A2F',
    borderRadius: radii.md || 12,
    padding: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dangerNoticeText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: '#B23A2F',
    flex: 1,
  },
  dangerActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sosMiniBtn: {
    backgroundColor: '#B23A2F',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm || 6,
  },
  sosMiniText: {
    fontFamily: fonts.extrabold,
    fontSize: 10.5,
    color: colors.surface.base,
  },
  call112Btn: {
    backgroundColor: colors.text.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm || 6,
  },
  call112Text: {
    fontFamily: fonts.extrabold,
    fontSize: 10.5,
    color: colors.surface.base,
  },
  submitButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 14,
    borderRadius: radii.lg || 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  submitButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.surface.base,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  successIconWrap: {
    marginBottom: spacing.xs,
  },
  successTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 4,
  },
  successSub: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#B23A2F',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg || 14,
    width: '100%',
    marginBottom: spacing.xs + 2,
  },
  sosButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.surface.base,
  },
  doneButton: {
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.text.secondary,
  },
});

export default SomethingFeelsWrongSheet;
