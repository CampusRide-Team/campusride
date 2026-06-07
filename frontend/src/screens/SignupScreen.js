import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'

// TODO: import your axios API instance when backend is ready
// import api from '../api/axios'

// TODO: import AsyncStorage to store token after signup
// import AsyncStorage from '@react-native-async-storage/async-storage'

// Reusable input field
const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  icon,
  rightAction,
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputRow}>
      <View style={styles.inputIcon}>
        <Text style={styles.inputIconText}>{icon}</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
      {rightAction && (
        <TouchableOpacity
          style={styles.inputRightAction}
          onPress={rightAction.onPress}
        >
          <Text style={styles.inputIconText}>{rightAction.icon}</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
)
// Car icon — same across all auth screens
const CarIcon = () => (
  <View style={styles.carWrap}>
    <View style={styles.carRoof} />
    <View style={styles.carBase}>
      <View style={[styles.wheel, { left: 5 }]} />
      <View style={[styles.wheel, { right: 5 }]} />
    </View>
  </View>
)

// Main Signup screen 
const SignupScreen = ({ onDone, onSignIn }) => {
  const [fullName, setFullName]         = useState('')
  const [phone, setPhone]               = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed]             = useState(false)
  const [loading, setLoading]           = useState(false)
  const [errors, setErrors]             = useState({})

  // ── Validation ──
  const validate = () => {
    const newErrors = {}

    if (!fullName.trim())
      newErrors.fullName = 'Full name is required'

    if (!phone.trim())
      newErrors.phone = 'Phone number is required'
    else if (phone.replace(/\s/g, '').length < 10)
      newErrors.phone = 'Enter a valid phone number'

    if (!email.trim())
      newErrors.email = 'Email address is required'
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = 'Enter a valid email address'

    if (!password.trim())
      newErrors.password = 'Password is required'
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters'

    if (!agreed)
      newErrors.agreed = 'You must agree to the terms to continue'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Signup handler ──
  const handleSignup = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      // TODO: BACKEND — Guest user registration
      // Endpoint : POST /api/auth/signup
      // Body     : { fullName, phone, email, password, role: 'guest' }
      // Response : { token, user: { id, name, role } }
      //
      // const response = await api.post('/auth/signup', {
      //   fullName,
      //   phone,
      //   email,
      //   password,
      //   role: 'guest',
      // })
      //
      // Save token so user stays logged in:
      // await AsyncStorage.setItem('token', response.data.token)
      // await AsyncStorage.setItem('user', JSON.stringify(response.data.user))
      //
      // Then navigate to home:
      // onDone(response.data.token)

      setTimeout(() => {
        setLoading(false)
        if (onDone) onDone()
      }, 1500)
    } catch (err) {
      setLoading(false)
      // TODO: BACKEND — Handle specific API error codes
      // 409 → Email already exists
      // 400 → Validation error from server
      setErrors({ general: 'Something went wrong. Please try again.' })
    }
  }

  // ── Google signup handler ──
  const handleGoogleSignup = async () => {
    try {
      // TODO: BACKEND — Google OAuth signup
      // Endpoint : POST /api/auth/google
      // Body     : { googleToken, role: 'guest' }
      // Response : { token, user: { id, name, role } }
      //
      // Use expo-auth-session to get googleToken,
      // then send to backend for verification
    } catch (err) {
      setErrors({ general: 'Google signup failed. Please try again.' })
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Logo + tagline */}
        <View style={styles.logoSection}>
          <View style={styles.iconCard}>
            <CarIcon />
          </View>
          <Text style={styles.appName}>CampusRide</Text>
          <Text style={styles.appTagline}>Safe rides for everyone on campus</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>

          <Text style={styles.cardTitle}>Create account</Text>
          <Text style={styles.cardSubtitle}>Guest access for campus visitors</Text>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>ℹ️</Text>
            <Text style={styles.infoBannerText}>
              Not a student? Sign up as a campus guest to access rides.
            </Text>
          </View>

          {/* General error from API */}
          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          {/* Full name */}
          <InputField
            label="Full name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={(v) => {
              setFullName(v)
              setErrors((e) => ({ ...e, fullName: null }))
            }}
            icon="👤"
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}

          {/* Phone number */}
          <InputField
            label="Phone number"
            placeholder="+233 XX XXX XXXX"
            value={phone}
            onChangeText={(v) => {
              setPhone(v)
              setErrors((e) => ({ ...e, phone: null }))
            }}
            keyboardType="phone-pad"
            icon="📞"
          />
          {errors.phone && (
            <Text style={styles.errorText}>{errors.phone}</Text>
          )}

          {/* Email */}
          <InputField
            label="Email address"
            placeholder="your@email.com"
            value={email}
            onChangeText={(v) => {
              setEmail(v)
              setErrors((e) => ({ ...e, email: null }))
            }}
            keyboardType="email-address"
            icon="✉️"
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}

          {/* Password */}
          <InputField
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={(v) => {
              setPassword(v)
              setErrors((e) => ({ ...e, password: null }))
            }}
            secureTextEntry={!showPassword}
            icon="🔒"
            rightAction={{
              icon: showPassword ? '🙈' : '👁️',
              onPress: () => setShowPassword((s) => !s),
            }}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Terms and conditions checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => {
              setAgreed((a) => !a)
              setErrors((e) => ({ ...e, agreed: null }))
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.agreed && (
            <Text style={styles.errorText}>{errors.agreed}</Text>
          )}

          {/* Create account button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSignup}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Creating account...' : 'Create account'}
            </Text>
          </TouchableOpacity>

          {/* Sign in link → goes to LoginScreen */}
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={onSignIn}
            activeOpacity={0.7}
          >
            <Text style={styles.signInText}>
              Already have an account?{' '}
              <Text style={styles.signInLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Continue with Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignup}
            activeOpacity={0.85}
          >
            <Text style={styles.googleLetter}>G</Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Styles
const styles = StyleSheet.create({

  // ── Layout ──
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  // ── Logo section ──
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  iconCard: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.4,
  },
  appTagline: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },

  // ── Car icon ──
  carWrap: {
    alignItems: 'center',
  },
  carRoof: {
    width: 24,
    height: 12,
    backgroundColor: 'white',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    marginBottom: -1,
  },
  carBase: {
    width: 38,
    height: 15,
    backgroundColor: 'white',
    borderRadius: 3,
  },
  wheel: {
    position: 'absolute',
    bottom: -5,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#1E3A8A',
    borderWidth: 2.5,
    borderColor: 'white',
  },

  // ── Form card ──
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },

  // ── Info banner ──
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerIcon: {
    fontSize: 14,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#1E3A8A',
    lineHeight: 18,
  },

  // ── Error states ──
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },

  // ── Input field ──
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  inputIcon: {
    opacity: 0.55,
  },
  inputIconText: {
    fontSize: 17,
  },
  inputRightAction: {
    paddingLeft: 8,
    opacity: 0.55,
  },

  // ── Terms checkbox ──
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  termsLink: {
    color: '#1E3A8A',
    fontWeight: '600',
  },

  // ── Create account button ──
  submitBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: '#1E3A8A',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── Sign in link ──
  signInBtn: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 14,
  },
  signInText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  signInLink: {
    color: '#1E3A8A',
    fontWeight: '700',
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },

  // ── Google button ──
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  googleLetter: {
    fontSize: 20,
    fontWeight: '800',
    color: '#DB4437',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
})

export default SignupScreen