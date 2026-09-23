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
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import api from '../../api/axios';
import AccountSuspendedModal from '../../context/AccountSuspendedModal';

const DriverLogin = ({
  onDriverLogin,
  onDriverRegister,
  onSupport,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [isSuspendedModalVisible, setIsSuspendedModalVisible] = useState(false);
  const [attemptedEmail, setAttemptedEmail] = useState('');

  const validate = () => {
    const errs = {};
    if (!identifier.trim()) {
      errs.identifier = 'Phone number or email is required';
    }
    if (!password.trim()) {
      errs.password = 'Password is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        identifier: identifier.trim(),
        password: password.trim(),
        role: 'driver',
      };

      const response = await api.post('/auth/login', payload);

      if (response.data?.success) {
        if (onDriverLogin) {
          await onDriverLogin(response.data);
        }
      } else {
        setErrors({ general: response.data?.message || 'Login failed. Please check your driver credentials.' });
      }
    } catch (err) {
      console.warn('[DriverLogin] Auth failure:', err.message);
      const errorCode = err.response?.data?.error?.code;
      if (errorCode === 'ACCOUNT_SUSPENDED') {
        setAttemptedEmail(identifier.trim());
        setIsSuspendedModalVisible(true);
        return;
      }
      const serverMsg = err.response?.data?.message || err.response?.data?.error?.message;
      setErrors({
        general: serverMsg || 'Unable to sign in. Please verify your credentials or contact driver support.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.inner, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style="dark" />

        {/* Navigation Bar */}
        <View style={styles.navBar}>
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
            <View style={styles.backButtonPlaceholder} />
          )}

          {onSupport ? (
            <TouchableOpacity
              onPress={onSupport}
              style={styles.supportButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="help-circle-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.supportText}>Support</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Typography */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Driver Terminal</Text>
            <Text style={styles.subtitle}>Sign in to accept campus ride requests</Text>
          </View>

          {/* Form Surface Card */}
          <View style={styles.formCard}>
            {errors.general ? (
              <View style={styles.generalErrorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.semantic.danger} />
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            ) : null}

            {/* Identifier */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number or Email</Text>
              <View style={[styles.inputContainer, errors.identifier && styles.inputError]}>
                <Ionicons
                  name="car-outline"
                  size={20}
                  color={colors.text.secondary}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="024 123 4567 or driver@gmail.com"
                  placeholderTextColor={colors.text.muted}
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: null }));
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.identifier ? <Text style={styles.errorText}>{errors.identifier}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.text.secondary}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter driver password"
                  placeholderTextColor={colors.text.muted}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  style={styles.trailingIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Sign In CTA */}
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Driver sign in"
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.brand.onGoldText} />
              ) : (
                <Text style={styles.signInBtnText}>Open Driver Portal</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Register as Driver link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>New Campus Driver? </Text>
            <TouchableOpacity
              onPress={onDriverRegister}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Apply as driver"
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <Text style={styles.registerLink}>Register Vehicle</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <AccountSuspendedModal
          visible={isSuspendedModalVisible}
          userEmail={attemptedEmail}
          onClose={() => setIsSuspendedModalVisible(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.baseBackground, // Canonical #ECE5D2
  },
  inner: {
    flex: 1,
  },
  navBar: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPlaceholder: {
    width: 48,
    height: 48,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  supportText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.text.primary, // #1A1815
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.secondary, // #6B665C
    textAlign: 'center',
    marginTop: 6,
  },
  formCard: {
    backgroundColor: colors.surface.base, // #FFFFFF
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle, // #D8D2C3
    padding: 22,
    gap: 18,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.dangerTint,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  generalErrorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.semantic.danger,
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#FBFAF7',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: colors.semantic.danger,
  },
  leadingIcon: {
    marginRight: 10,
  },
  trailingIcon: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text.primary,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.semantic.danger,
    marginTop: 2,
  },
  signInBtn: {
    width: '100%',
    height: 54,
    backgroundColor: colors.brand.primary, // #C89F3E
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  signInBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.brand.onGoldText, // #1A1815
    letterSpacing: 0.2,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerPrompt: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  registerLink: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text.primary,
    textDecorationLine: 'underline',
  },
});

export default DriverLogin;