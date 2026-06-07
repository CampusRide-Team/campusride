import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'

const { width } = Dimensions.get('window')

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
      {/* Right icon or action */}
      {rightAction ? (
        <TouchableOpacity style={styles.inputIcon} onPress={rightAction.onPress}>
          <Text style={styles.inputIconText}>{rightAction.icon}</Text>
        </TouchableOpacity>
      ) : icon ? (
        <View style={styles.inputIcon}>
          <Text style={styles.inputIconText}>{icon}</Text>
        </View>
      ) : null}
    </View>
  </View>
)

// Google G logo
const GoogleIcon = () => (
  <Text style={styles.googleLetter}>G</Text>
)

// Car icon (same as splash)
const CarIcon = () => (
  <View style={styles.carWrap}>
    <View style={styles.carRoof} />
    <View style={styles.carBase}>
      <View style={[styles.wheel, { left: 5 }]} />
      <View style={[styles.wheel, { right: 5 }]} />
    </View>
  </View>
)

// Main Login screen
const LoginScreen = ({ onLogin, onCreateAccount, onGoogleLogin }) => {
  const [studentId, setStudentId]   = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [errors, setErrors]         = useState({})

  // Basic validation
  const validate = () => {
    const newErrors = {}
    if (!studentId.trim())
      newErrors.studentId = 'Student ID is required'
    if (!email.trim())
      newErrors.email = 'University email is required'
    else if (!email.includes('@st.ug.edu.gh'))
      newErrors.email = 'Use your university email (@st.ug.edu.gh)'
    if (!password.trim())
      newErrors.password = 'Password is required'
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      // TODO: API call — POST /auth/login
      // const response = await api.post('/auth/login', { studentId, email, password })
      // if (response.data.token) onLogin(response.data.token)
      setTimeout(() => {
        setLoading(false)
        if (onLogin) onLogin()
      }, 1500)
    } catch (err) {
      setLoading(false)
      setErrors({ general: 'Invalid credentials. Please try again.' })
    }
  }

  const handleGoogleLogin = async () => {
    // TODO: API call — POST /auth/google
    if (onGoogleLogin) onGoogleLogin()
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

        {/* ── Logo + tagline ── */}
        <View style={styles.logoSection}>
          <View style={styles.iconCard}>
            <CarIcon />
          </View>
          <Text style={styles.appName}>CampusRide</Text>
          <Text style={styles.appTagline}>Safe rides for students</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>

          <Text style={styles.cardTitle}>Student Login</Text>
          <Text style={styles.cardSubtitle}>Access your campus rides</Text>

          {/* General error */}
          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          {/* Student ID */}
          <InputField
            label="Student ID"
            placeholder="Enter your student ID"
            value={studentId}
            onChangeText={(v) => {
              setStudentId(v)
              setErrors((e) => ({ ...e, studentId: null }))
            }}
            keyboardType="default"
            icon="🪪"
          />
          {errors.studentId && (
            <Text style={styles.errorText}>{errors.studentId}</Text>
          )}

          {/* University Email */}
          <InputField
            label="University Email"
            placeholder="student@st.ug.edu.gh"
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
            placeholder="Enter your password"
            value={password}
            onChangeText={(v) => {
              setPassword(v)
              setErrors((e) => ({ ...e, password: null }))
            }}
            secureTextEntry={!showPassword}
            rightAction={{
              icon: showPassword ? '🙈' : '👁️',
              onPress: () => setShowPassword((s) => !s),
            }}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* Create account link */}
          <TouchableOpacity
            onPress={onCreateAccount}
            activeOpacity={0.7}
            style={styles.createAccountBtn}
          >
            <Text style={styles.createAccountText}>
              Don't have an account?{' '}
              <Text style={styles.createAccountLink}>Create Account</Text>
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
            onPress={handleGoogleLogin}
            activeOpacity={0.85}
          >
            <GoogleIcon />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Styles
const styles = StyleSheet.create({

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

  // Logo section
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
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

  // Car icon
  carWrap: { alignItems: 'center' },
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

  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.4,
  },
  appTagline: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },

  // Form card
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
    gap: 4,
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

  // Error banner
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -2,
    marginBottom: 4,
    marginLeft: 4,
  },

  // Input field
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '400',
  },
  inputIcon: {
    paddingLeft: 10,
    opacity: 0.5,
  },
  inputIconText: {
    fontSize: 18,
  },

  // Login button
  loginBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnDisabled: {
    opacity: 0.65,
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Create account
  createAccountBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  createAccountText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  createAccountLink: {
    color: '#1E3A8A',
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Google button
  googleBtn: {
    width: '100%',
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
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

export default LoginScreen