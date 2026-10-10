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

const SetPasswordScreen = ({ onContinue, onBack, route }) => {
  const insets = useSafeAreaInsets();
  const role = route?.params?.role || 'passenger';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Validation rules
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;
  const doPasswordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const isFormValid = isPasswordValid && doPasswordsMatch;

  const handleContinue = () => {
    if (!isPasswordValid) {
      setError('Password must be at least 8 characters and include letters & numbers');
      return;
    }
    if (!doPasswordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (onContinue) {
        onContinue({
          password,
          role,
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
            <View style={styles.headerBlock}>
              <Text style={styles.title}>CREATE YOUR PASSWORD</Text>
              <Text style={styles.subtitle}>
                Choose a strong password to protect your CampusRide account.
              </Text>
            </View>

            {/* Inputs sitting directly on #ECE5D2 canvas */}
            <View style={styles.formGroup}>
              {/* Password Input */}
              <View
                style={[
                  styles.inputPill,
                  focusedField === 'password' && styles.inputPillFocused,
                  error && !isPasswordValid && styles.inputPillError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={focusedField === 'password' ? colors.brand.primary : colors.text.muted}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Create password"
                  placeholderTextColor={colors.text.muted}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true}
                  returnKeyType="next"
                  accessibilityLabel="Create password"
                />
                <TouchableOpacity
                  style={styles.trailingButton}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password Input */}
              <View
                style={[
                  styles.inputPill,
                  focusedField === 'confirm' && styles.inputPillFocused,
                  confirmPassword.length > 0 && !doPasswordsMatch && styles.inputPillError,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={focusedField === 'confirm' ? colors.brand.primary : colors.text.muted}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.text.muted}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={isFormValid ? handleContinue : undefined}
                  accessibilityLabel="Confirm password"
                />
                <TouchableOpacity
                  style={styles.trailingButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Validation Checklist */}
            <View style={styles.checklist}>
              <View style={styles.checkItem}>
                <Ionicons
                  name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={hasMinLength ? colors.semantic.success : colors.text.muted}
                />
                <Text style={[styles.checkText, hasMinLength && styles.checkTextActive]}>
                  At least 8 characters
                </Text>
              </View>

              <View style={styles.checkItem}>
                <Ionicons
                  name={hasLetter && hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={hasLetter && hasNumber ? colors.semantic.success : colors.text.muted}
                />
                <Text
                  style={[
                    styles.checkText,
                    hasLetter && hasNumber && styles.checkTextActive,
                  ]}
                >
                  Contains letters and numbers
                </Text>
              </View>

              {confirmPassword.length > 0 && (
                <View style={styles.checkItem}>
                  <Ionicons
                    name={doPasswordsMatch ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={doPasswordsMatch ? colors.semantic.success : colors.semantic.danger}
                  />
                  <Text
                    style={[
                      styles.checkText,
                      doPasswordsMatch
                        ? styles.checkTextActive
                        : { color: colors.semantic.danger },
                    ]}
                  >
                    {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </Text>
                </View>
              )}
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
                accessibilityLabel="Continue to terms"
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.brand.onGoldText} />
                ) : (
                  <Text style={styles.continueBtnText}>Continue</Text>
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
  headerBlock: {
    marginBottom: 28,
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
  trailingButton: {
    padding: 6,
  },
  checklist: {
    marginTop: 18,
    gap: 8,
    paddingHorizontal: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.muted,
  },
  checkTextActive: {
    color: colors.text.primary,
    fontFamily: fonts.semiBold,
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

export default SetPasswordScreen;
