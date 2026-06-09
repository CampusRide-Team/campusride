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
import { Picker } from '@react-native-picker/picker'

const DriverRegisterStep2 = ({ onNext, onBack, onLogin }) => {
  const [vehicleType, setVehicleType] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [seats, setSeats] = useState('')
  const [errors, setErrors] = useState({})

  const vehicleTypes = [
    'Opel',
    'Kia',
    'Toyota Corolla',
    'Toyota Vitz / Yaris',
    'Toyota Camry',
    'Hyundai',
    'Honda',
    'Nissan',
    'Mazda',
    'Mercedes-Benz',
  ]

  const vehicleColors = [
    'Black',
    'White',
    'Silver',
    'Gray',
    'Blue',
    'Red',
    'Green',
    'Yellow',
    'Brown',
  ]

  const validate = () => {
    const newErrors = {}

    if (!vehicleType) newErrors.vehicleType = 'Vehicle type is required'
    if (!licensePlate.trim()) newErrors.licensePlate = 'License plate is required'
    if (!vehicleColor) newErrors.vehicleColor = 'Vehicle color is required'
    if (!seats.trim()) newErrors.seats = 'Number of seats is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (!validate()) return
    onNext?.({ vehicleType, licensePlate, vehicleColor, seats })
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      <View style={styles.headerNav}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.stepIndicator}>Step 2 of 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.title}>Vehicle Information</Text>

        {/* Vehicle Type */}
        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={vehicleType}
            onValueChange={(value) => {
              setVehicleType(value)
              setErrors((e) => ({ ...e, vehicleType: null }))
            }}
          >
            <Picker.Item label="Select vehicle type" value="" />
            {vehicleTypes.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        </View>
        {errors.vehicleType && <Text style={styles.error}>{errors.vehicleType}</Text>}

        {/* License Plate */}
        <Text style={styles.label}>License Plate</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. GA - 123 - 24"
          value={licensePlate}
          onChangeText={(v) => {
            setLicensePlate(v)
            setErrors((e) => ({ ...e, licensePlate: null }))
          }}
        />
        {errors.licensePlate && <Text style={styles.error}>{errors.licensePlate}</Text>}

        {/* Vehicle Color */}
        <Text style={styles.label}>Vehicle Color</Text>
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={vehicleColor}
            onValueChange={(value) => {
              setVehicleColor(value)
              setErrors((e) => ({ ...e, vehicleColor: null }))
            }}
          >
            <Picker.Item label="Select color" value="" />
            {vehicleColors.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        </View>
        {errors.vehicleColor && <Text style={styles.error}>{errors.vehicleColor}</Text>}

        {/* Seats */}
        <Text style={styles.label}>Number of Seats</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 4"
          keyboardType="number-pad"
          value={seats}
          onChangeText={(v) => {
            setSeats(v)
            setErrors((e) => ({ ...e, seats: null }))
          }}
        />
        {errors.seats && <Text style={styles.error}>{errors.seats}</Text>}

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue →</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Go Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onLogin}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={{ color: '#3B82F6' }}>Login</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default DriverRegisterStep2

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  stepIndicator: {
    fontWeight: '700',
    color: '#1E3A8A',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    color: '#1E3A8A',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  backText: {
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '600',
  },
  loginText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#64748B',
  },
})