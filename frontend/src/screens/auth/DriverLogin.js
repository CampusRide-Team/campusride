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
  ActivityIndicator,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'

const InputField = ({ label, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry = false, icon, rightAction, rightLabel }) => (
  <View style={styles.fieldWrap}>
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {rightLabel && (
        <TouchableOpacity onPress={rightLabel.onPress} activeOpacity={0.7}>
          <Text style={styles.fieldLabelRight}>{rightLabel.text}</Text>
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={18} color="#64748B" style={styles.inputIcon} />
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
        <TouchableOpacity style={styles.inputRightAction} onPress={rightAction.onPress} activeOpacity={0.7}>
          <Ionicons name={rightAction.icon} size={18} color="#64748B" />
        </TouchableOpacity>
      )}
    </View>
  </View>
)

const DriverLogin = ({ onDriverLogin, onDriverRegister, onSupport, onBack }) => {
  const [phone, setPhone]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [errors, setErrors]             = useState({})

  const validate = () => {
    const newErrors = {}
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (phone.replace(/\s/g, '').length < 10) {
      newErrors.phone = 'Enter a valid phone number'
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    setLoading(true)
    setErrors({})

    const sanitizedPhone = phone.trim().replace(/\s+/g, '')

    try {
      // TODO: BACKEND INTEGRATION (Authentication Gateway API)
      // Send credentials payload down to server router instance:
      // 
      // const response = await fetch('https://your-api-url/api/v1/auth/drivers/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone: sanitizedPhone, password })
      // })
      // const result = await response.json()
      // if (!response.ok) throw new Error(result.message || 'Authentication failed')
      //
      // // Persist token mapping securely inside AuthContext engine:
      // await login(result.token, result.user)

      setTimeout(() => { 
        setLoading(false)
        if (onDriverLogin) onDriverLogin() 
      }, 1200)
    } catch (err) {
      setLoading(false)
      setErrors({ general: err.message || 'Invalid credentials. Please try again.' })
    }
  }

  const handleForgotPassword = () => {
    const sanitizedPhone = phone.trim().replace(/\s+/g, '')
    if (!sanitizedPhone) {
      Alert.alert('Verification Required', 'Please enter your registered phone number first to request an OTP code resetting link.')
      return
    }

    // TODO: BACKEND INTEGRATION (Password Reset Trigger)
    // fetch('https://your-api-url/api/v1/auth/drivers/forgot-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ phone: sanitizedPhone })
    // })
    console.log('Requesting password reset link for configuration code matrix:', sanitizedPhone)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.logoSection}>
          <View style={styles.iconWrap}>
            <View style={styles.iconCard}>
              <View style={styles.navArrow} />
            </View>
            <View style={styles.driverBadge}>
              <Text style={styles.driverBadgeText}>DRIVER</Text>
            </View>
          </View>
          <Text style={styles.appName}>CampusRide</Text>
          <Text style={styles.appTagline}>Driver Management Access Gateway</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver Login</Text>
          <Text style={styles.cardSubtitle}>Access your real-time transportation cockpit</Text>

          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          <InputField
            label="Phone Number"
            placeholder="+233 XX XXX XXXX"
            value={phone}
            onChangeText={(v) => { setPhone(v); setErrors((e) => ({ ...e, phone: null })) }}
            keyboardType="phone-pad"
            icon="call-outline"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          <InputField
            label="Password"
            placeholder="Enter your security credentials"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: null })) }}
            secureTextEntry={!showPassword}
            icon="lock-closed-outline"
            rightAction={{
              icon: showPassword ? 'eye-off-outline' : 'eye-outline',
              onPress: () => setShowPassword((s) => !s),
            }}
            rightLabel={{
              text: 'Forgot Password?',
              onPress: handleForgotPassword,
            }}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TouchableOpacity 
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]} 
            onPress={handleLogin} 
            activeOpacity={0.85} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Login  →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onDriverRegister} activeOpacity={0.7} style={styles.createAccountBtn}>
            <Text style={styles.createAccountText}>Don't have an account? <Text style={styles.createAccountLink}>Register →</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} style={[styles.supportRow, { marginTop: 4 }]} activeOpacity={0.7}>
            <Text style={styles.supportLink}>← Change Core Access Role</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#1E3A8A" />
          <Text style={styles.infoBannerText}>Only registered, verified drivers can access this dashboard framework.</Text>
        </View>

        <TouchableOpacity style={styles.supportRow} onPress={onSupport} activeOpacity={0.7}>
          <Text style={styles.supportText}>Need help? <Text style={styles.supportLink}>Contact Operations Support</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Adjusted to premium light neutral canvas
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  iconCard: {
    width: 76,
    height: 76,
    borderRadius: 16, // Unified to 16px radius styling boundaries
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  navArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  driverBadge: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    backgroundColor: '#A3E635', // Premium chartreuse accent indicator badge
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  driverBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // Unified to 16px radius styling boundaries
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  fieldWrap: {
    marginBottom: 16,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E2937',
  },
  fieldLabelRight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A', // Unified theme primary interactive link mapping
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16, // Enforced 16px radius alignment tokens
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    height: '100%',
  },
  inputRightAction: {
    paddingLeft: 8,
  },
  loginBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16, // Unified to 16px radius styling boundaries
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: '#1E3A8A',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginBtnDisabled: {
    opacity: 0.65,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderRadius: 16, // Unified to 16px radius styling boundaries
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
    lineHeight: 18,
  },
  createAccountBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  createAccountText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  createAccountLink: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  supportRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  supportText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  supportLink: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
})

export default DriverLogin