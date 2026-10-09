import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, fonts, radii, spacing, elevation } from '../../theme';
import { CRIcon } from '../common';
import { ratingService } from '../../api/services/ratingService';

export const RateLaterSheet = ({
  visible,
  booking,
  onClose,
  onRatingSuccess,
}) => {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAlreadyRated, setIsAlreadyRated] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!booking) return null;

  const driver = booking.driverId;
  const driverName = driver?.fullName || 'your driver';
  const driverFirstName = driverName.trim().split(' ')[0] || 'your driver';
  const vehicleModel = driver?.driverProfile?.vehicle?.model || driver?.vehicleModel || '';
  const licensePlate = driver?.driverProfile?.vehicle?.licensePlate || driver?.vehicleLicensePlate || '';
  const vehicleInfo = [vehicleModel, licensePlate].filter(Boolean).join(' • ');

  const getInitials = (name) => {
    if (!name) return 'CD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSelectStar = (val) => {
    setScore(val);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (score < 1 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const driverId = driver?._id || driver?.id || booking.driverId;
      await ratingService.submitRating({
        bookingId: booking._id,
        driverId,
        score,
        comment: comment.trim(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        if (onRatingSuccess) onRatingSuccess(booking._id, score);
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      console.error('[RateLaterSheet] Submission error:', err);
      const isDuplicate = err?.response?.data?.error?.code === 'RATING_ALREADY_EXISTS' ||
                          (typeof err?.message === 'string' && err.message.startsWith('RATING_ALREADY_EXISTS'));
      if (isDuplicate) {
        setIsAlreadyRated(true);
      } else {
        setErrorMessage('Could not submit rating. Please check your connection and tap Retry.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setScore(0);
    setComment('');
    setErrorMessage(null);
    setIsAlreadyRated(false);
    setIsSuccess(false);
    if (onClose) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleResetAndClose}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleResetAndClose}
        />

        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* SUCCESS STATE */}
          {isSuccess ? (
            <View style={styles.statusStateContainer}>
              <View style={styles.successIconWrap}>
                <CRIcon name="checkmark" size={24} color={colors.semantic.success} />
              </View>
              <Text style={styles.statusTitle}>Thank you!</Text>
              <Text style={styles.statusSubtitle}>Your rating has been submitted.</Text>
            </View>
          ) : isAlreadyRated ? (
            /* ALREADY RATED RECONCILIATION STATE */
            <View style={styles.statusStateContainer}>
              <View style={styles.infoIconWrap}>
                <CRIcon name="star" size={24} color={colors.brand.primary} />
              </View>
              <Text style={styles.statusTitle}>Already Rated</Text>
              <Text style={styles.statusSubtitle}>You've already rated this ride.</Text>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleResetAndClose}
                activeOpacity={0.85}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ACTIVE RATING FORM */
            <>
              {/* Header & Driver Reassurance */}
              <View style={styles.header}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{getInitials(driverName)}</Text>
                </View>
                <Text style={styles.title}>How was your ride with {driverFirstName}?</Text>
                {vehicleInfo ? (
                  <Text style={styles.vehicleSubtitle}>{vehicleInfo}</Text>
                ) : null}
              </View>

              {/* 5-Star Interactive Rating */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= score;
                  return (
                    <TouchableOpacity
                      key={`star-${starVal}`}
                      onPress={() => handleSelectStar(starVal)}
                      activeOpacity={0.7}
                      style={styles.starButton}
                      accessibilityRole="button"
                      accessibilityLabel={`${starVal} star${starVal > 1 ? 's' : ''}`}
                    >
                      <CRIcon
                        name={isFilled ? 'star' : 'star-outline'}
                        size={32}
                        color={isFilled ? colors.brand.primary : colors.border.subtle}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Optional Comment Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Optional feedback note..."
                  placeholderTextColor={colors.text.muted}
                  value={comment}
                  onChangeText={setComment}
                  maxLength={200}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Error Message Banner */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Action CTAs */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (score < 1 || isSubmitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={score < 1 || isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.text.primary} />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Rating</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleResetAndClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 24, 21, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface.elevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    ...elevation.level3,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.text.primary,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs + 2,
  },
  avatarText: {
    fontSize: 14,
    fontFamily: fonts.manrope.bold,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.manrope.extraBold,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  vehicleSubtitle: {
    fontSize: 12,
    fontFamily: fonts.manrope.medium,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  starButton: {
    padding: 4,
  },
  inputContainer: {
    backgroundColor: colors.surface.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  textInput: {
    fontSize: 13,
    fontFamily: fonts.manrope.regular,
    color: colors.text.primary,
    minHeight: 54,
  },
  errorBanner: {
    backgroundColor: colors.semantic.dangerTint,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 11.5,
    fontFamily: fonts.manrope.medium,
    color: colors.semantic.danger,
    textAlign: 'center',
  },
  actionRow: {
    gap: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 13,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.level2,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontSize: 13,
    fontFamily: fonts.manrope.extraBold,
    fontWeight: '800',
    color: colors.text.primary,
  },
  cancelButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 12,
    fontFamily: fonts.manrope.bold,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  statusStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  successIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.semantic.successTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  infoIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statusTitle: {
    fontSize: 17,
    fontFamily: fonts.manrope.extraBold,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    fontFamily: fonts.manrope.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  doneButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 11,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    minWidth: 140,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 13,
    fontFamily: fonts.manrope.extraBold,
    fontWeight: '800',
    color: colors.text.primary,
  },
});

export default RateLaterSheet;
