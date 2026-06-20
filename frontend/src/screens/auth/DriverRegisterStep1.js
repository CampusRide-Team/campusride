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
import { Ionicons } from '@expo/vector-icons'

const InputField = ({ label, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry = false, rightAction }) => (
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
      {rightAction && (
        <TouchableOpacity style={styles.inputRightAction} onPress={rightAction.onPress} activeOpacity={0.7}>
          <Ionicons name={rightAction.icon} size={20} color="#64748B" />
        </TouchableOpacity>
      )}
    </View>
  </View>
)

const DriverRegisterStep1 = ({ initialData, onNext, onBack, onLogin }) => {
  // 💾 STATE PERSISTENCE HYDRATION: Reads cached memory data from App.js if it exists
  const [fullName, setFullName]         = useState(initialData?.fullName || '')
  const [phone, setPhone]               = useState(initialData?.phone || '')
  const [email, setEmail]               = useState(initialData?.email || '')
  const [password, setPassword]         = useState(initialData?.password || '')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors]             = useState({})

  const validate = () => {
    const newErrors = {}
    if (!fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!phone.trim()) newErrors.phone = 'Phone number is required'

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
    if (!email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!gmailRegex.test(email.trim().toLowerCase())) {
      newErrors.email = 'Please enter a valid @gmail.com address'
    }

    if (!password.trim()) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (!validate()) return
    if (onNext) {
      const sanitizedPhone = phone.trim().replace(/\s+/g, '')

      // TODO: BACKEND INTEGRATION (Step 1 of 3 Pre-Validation Gateway)
      // If adding real-time check filters prior to entering vehicle information, execute async queries here:
      // axios.post('/api/v1/auth/drivers/check-availability', { email: email.toLowerCase(), phone: sanitizedPhone })

      onNext({ 
        fullName: fullName.trim(), 
        phone: sanitizedPhone, 
        email: email.trim().toLowerCase(), 
        password 
      })
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />

      <View style={styles.headerNav}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 1 of 3</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarActive} />
        <View style={styles.progressBarInactive} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Create Driver Account</Text>
          <Text style={styles.screenSubtitle}>Enter your personal details</Text>
        </View>

        <View style={styles.formContainer}>
          <InputField
            label="Full Name"
            placeholder="Frank Nana Asamoagyan"
            value={fullName}
            onChangeText={(v) => { setFullName(v); setErrors((e) => ({ ...e, fullName: null })) }}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

          <InputField
            label="Phone Number"
            placeholder="+233 (0) 25-704-3880"
            value={phone}
            onChangeText={(v) => { setPhone(v); setErrors((e) => ({ ...e, phone: null })) }}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          <InputField
            label="Email Address"
            placeholder="daannan001@gmail.com"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: null })) }}
            keyboardType="email-address"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <InputField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: null })) }}
            secureTextEntry={!showPassword}
            rightAction={{
              icon: showPassword ? 'eye-off-outline' : 'eye-outline',
              onPress: () => setShowPassword((s) => !s),
            }}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.continueBtnText}>Continue  →</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onLogin} activeOpacity={0.7} style={styles.loginFooterBtn}>
            <Text style={styles.loginFooterText}>
              Already have an account? <Text style={styles.loginFooterLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 16,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  progressContainer: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressBarActive: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    borderRadius: 2,
  },
  progressBarInactive: {
    flex: 2,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginLeft: 8,
  },
  titleSection: {
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  fieldWrap: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E2937',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  inputRightAction: {
    paddingLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  continueBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: '#1E3A8A',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  loginFooterBtn: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  loginFooterText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  loginFooterLink: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
})

export default DriverRegisterStep1