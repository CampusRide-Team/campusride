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
import api, { formatApiError } from '../../api/axios';
import authService from '../../api/services/authService';

const SignInScreen = ({ onSignInSuccess, onRegister, onForgotPassword, onBack, route }) => {
  const insets = useSafeAreaInsets();
  const role = route?.params?.role || 'passenger';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isFormFilled = identifier.trim().length > 0 && password.length > 0;

  const validate = () => {
    if (!identifier.trim()) {
      setError('Please enter your phone number or email');
      return false;
    }
    if (!password) {
      setError('Please enter your password');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login({
        email: identifier.trim(),
        password,
        role,
      });

      setLoading(false);
      if (data?.success) {
        if (onSignInSuccess) {
          onSignInSuccess(data);
        }
      } else {
        setError(data?.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setLoading(false);
      const msg = formatApiError(err, 'Login failed. Please check your credentials and connection.');
      setError(msg);
    }
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
              accessibilityHint="Returns to gateway screen"
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
          {/* Main Content Block */}
          <View style={styles.contentBlock}>
            {/* Task-Specific Headline */}
            <View style={styles.headerBlock}>
              <Text style={styles.title}>WELCOME BACK</Text>
              <Text style={styles.subtitle}>
                Sign in to your {role === 'driver' ? 'driver' : 'campus'} account
              </Text>
            </View>

            {/* Inputs - Sitting Directly on #ECE5D2 Canvas (No White Parent Card) */}
            <View style={styles.fieldsContainer}>
              {/* Identifier Input Pill */}
              <View
                style={[
                  styles.inputPill,
                  focusedField === 'identifier' && styles.inputPillFocused,
                  error && !identifier.trim() && styles.inputPillError,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.text.secondary}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Phone or email"
                  placeholderTextColor={colors.text.muted}
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('identifier')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  accessibilityLabel="Phone number or email"
                />
                {identifier.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setIdentifier('');
                      if (error) setError(null);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.text.muted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Password Input Pill */}
              <View
                style={[
                  styles.inputPill,
                  focusedField === 'password' && styles.inputPillFocused,
                  error && !password && styles.inputPillError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.text.secondary}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Password"
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
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Contextual Error Feedback */}
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.semantic.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Secondary Actions */}
            <View style={styles.secondaryActions}>
              {onForgotPassword ? (
                <TouchableOpacity
                  onPress={onForgotPassword}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              ) : null}

              {onRegister ? (
                <View style={styles.registerRow}>
                  <Text style={styles.registerPrompt}>Don't have an account?</Text>
                  <TouchableOpacity
                    onPress={onRegister}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                  >
                    <Text style={styles.registerLink}>Register with phone</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>

          {/* Flexible Breathing Space & Bottom Action Region */}
          <View style={styles.bottomRegion}>
            {/* Primary Action Button - Appears Dynamically ONLY When Both Fields Are Entered */}
            {isFormFilled ? (
              <TouchableOpacity
                style={styles.signInBtn}
                onPress={handleSignIn}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Sign In"
                accessibilityHint="Authenticates and opens your account"
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.brand.onGoldText} />
                ) : (
                  <Text style={styles.signInBtnText}>Sign In</Text>
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
  fieldsContainer: {
    gap: 14,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.surface.base, // #FFFFFF
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
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text.primary, // #1A1815
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
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
  secondaryActions: {
    marginTop: 20,
    gap: 14,
  },
  forgotText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.brand.primaryPressed,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  registerPrompt: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },
  registerLink: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text.primary,
    textDecorationLine: 'underline',
  },
  bottomRegion: {
    width: '100%',
    paddingTop: 24,
  },
  signInBtn: {
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
  signInBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.brand.onGoldText, // #1A1815
    letterSpacing: 0.3,
  },
});

export default SignInScreen;
