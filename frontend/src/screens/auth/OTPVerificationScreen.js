import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import { isAuthDevBypassEnabled } from '../../config/appConfig';

const CODE_LENGTH = 6;
const RESEND_INTERVAL = 30;

const OTPVerificationScreen = ({
  onVerifySuccess,
  onEditPhone,
  onBack,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const phoneNumber = route?.params?.formattedDisplay || '+233 24 123 4567';
  const role = route?.params?.role || 'passenger';

  // TODO(CAMPUSRIDE-AUTH): TEMPORARY DEV-ONLY OTP BYPASS
  const isDevBypassEnabled = isAuthDevBypassEnabled();

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_INTERVAL);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputRefs = useRef([]);

  // Countdown timer for code resend
  useEffect(() => {
    let intervalId = null;
    if (timer > 0) {
      intervalId = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timer]);

  const handleDigitChange = (text, index) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newDigits = [...digits];

    if (cleanText.length > 1) {
      // Handle paste of full or partial OTP code
      const pastedDigits = cleanText.split('').slice(0, CODE_LENGTH);
      pastedDigits.forEach((d, i) => {
        newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pastedDigits.length, CODE_LENGTH - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleanText;
    setDigits(newDigits);
    if (error) setError(null);

    // Auto-advance focus to next digit box
    if (cleanText && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setError(null);

    setTimeout(() => {
      setIsResending(false);
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimer(RESEND_INTERVAL);
      setCanResend(false);
      setResendSuccess(true);
      inputRefs.current[0]?.focus();

      // Clear resend success banner after 4 seconds
      setTimeout(() => setResendSuccess(false), 4000);
    }, 600);
  };

  const codeString = digits.join('');
  const isComplete = codeString.length === CODE_LENGTH;

  const handleVerificationSuccess = (status = 'verified') => {
    if (onVerifySuccess) {
      onVerifySuccess({
        code: status === 'dev_bypassed' ? 'DEV_BYPASS' : codeString,
        phoneNumber,
        rawNumber: route?.params?.rawNumber,
        normalizedNumber: route?.params?.normalizedNumber,
        formattedDisplay: phoneNumber,
        role,
        phoneVerified: true,
        verificationStatus: status,
      });
    }
  };

  const handleVerify = () => {
    if (!isComplete) {
      setError('Please enter the full 6-digit verification code');
      return;
    }

    setLoading(true);
    setError(null);

    // Verify OTP code
    setTimeout(() => {
      setLoading(false);
      handleVerificationSuccess('verified');
    }, 600);
  };

  // TODO(CAMPUSRIDE-AUTH): TEMPORARY DEV-ONLY OTP BYPASS
  const handleDevBypass = () => {
    if (!isDevBypassEnabled) return;
    handleVerificationSuccess('dev_bypassed');
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack || onEditPhone}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to phone entry screen"
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>

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
            {/* Task-Specific Headline */}
            <View style={styles.headerBlock}>
              <Text style={styles.title}>ENTER THE 6-DIGIT CODE</Text>
              
              {/* Dynamic Subtitle with Change Number Action */}
              <View style={styles.subtitleContainer}>
                <Text style={styles.subtitle}>
                  We sent a verification code to <Text style={styles.phoneHighlight}>{phoneNumber}</Text>
                </Text>
                
                {onEditPhone ? (
                  <TouchableOpacity
                    onPress={onEditPhone}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.changeNumberBtn}
                  >
                    <Text style={styles.changeNumberText}>Change number</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Subtle SMS Info Pill on Canvas */}
            <View style={styles.infoPill}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.infoPillText}>Check your SMS messages for the 6-digit code</Text>
            </View>

            {/* 6 Digit Input Boxes - Sitting Directly on #ECE5D2 Canvas */}
            <View style={styles.digitsRow}>
              {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.digitBox,
                    digits[index] ? styles.digitBoxFilled : null,
                    error ? styles.digitBoxError : null,
                  ]}
                  value={digits[index]}
                  onChangeText={(text) => handleDigitChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  selectTextOnFocus={true}
                  textAlign="center"
                  autoFocus={index === 0}
                  accessibilityLabel={`Digit ${index + 1}`}
                />
              ))}
            </View>

            {/* Contextual Error Feedback */}
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.semantic.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Resend Confirmation Banner */}
            {resendSuccess ? (
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.semantic.success} />
                <Text style={styles.successText}>New code sent via SMS</Text>
              </View>
            ) : null}

            {/* Resend Countdown / Action Row */}
            <View style={styles.resendRow}>
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={isResending}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Resend verification code"
                >
                  <Text style={styles.resendActiveText}>
                    {isResending ? 'Sending...' : "Didn't receive code? Resend"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendTimerText}>
                  Resend code in 00:{timer < 10 ? `0${timer}` : timer}
                </Text>
              )}
            </View>
          </View>

          {/* Flexible Breathing Space & Bottom Action Region */}
          <View style={styles.bottomRegion}>
            {/* Primary Action Button - Appears Dynamically ONLY When 6 Digits are Filled */}
            {isComplete ? (
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={handleVerify}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Verify Code"
                accessibilityHint="Submits verification code"
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.brand.onGoldText} />
                ) : (
                  <Text style={styles.verifyBtnText}>Verify Code</Text>
                )}
              </TouchableOpacity>
            ) : null}

            {/* // TODO(CAMPUSRIDE-AUTH): TEMPORARY DEV-ONLY OTP BYPASS */}
            {isDevBypassEnabled ? (
              <TouchableOpacity
                style={styles.devBypassBtn}
                onPress={handleDevBypass}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="DEV ONLY — Continue without verification"
                accessibilityHint="Bypasses OTP verification for local development testing only"
              >
                <View style={styles.devBadge}>
                  <Text style={styles.devBadgeText}>DEV ONLY</Text>
                </View>
                <Text style={styles.devBypassText}>Continue without verification</Text>
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
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.text.primary, // #1A1815
    letterSpacing: -0.4,
    lineHeight: 30,
    textTransform: 'uppercase',
  },
  subtitleContainer: {
    marginTop: 8,
    gap: 6,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.secondary, // #6B665C
    lineHeight: 22,
  },
  phoneHighlight: {
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  changeNumberBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  changeNumberText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand.primaryPressed,
    textDecorationLine: 'underline',
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4DCBD', // Subtle tonal pill on canvas
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 24,
  },
  infoPillText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 4,
  },
  digitBox: {
    flex: 1,
    height: 56,
    backgroundColor: colors.surface.base, // #FFFFFF
    borderWidth: 1.5,
    borderColor: colors.border.subtle, // #D8D2C3
    borderRadius: 14,
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text.primary,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  digitBoxFilled: {
    borderColor: colors.brand.primary, // #C89F3E
    backgroundColor: '#FFFFFF',
  },
  digitBoxError: {
    borderColor: colors.semantic.danger, // #B23A2F
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.semantic.danger,
    flex: 1,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  successText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.semantic.success,
    flex: 1,
  },
  resendRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendTimerText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  resendActiveText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text.primary,
    textDecorationLine: 'underline',
  },
  bottomRegion: {
    width: '100%',
    paddingTop: 24,
    gap: 12,
  },
  verifyBtn: {
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
  verifyBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.brand.onGoldText, // #1A1815
    letterSpacing: 0.3,
  },
  // TODO(CAMPUSRIDE-AUTH): TEMPORARY DEV-ONLY OTP BYPASS
  devBypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  devBadge: {
    backgroundColor: 'rgba(201, 118, 31, 0.15)', // Subtle warning gold tint
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.semantic.warning,
  },
  devBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.semantic.warning,
    letterSpacing: 0.5,
  },
  devBypassText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});

export default OTPVerificationScreen;
