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
  Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'

const UploadRow = ({ label, icon, fileName, onUploadPress, showInput = false, inputValue, onInputChange }) => (
  <View style={styles.uploadBlock}>
    <View style={styles.uploadLabelRow}>
      <Text style={styles.uploadIcon}>{icon}</Text>
      <Text style={styles.uploadLabel}>{label}</Text>
    </View>
    <View style={styles.actionRow}>
      {showInput ? (
        <TextInput
          style={styles.inlineInput}
          placeholder="GHA-XXXXXXXXX-X"
          placeholderTextColor="#94A3B8"
          value={inputValue}
          onChangeText={onInputChange}
          autoCapitalize="characters"
          keyboardType="default"
        />
      ) : (
        <>
          <Text style={[styles.fileNameText, !fileName && styles.noFileText]} numberOfLines={1}>
            {fileName}
          </Text>
          <TouchableOpacity style={styles.inlineUploadBtn} onPress={onUploadPress} activeOpacity={0.8}>
            <Text style={styles.inlineUploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </View>
)

const DriverRegisterStep3 = ({ onSubmit, onBack, onLogin }) => {
  const [insuranceFile, setInsuranceFile] = useState(null)
  const [licenseFile, setLicenseFile]     = useState(null)
  const [registrationFile, setRegistrationFile] = useState(null)
  
  // Ghana Card Front/Back tracking states
  const [ghanaCardFront, setGhanaCardFront]     = useState(null)
  const [ghanaCardBack, setGhanaCardBack]       = useState(null)
  const [nationalIdNumber, setNationalIdNumber] = useState('')
  
  const [errors, setErrors] = useState({})

  // Determine the helper placeholder string for the single Ghana Card row
  let ghanaCardPlaceholder = 'Select front & back images'
  if (ghanaCardFront && !ghanaCardBack) ghanaCardPlaceholder = 'Front added. Please select back...'
  if (!ghanaCardFront && ghanaCardBack) ghanaCardPlaceholder = 'Back added. Please select front...'
  if (ghanaCardFront && ghanaCardBack)   ghanaCardPlaceholder = 'Front & Back uploaded successfully'

  const handleIdNumberChange = (text) => {
    let cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    if (!cleaned.startsWith('GHA') && cleaned.length > 0) {
      cleaned = 'GHA' + cleaned.replace(/[^0-9]/g, '')
    }

    let formatted = ''
    if (cleaned.length > 0) {
      formatted = 'GHA'
      let numbersOnly = cleaned.slice(3).replace(/[^0-9]/g, '')
      
      if (numbersOnly.length > 0) {
        formatted += '-' + numbersOnly.slice(0, 9)
      }
      if (numbersOnly.length > 9) {
        formatted += '-' + numbersOnly.slice(9, 10)
      }
    }
    
    setNationalIdNumber(formatted)
    setErrors((e) => ({ ...e, nationalIdNumber: null }))
  }

  const handleGhanaCardUploadPrompt = () => {
    Alert.alert(
      'Upload Ghana Card',
      'Which side of your Ghana Card are you uploading?',
      [
        {
          text: 'Front Side Image',
          onPress: () => {
            setGhanaCardFront('ghana_front.jpg')
            setErrors((e) => ({ ...e, ghanaCardFile: null }))
          }
        },
        {
          text: 'Back Side Image',
          onPress: () => {
            setGhanaCardBack('ghana_back.jpg')
            setErrors((e) => ({ ...e, ghanaCardFile: null }))
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    )
  }

  const validate = () => {
    const newErrors = {}
    if (!insuranceFile) newErrors.insuranceFile = 'Driver insurance document is required'
    if (!licenseFile) newErrors.licenseFile = 'Driver license document is required'
    if (!registrationFile) newErrors.registrationFile = 'Vehicle registration document is required'
    
    if (!ghanaCardFront || !ghanaCardBack) {
      newErrors.ghanaCardFile = 'Both Front and Back images of the Ghana Card are required'
    }
    
    const idRegex = /^GHA-\d{9}-\d{1}$/
    if (!nationalIdNumber.trim()) {
      newErrors.nationalIdNumber = 'Ghana Card number is required'
    } else if (!idRegex.test(nationalIdNumber)) {
      newErrors.nationalIdNumber = 'Must follow format: GHA-XXXXXXXXX-X'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    if (onSubmit) {
      onSubmit({
        insuranceFile,
        licenseFile,
        registrationFile,
        ghanaCardFront,
        ghanaCardBack,
        nationalIdNumber,
      })
    }
  }

  const handleUpload = (docType) => {
    const mockFileName = `uploaded_${docType}_doc.pdf`
    if (docType === 'insurance') setInsuranceFile(mockFileName)
    if (docType === 'license') setLicenseFile(mockFileName)
    if (docType === 'registration') setRegistrationFile(mockFileName)
    setErrors((e) => ({ ...e, [`${docType}File`]: null }))
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 3 of 3</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarInactive} />
        <View style={[styles.progressBarInactive, { marginLeft: 8 }]} />
        <View style={[styles.progressBarActive, { marginLeft: 8 }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Vehicle Information</Text>
          <Text style={styles.screenSubtitle}>Required for verification</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Upload Documents</Text>

          <UploadRow
            label="Driver Insurance"
            icon="🪪"
            fileName={insuranceFile || 'No file selected'}
            onUploadPress={() => handleUpload('insurance')}
          />
          {errors.insuranceFile && <Text style={styles.errorText}>{errors.insuranceFile}</Text>}

          <UploadRow
            label="Driver License"
            icon="🪪"
            fileName={licenseFile || 'No file selected'}
            onUploadPress={() => handleUpload('license')}
          />
          {errors.licenseFile && <Text style={styles.errorText}>{errors.licenseFile}</Text>}

          <UploadRow
            label="Vehicle Registration"
            icon="🚙"
            fileName={registrationFile || 'No file selected'}
            onUploadPress={() => handleUpload('registration')}
          />
          {errors.registrationFile && <Text style={styles.errorText}>{errors.registrationFile}</Text>}

          <UploadRow
            label="Ghana Card"
            icon="👤"
            fileName={ghanaCardPlaceholder}
            onUploadPress={handleGhanaCardUploadPrompt}
          />
          {errors.ghanaCardFile && <Text style={styles.errorText}>{errors.ghanaCardFile}</Text>}

          <UploadRow
            label="Ghana Card Number"
            icon="🔢"
            showInput={true}
            inputValue={nationalIdNumber}
            onInputChange={handleIdNumberChange}
          />
          {errors.nationalIdNumber && <Text style={styles.errorText}>{errors.nationalIdNumber}</Text>}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>Submit for Verification</Text>
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
  titleSection: {
    marginBottom: 32,
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
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  uploadBlock: {
    marginBottom: 16,
  },
  uploadLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  uploadIcon: {
    fontSize: 14,
    color: '#1E3A8A',
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 58,
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
  fileNameText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    paddingRight: 12,
  },
  noFileText: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  inlineInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    height: '100%',
  },
  inlineUploadBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -10,
    marginBottom: 14,
    marginLeft: 4,
  },
  submitBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: '#223C8F',
    shadowColor: '#223C8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
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

export default DriverRegisterStep3