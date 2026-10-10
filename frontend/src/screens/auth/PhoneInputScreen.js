import React, { useState, useEffect } from 'react';
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
  AccessibilityInfo,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';

const PhoneInputScreen = ({ onContinue, onBack, route }) => {
  const insets = useSafeAreaInsets();
  const role = route?.params?.role || 'passenger';

  // Preserve previously entered number if returning from OTP screen
  const initialPhone = route?.params?.rawNumber || '';
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {});
  }, []);

  const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');

  // Validation: Ghana phone numbers are 9 digits (without leading 0) or 10 digits (with leading 0)
  const isValid = cleanDigits.length >= 9 && cleanDigits.length <= 10;

  const validate = () => {
    if (!cleanDigits) {
      setError('Please enter your phone number');
      return false;
    }
    if (!isValid) {
      setError('Enter a valid 9 or 10 digit Ghana phone number');
      return false;
    }
    setError(null);
    return true;
  };

  const handleClear = () => {
    setPhoneNumber('');
    setError(null);
  };

  const handleContinue = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);

    // Normalize phone number to international format without leading 0 for Ghana (+233)
    const normalizedNumber = cleanDigits.startsWith('0') ? cleanDigits.substring(1) : cleanDigits;
    const formattedDisplay = `+233 ${normalizedNumber.substring(0, 2)} ${normalizedNumber.substring(2, 5)} ${normalizedNumber.substring(5)}`;

    setTimeout(() => {
      setLoading(false);
      if (onContinue) {
        onContinue({
          rawNumber: cleanDigits,
          normalizedNumber,
          formattedDisplay,
          role,
        });
      }
    }, 400);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.inner, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style="dark" />

        {/* Top Header Bar: Back Arrow + Centered CampusRide Branding */}
        <View style={styles.topBar}>
          {onBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              accessibilityHint="Returns to previous screen"
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
            {/* Task-Specific Headline & Concise Explanation */}
            <View style={styles.headerBlock}>
              <Text style={styles.title}>ENTER YOUR PHONE NUMBER</Text>
              <Text style={styles.subtitle}>
                We'll send a 6-digit code to verify that this number belongs to you.
              </Text>
            </View>

            {/* Clean Input Pill - Sitting Directly on #ECE5D2 Canvas */}
            <View
              style={[
                styles.inputPill,
                isFocused && styles.inputPillFocused,
                error && styles.inputPillError,
              ]}
            >
              {/* Ghana Flag & Dial Code Badge */}
              <View style={styles.countryBadge}>
                <Text style={styles.flagEmoji}>🇬🇭</Text>
                <Text style={styles.countryCodeText}>+233</Text>
                <View style={styles.verticalDivider} />
              </View>

              {/* Number Input Field */}
              <TextInput
                style={styles.phoneInput}
                placeholder="024 123 4567"
                placeholderTextColor={colors.text.muted}
                value={phoneNumber}
                onChangeText={(val) => {
                  setPhoneNumber(val);
                  if (error) setError(null);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="phone-pad"
                autoFocus={true}
                maxLength={13}
                accessibilityLabel="Ghana mobile phone number"
                accessibilityHint="Enter your 9 or 10 digit mobile number"
              />

              {/* Clear Input Button */}
              {phoneNumber.length > 0 ? (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClear}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear phone number"
                >
                  <Ionicons name="close-circle" size={20} color={colors.text.muted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Contextual Error Feedback */}
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.semantic.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Flexible Breathing Space & Bottom Action Region */}
          <View style={styles.bottomRegion}>
            {/* Primary Action Button - Appears Dynamically ONLY When Input is Valid */}
            {isValid ? (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleContinue}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Continue"
                accessibilityHint="Sends verification SMS code"
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.brand.onGoldText} />
                ) : (
                  <Text style={styles.continueBtnText}>Continue</Text>
                )}
              </TouchableOpacity>
            ) : null}

            {/* Legal Consent Disclaimer */}
            <Text style={styles.legalDisclaimer}>
              By continuing, you agree to CampusRide Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.baseBackground, // Continuous Campus Canvas #ECE5D2
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
  headerBlock: {
    marginBottom: 28,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.text.primary, // #1A1815
    letterSpacing: -0.4,
    lineHeight: 30,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.secondary, // #6B665C
    lineHeight: 22,
    marginTop: 8,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.surface.base, // #FFFFFF Clean Surface
    borderWidth: 1.5,
    borderColor: colors.border.subtle, // #D8D2C3
    borderRadius: 16,
    paddingHorizontal: 14,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputPillFocused: {
    borderColor: colors.brand.primary, // #C89F3E
    backgroundColor: '#FFFFFF',
  },
  inputPillError: {
    borderColor: colors.semantic.danger, // #B23A2F
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flagEmoji: {
    fontSize: 20,
  },
  countryCodeText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text.primary, // #1A1815
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.subtle, // #D8D2C3
    marginHorizontal: 10,
  },
  phoneInput: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: colors.text.primary, // #1A1815
    letterSpacing: 0.5,
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
    color: colors.semantic.danger, // #B23A2F
    flex: 1,
  },
  bottomRegion: {
    width: '100%',
    paddingTop: 24,
    gap: 16,
  },
  continueBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.brand.primary, // #C89F3E Primary Gold
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
    color: colors.brand.onGoldText, // #1A1815
    letterSpacing: 0.3,
  },
  legalDisclaimer: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text.secondary, // #6B665C
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});

export default PhoneInputScreen;
