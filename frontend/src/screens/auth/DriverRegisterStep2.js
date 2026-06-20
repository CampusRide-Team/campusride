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
  Modal,
  FlatList,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'

const CustomDropdown = ({ label, placeholder, selectedValue, items, onSelect }) => {
  const [visible, setVisible] = useState(false)

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity 
        style={styles.dropdownTrigger} 
        activeOpacity={0.7} 
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.dropdownTriggerText, !selectedValue && { color: '#94A3B8' }]}>
          {selectedValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748B" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{placeholder}</Text>
            <FlatList
              data={items}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalItem, selectedValue === item && styles.modalItemSelected]}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(item)
                    setVisible(false)
                  }}
                >
                  <Text style={[styles.modalItemText, selectedValue === item && styles.modalItemTextSelected]}>
                    {item}
                  </Text>
                  {selectedValue === item && <Ionicons name="checkmark" size={18} color="#1E3A8A" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const DriverRegisterStep2 = ({ initialData, onNext, onBack, onLogin }) => {
  //  STATE PERSISTENCE HYDRATION: Reloads state values from App.js context if backtracking occurs
  const [vehicleType, setVehicleType]   = useState(initialData?.vehicleType || '')
  const [licensePlate, setLicensePlate] = useState(initialData?.licensePlate || '')
  const [vehicleColor, setVehicleColor] = useState(initialData?.vehicleColor || '')
  const [seats, setSeats]               = useState(initialData?.seats ? String(initialData.seats) : '')
  const [errors, setErrors]             = useState({})

  const vehicleTypes = [
    'Opel', 'Kia', 'Toyota Corolla', 'Toyota Vitz / Yaris', 'Toyota Camry',
    'Hyundai', 'Honda', 'Nissan', 'Mazda', 'Mercedes-Benz'
  ]

  const vehicleColors = [
    'Black', 'White', 'Silver', 'Gray', 'Blue', 'Red', 'Green', 'Yellow', 'Brown'
  ]

  const validate = () => {
    const newErrors = {}
    if (!vehicleType) newErrors.vehicleType = 'Car brand is required'
    if (!licensePlate.trim()) newErrors.licensePlate = 'License plate is required'
    if (!vehicleColor) newErrors.vehicleColor = 'Vehicle color is required'
    if (!seats.trim()) newErrors.seats = 'Number of seats is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (!validate()) return
    const sanitizedPlate = licensePlate.trim().toUpperCase().replace(/[\s-]/g, '')

    // TODO: BACKEND INTEGRATION (Step 2 of 3)
    // Local memory state cache block mapped prior to final multipart generation gateway.
    onNext?.({ 
      vehicleType, 
      licensePlate: sanitizedPlate, 
      vehicleColor, 
      seats: parseInt(seats.trim(), 10) 
    })
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />

      <View style={styles.headerNav}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 2 of 3</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarActive} />
        <View style={styles.progressBarActive} />
        <View style={styles.progressBarInactive} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Vehicle Information</Text>
          <Text style={styles.screenSubtitle}>Enter your asset transportation parameters</Text>
        </View>

        <View style={styles.formContainer}>

          <CustomDropdown
            label="Vehicle Type / Brand"
            placeholder="Select car brand"
            selectedValue={vehicleType}
            items={vehicleTypes}
            onSelect={(value) => {
              setVehicleType(value)
              setErrors((e) => ({ ...e, vehicleType: null }))
            }}
          />
          {errors.vehicleType && <Text style={styles.errorText}>{errors.vehicleType}</Text>}

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>License Plate Number</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="e.g. GA - 123 - 24"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={licensePlate}
                onChangeText={(v) => {
                  setLicensePlate(v)
                  setErrors((e) => ({ ...e, licensePlate: null }))
                }}
              />
            </View>
          </View>
          {errors.licensePlate && <Text style={styles.errorText}>{errors.licensePlate}</Text>}

          <CustomDropdown
            label="Vehicle Color"
            placeholder="Select color"
            selectedValue={vehicleColor}
            items={vehicleColors}
            onSelect={(value) => {
              setVehicleColor(value)
              setErrors((e) => ({ ...e, vehicleColor: null }))
            }}
          />
          {errors.vehicleColor && <Text style={styles.errorText}>{errors.vehicleColor}</Text>}

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Number of Seats Available</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="e.g. 4"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                value={seats}
                onChangeText={(v) => {
                  setSeats(v)
                  setErrors((e) => ({ ...e, seats: null }))
                }}
              />
            </View>
          </View>
          {errors.seats && <Text style={styles.errorText}>{errors.seats}</Text>}

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
    marginRight: 8,
  },
  progressBarInactive: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
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
  dropdownTrigger: {
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
  dropdownTriggerText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    height: '100%',
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
    marginTop: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemSelected: {
    backgroundColor: '#F8FAFC',
  },
  modalItemText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  modalItemTextSelected: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
})

export default DriverRegisterStep2