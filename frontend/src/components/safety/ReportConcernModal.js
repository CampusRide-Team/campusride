// frontend/src/components/safety/ReportConcernModal.js
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
import { safetyService } from '../../api/services/safetyService';

const INCIDENT_CATEGORIES = [
  { id: 'dangerous_driving', label: 'Dangerous Driving / Speeding' },
  { id: 'harassment', label: 'Harassment / Misconduct' },
  { id: 'physical_threat', label: 'Physical Safety Threat' },
  { id: 'vehicle_condition', label: 'Vehicle Condition / Defects' },
  { id: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
  { id: 'service_concern', label: 'Service concern' },
  { id: 'other', label: 'Other Safety Concern' },
];

const SEVERITY_LEVELS = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' },
];

export const ReportConcernModal = ({ visible, onClose, bookingId = null, bookingSummary = null }) => {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('dangerous_driving');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);

  const handleReset = () => {
    setCategory('dangerous_driving');
    setDescription('');
    setSeverity('medium');
    setIsSubmitting(false);
    setSubmittedReport(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!description.trim() || description.trim().length < 10) {
      Alert.alert('Detailed Description Required', 'Please provide at least 10 characters explaining your safety concern.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await safetyService.createIncidentReport({
        bookingId: bookingId || null,
        category,
        description: description.trim(),
        severity,
      });

      if (res.success && res.data?.report) {
        setSubmittedReport(res.data.report);
      } else {
        throw new Error(res.error?.message || 'Could not submit report');
      }
    } catch (err) {
      Alert.alert('Submission Failed', err.message || 'Could not record safety report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleReset}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleReset} activeOpacity={0.7}>
            <CRIcon name="close" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Safety Concern</Text>
          <View style={{ width: 36 }} />
        </View>

        {submittedReport ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconWrap}>
              <CRIcon name="checkmark-circle" size={44} color="#16A34A" />
            </View>
            <Text style={styles.successTitle}>Safety Report Submitted</Text>
            <Text style={styles.refText}>Reference ID: {submittedReport.reportReference}</Text>
            <Text style={styles.successSub}>
              Your report has been logged and forwarded to CampusRide Safety & Security operations for review.
            </Text>

            <View style={styles.receiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>CATEGORY</Text>
                <Text style={styles.receiptValue}>{submittedReport.category?.replace('_', ' ').toUpperCase()}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>STATUS</Text>
                <Text style={styles.receiptValue}>{submittedReport.status?.toUpperCase()}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {bookingSummary && (
              <View style={styles.contextBox}>
                <CRIcon name="car-outline" size={16} color={colors.brand.primary} />
                <Text style={styles.contextText}>
                  Reporting for ride to <Text style={{ fontWeight: '700' }}>{bookingSummary.dropoff || 'Campus'}</Text>
                </Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>CONCERN CATEGORY</Text>
              <View style={styles.optionsList}>
                {INCIDENT_CATEGORIES.map((cat) => {
                  const selected = category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.optionCard, selected && styles.optionCardSelected]}
                      onPress={() => setCategory(cat.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                        {selected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>SEVERITY LEVEL</Text>
              <View style={styles.severityGrid}>
                {SEVERITY_LEVELS.map((s) => {
                  const selected = severity === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.severityBtn, selected && styles.severityBtnSelected]}
                      onPress={() => setSeverity(s.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.severityText, selected && styles.severityTextSelected]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>DESCRIPTION (MINIMUM 10 CHARACTERS)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe what occurred, including vehicle details, location, or interaction context..."
                placeholderTextColor={colors.text.muted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={2000}
              />
              <Text style={styles.charCount}>{description.length}/2000</Text>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.surface.base} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Safety Report</Text>
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
  contextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.brand.baseBackground,
    padding: spacing.sm + 2,
    borderRadius: radii.md || 12,
  },
  contextText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.text.primary,
  },
  formGroup: { gap: 6 },
  formLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 11,
    color: colors.text.muted,
    letterSpacing: 0.8,
  },
  optionsList: { gap: 6 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.base,
    padding: 10,
    borderRadius: radii.md || 10,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  optionCardSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: '#FBFAF7',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.brand.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand.primary,
  },
  optionText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.primary,
    flex: 1,
  },
  optionTextSelected: {
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  severityGrid: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  severityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.md || 10,
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  severityBtnSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  severityText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text.primary,
  },
  severityTextSelected: {
    color: colors.brand.onGoldText,
  },
  textArea: {
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.md || 12,
    padding: spacing.sm + 2,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.primary,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.text.muted,
    textAlign: 'right',
  },
  submitBtn: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 14,
    borderRadius: radii.lg || 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  submitBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.brand.onGoldText,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successIconWrap: {
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: 4,
  },
  refText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.brand.primary,
    marginBottom: spacing.sm,
  },
  successSub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: colors.surface.base,
    borderRadius: radii.lg || 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.xs + 2,
    marginBottom: spacing.lg,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 11,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  receiptValue: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text.primary,
  },
  doneBtn: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.lg || 14,
  },
  doneBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.brand.onGoldText,
  },
});

export default ReportConcernModal;
