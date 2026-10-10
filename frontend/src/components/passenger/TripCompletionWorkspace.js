import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fonts, radii, spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';

export const TripCompletionWorkspace = ({ booking, dropoffLocation, onSubmitRating, onDone }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const destinationName = dropoffLocation?.name || booking?.dropoff?.name || 'Destination';
  const completedAt = booking?.completedAt ? new Date(booking.completedAt) : null;
  const completionTime = completedAt && !Number.isNaN(completedAt.getTime())
    ? completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const handleSubmit = async () => {
    if (score < 1 || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSubmitRating?.(score, comment.trim());
      onDone?.();
    } catch (err) {
      const alreadyRated = err?.message?.includes('RATING_ALREADY_EXISTS')
        || err?.response?.data?.error?.code === 'RATING_ALREADY_EXISTS';
      if (alreadyRated) onDone?.();
      else setErrorMessage('Could not submit your rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.brand.baseBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.celebration}>
          <View style={[styles.confettiDot, styles.confettiOne, { backgroundColor: colors.semantic.info }]} />
          <View style={[styles.confettiDot, styles.confettiTwo, { backgroundColor: colors.semantic.danger }]} />
          <View style={[styles.confettiDot, styles.confettiThree, { backgroundColor: colors.semantic.warning }]} />
          <View style={[styles.confettiDot, styles.confettiFour, { backgroundColor: colors.brand.primary }]} />
          <View style={[styles.checkCircle, { backgroundColor: colors.brand.primary }]}>
            <CRIcon name="checkmark" size={44} color={colors.text.inverse} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text.primary }]}>Ride complete</Text>

        <View style={styles.destinationRow}>
          <CRIcon name="location" size={20} color={colors.text.primary} />
          <View style={styles.destinationCopy}>
            <Text style={[styles.destinationName, { color: colors.text.primary }]} numberOfLines={1}>
              {destinationName}
            </Text>
            {completionTime ? (
              <Text style={[styles.completionTime, { color: colors.text.secondary }]}>Completed at {completionTime}</Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.ratingSurface, { backgroundColor: colors.surface.elevated }]}>
          <Text style={[styles.ratingTitle, { color: colors.text.primary }]}>How was your ride?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                style={styles.starButton}
                onPress={() => {
                  setScore(star);
                  setErrorMessage(null);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${star} stars`}
              >
                <CRIcon
                  name={star <= score ? 'star' : 'star-outline'}
                  size={31}
                  color={star <= score ? colors.brand.primary : colors.text.muted}
                />
              </TouchableOpacity>
            ))}
          </View>

          {score > 0 ? (
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: colors.surface.base,
                  borderColor: colors.border.subtle,
                  color: colors.text.primary,
                },
              ]}
              value={comment}
              onChangeText={setComment}
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.text.muted}
              maxLength={200}
              multiline
              editable={!isSubmitting}
            />
          ) : null}

          {errorMessage ? (
            <Text style={[styles.errorText, { color: colors.semantic.danger }]}>{errorMessage}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.brand.primary }]}
          onPress={score > 0 ? handleSubmit : onDone}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.brand.onGoldText} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: colors.brand.onGoldText }]}>
              {score > 0 ? 'Submit rating' : 'Done'}
            </Text>
          )}
        </TouchableOpacity>

        {score > 0 ? (
          <TouchableOpacity style={styles.skipButton} onPress={onDone} disabled={isSubmitting}>
            <Text style={[styles.skipText, { color: colors.text.secondary }]}>Skip rating</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 72,
    paddingBottom: spacing.xl,
    alignItems: 'stretch',
  },
  celebration: {
    width: 132,
    height: 116,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
  confettiOne: { left: 5, top: 32 },
  confettiTwo: { right: 9, top: 18 },
  confettiThree: { left: 24, bottom: 5 },
  confettiFour: { right: 22, bottom: 10 },
  title: { fontFamily: fonts.extraBold, fontSize: 19, textAlign: 'center', marginTop: spacing.sm },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  destinationCopy: { flex: 1, marginLeft: spacing.sm },
  destinationName: { fontFamily: fonts.bold, fontSize: 14 },
  completionTime: { fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  ratingSurface: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  ratingTitle: { fontFamily: fonts.bold, fontSize: 14, marginBottom: spacing.sm },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  starButton: { padding: 3 },
  commentInput: {
    width: '100%',
    minHeight: 54,
    maxHeight: 88,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  errorText: { fontFamily: fonts.medium, fontSize: 12, marginTop: spacing.xs, textAlign: 'center' },
  primaryButton: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  primaryButtonText: { fontFamily: fonts.bold, fontSize: 15 },
  skipButton: { alignSelf: 'center', padding: spacing.sm },
  skipText: { fontFamily: fonts.semiBold, fontSize: 12 },
});

export default TripCompletionWorkspace;
