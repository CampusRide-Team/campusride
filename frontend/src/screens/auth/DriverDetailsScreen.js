import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';

const DriverDetailsScreen = ({ onContinue, onBack, route }) => {
  const insets = useSafeAreaInsets();
  const initialData = route?.params || {};

  const [licenseNumber, setLicenseNumber] = useState(initialData?.licenseNumber || '');
  const [ghanaCardNumber, setGhanaCardNumber] = useState(initialData?.ghanaCardNumber || '');
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Validation
  const cleanLicense = licenseNumber.trim().toUpperCase();
  const cleanGhanaCard = ghanaCardNumber.trim().toUpperCase();

  const isLicenseValid = cleanLicense.length >= 6;
  // Ghana Card format: GHA-123456789-0 or standard 10+ characters
  const isGhanaCardValid = cleanGhanaCard.length >= 8;
  const isFormValid = isLicenseValid && isGhanaCardValid;

  const handleContinue = () => {
    if (!cleanLicense) {
      setError("Please enter your Driver's License number");
      return;
    }
    if (!cleanGhanaCard) {
      setError('Please enter your Ghana Card PIN (e.g. GHA-123456789-0)');
      return;
    }
    if (!isFormValid) {
      setError('Please enter valid driver license and Ghana card details');
      return;
    }

    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (onContinue) {
        onContinue({
          ...initialData,
          licenseNumber: cleanLicense,
          ghanaCardNumber: cleanGhanaCard,
          role: 'driver',
        });
      }
    }, 250);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.inner, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style="dark" />

        {/* Top Header Bar */}
        <View style={styles.topBar}>
          {onBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.topBarSpacer} />
          )}

          <Image
            source={require('../../../assets/brand/wordmark_transparent.png')}
            style={styles.brandWordmark}
            resizeMode="contain"
            accessible={false}
            importantForAccessibility="no"
          />

          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content Area */}
          <View style={styles.contentBlock}>
            {/* Step Indicator */}
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>DRIVER ONBOARDING • STEP 1 OF 3</Text>
            </View>

            <View style={styles.headerBlock}>
              <Text style={styles.title}>DRIVER IDENTIFICATION</Text>
              <Text style={styles.subtitle}>
                Enter your driver's license number and Ghana Card PIN for your application.
              </Text>
            </View>

            {/* Inputs sitting directly on #ECE5D2 canvas */}
            <View style={styles.formGroup}>
              {/* Driver License Number */}
              <View
                style={[
                  styles.inputPill,
                  focusedField === 'license' && styles.inputPillFocused,
                  error && !isLicenseValid && styles.inputPillError,
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={focusedField === 'license' ? colors.brand.primary : colors.text.muted}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Driver's License Number (e.g. DL1234567)"
                  placeholderTextColor={colors.text.muted}
                  value={licenseNumber}
                  onChangeText={(val) => {
                    setLicenseNumber(val);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('license')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus={true}
                  returnKeyType="next"
                  accessibilityLabel="Driver License Number"
                />
                {licenseNumber.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setLicenseNumber('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Clear license number"
                  >
                    <Ionicons name="close-circle" size={18} color={colors.text.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Ghana Card Number */}
              <View
                style={[
                  styles.inputPill,
                  focusedField === 'ghanaCard' && styles.inputPillFocused,
                  error && !isGhanaCardValid && styles.inputPillError,
                ]}
              >
                <Ionicons
                  name="id-card-outline"
                  size={20}
                  color={focusedField === 'ghanaCard' ? colors.brand.primary : colors.text.muted}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Ghana Card PIN (e.g. GHA-123456789-0)"
                  placeholderTextColor={colors.text.muted}
                  value={ghanaCardNumber}
                  onChangeText={(val) => {
                    setGhanaCardNumber(val);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('ghanaCard')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={isFormValid ? handleContinue : undefined}
                  accessibilityLabel="Ghana Card PIN"
                />
                {ghanaCardNumber.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setGhanaCardNumber('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Clear Ghana card number"
                  >
                    <Ionicons name="close-circle" size={18} color={colors.text.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Error Feedback */}
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.semantic.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Bottom Region */}
          <View style={styles.bottomRegion}>
            {isFormValid ? (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleContinue}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Next step vehicle details"
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.brand.onGoldText} />
                ) : (
                  <Text style={styles.continueBtnText}>Next: Vehicle Details</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.baseBackground,
  },
  inner: {
    flex: 1,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarSpacer: {
    width: 44,
    height: 44,
  },
  brandWordmark: {
    height: 26,
    width: 140,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  contentBlock: {
    width: '100%',
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  stepBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.brand.primaryPressed,
    letterSpacing: 0.5,
  },
  headerBlock: {
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.text.primary,
    letterSpacing: -0.4,
    lineHeight: 30,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: 8,
  },
  formGroup: {
    gap: 14,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.surface.base,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputPillFocused: {
    borderColor: colors.brand.primary,
  },
  inputPillError: {
    borderColor: colors.semantic.danger,
  },
  leadingIcon: {
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.semantic.danger,
    flex: 1,
  },
  bottomRegion: {
    width: '100%',
    paddingTop: 24,
  },
  continueBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.brand.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  continueBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.brand.onGoldText,
    letterSpacing: 0.3,
  },
});

export default DriverDetailsScreen;
