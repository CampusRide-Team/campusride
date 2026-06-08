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

const InputField = ({ label, placeholder, value, onChangeText, keyboardType = 'default', isDropdown = false, onDropdownPress }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {isDropdown ? (
      <TouchableOpacity style={styles.inputRow} onPress={onDropdownPress} activeOpacity={0.7}>
        <Text style={[styles.input, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="characters"
        />
      </View>
    )}
  </View>
)

const DriverRegisterStep2 = ({ onNext, onBack, onLogin }) => {
  const [vehicleType, setVehicleType]   = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [seats, setSeats]               = useState('')
  const [errors, setErrors]             = useState({})

  const validate = () => {
    const newErrors = {}
    if (!vehicleType) newErrors.vehicleType = 'Vehicle type selection is required'
    if (!licensePlate.trim()) newErrors.licensePlate = 'License plate number is required'
    if (!vehicleColor) newErrors.vehicleColor = 'Vehicle color selection is required'
    if (!seats.trim()) newErrors.seats = 'Number of seats is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (!validate()) return
    if (onNext) {
      onNext({ vehicleType, licensePlate, vehicleColor, seats })
    }
  }

  // Temporary local mock mock modal trigger callbacks
  const handleSelectVehicleType = () => {
    setVehicleType('Shuttle Bus')
    setErrors((e) => ({ ...e, vehicleType: null }))
  }

  const handleSelectVehicleColor = () => {
    setVehicleColor('White')
    setErrors((e) => ({ ...e, vehicleColor: null }))
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 2 of 3</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarInactive} />
        <View style={[styles.progressBarActive, { marginLeft: 8 }]} />
        <View style={[styles.progressBarInactive, { marginLeft: 8 }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Vehicle Information</Text>
          <Text style={styles.screenSubtitle}>Tell us about the vehicle you’ll be driving on campus</Text>
        </View>

        <View style={styles.formContainer}>
          <InputField
            label="Vehicle Type"
            placeholder="Select Vehicle Type"
            value={vehicleType}
            isDropdown={true}
            onDropdownPress={handleSelectVehicleType}
          />
          {errors.vehicleType && <Text style={styles.errorText}>{errors.vehicleType}</Text>}

          <InputField
            label="License Plate Number"
            placeholder="e.g. GA - 123 - 24"
            value={licensePlate}
            onChangeText={(v) => { setLicensePlate(v); setErrors((e) => ({ ...e, licensePlate: null })) }}
          />
          {errors.licensePlate && <Text style={styles.errorText}>{errors.licensePlate}</Text>}

          <InputField
            label="Vehicle Color"
            placeholder="Select Vehicle Color"
            value={vehicleColor}
            isDropdown={true}
            onDropdownPress={handleSelectVehicleColor}
          />
          {errors.vehicleColor && <Text style={styles.errorText}>{errors.vehicleColor}</Text>}

          <InputField
            label="Number of Seat"
            placeholder="e.g. 4"
            value={seats}
            onChangeText={(v) => { setSeats(v); setErrors((e) => ({ ...e, seats: null })) }}
            keyboardType="number-pad"
          />
          {errors.seats && <Text style={styles.errorText}>{errors.seats}</Text>}

          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.continueBtnText}>Continue  →</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} style={styles.goBackCenterBtn} activeOpacity={0.7}>
            <Text style={styles.goBackCenterText}>← Go Back</Text>
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
  // Main Container Layout
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Header Progress Navigation
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
  backArrow: {
    fontSize: 24,
    color: '#1E3A8A',
    fontWeight: '600',
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
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressBarInactive: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },

  // Typography Elements
  titleSection: {
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 22,
  },

  // Form Field Components
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
    justifyContent: 'space-between',
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
  placeholderText: {
    color: '#94A3B8',
  },
  dropdownArrow: {
    fontSize: 11,
    color: '#64748B',
    paddingLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Action Buttons
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

  // Centered Intermediate Back Button
  goBackCenterBtn: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  goBackCenterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E2937',
  },

  // Footer Navigation
  loginFooterBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  loginFooterText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  loginFooterLink: {
    color: '#3B82F6',
    fontWeight: '700',
  },
})

export default DriverRegisterStep2