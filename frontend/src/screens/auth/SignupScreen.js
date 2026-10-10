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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import api from '../../api/axios';

const SignupScreen = ({ onDone, onSignIn, onBack, route }) => {
  const insets = useSafeAreaInsets();
  const initialRole = route?.params?.role || 'passenger';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(route?.params?.rawNumber || route?.params?.phoneNumber || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (phone.replace(/[^0-9]/g, '').length < 9) {
      errs.phone = 'Enter a valid phone number (e.g. 024 123 4567)';
    }
    if (email.trim() && !email.includes('@')) {
      errs.email = 'Enter a valid campus email address';
    }
    if (!password || password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (!agreed) {
      errs.agreed = 'Please agree to the Terms of Service to continue';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password: password.trim(),
        role: initialRole,
      };

      const response = await api.post('/auth/register', payload);

      if (response.data?.success) {
        if (onDone) {
          await onDone(response.data);
        }
      } else {
        setErrors({ general: response.data?.message || 'Registration could not be completed.' });
      }
    } catch (err) {
      console.warn('[SignupScreen] Registration error:', err.message);
      const serverMsg = err.response?.data?.message || err.response?.data?.error?.message;
      setErrors({
        general: serverMsg || 'Registration failed. Please check your information and try again.',
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack || onSignIn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Block */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              {initialRole === 'driver'
                ? 'Join CampusRide as a verified campus driver'
                : 'Join the University of Ghana ride network'}
            </Text>
          </View>

          {/* Form Surface Card */}
          <View style={styles.formCard}>
            {errors.general ? (
              <View style={styles.generalErrorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.semantic.danger} />
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color={colors.text.secondary} style={styles.leadingIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Kofi Mensah"
                  placeholderTextColor={colors.text.muted}
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                  }}
                />
              </View>
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>+233</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="024 123 4567"
                  placeholderTextColor={colors.text.muted}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                  }}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>

            {/* Campus Email (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Campus Email (Optional)</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color={colors.text.secondary} style={styles.leadingIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="student@st.ug.edu.gh"
                  placeholderTextColor={colors.text.muted}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.text.secondary} style={styles.leadingIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="At least 6 characters"
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

            {/* Terms Agreement Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => {
                setAgreed(!agreed);
                if (errors.agreed) setErrors((prev) => ({ ...prev, agreed: null }));
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed ? <Ionicons name="checkmark" size={14} color="#1A1815" /> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the CampusRide Terms of Service & Privacy Policy
              </Text>
            </TouchableOpacity>
            {errors.agreed ? <Text style={styles.errorText}>{errors.agreed}</Text> : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.brand.onGoldText} />
              ) : (
                <Text style={styles.submitBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Navigation Link */}
          <View style={styles.signinRow}>
            <Text style={styles.signinPrompt}>Already have an account? </Text>
            <TouchableOpacity
              onPress={onSignIn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 20,
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
    gap: 16,
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
  countryCodeBadge: {
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border.subtle,
  },
  countryCodeText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text.primary,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    backgroundColor: '#FBFAF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  termsText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  submitBtn: {
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
  submitBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.brand.onGoldText, // #1A1815
    letterSpacing: 0.2,
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signinPrompt: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  signinLink: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text.primary,
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;