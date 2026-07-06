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
  Image,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'

// UploadRow — reusable row for document / input fields
const UploadRow = ({
  label,
  icon,
  fileName,
  onUploadPress,
  showInput = false,
  inputValue,
  onInputChange,
}) => (
  <View style={styles.uploadBlock}>
    <View style={styles.uploadLabelRow}>
      <Ionicons name={icon} size={16} color="#1E3A8A" />
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
          <Text
            style={[styles.fileNameText, !fileName || fileName.includes('No file') ? styles.noFileText : null]}
            numberOfLines={1}
          >
            {fileName}
          </Text>
          <TouchableOpacity
            style={styles.inlineUploadBtn}
            onPress={onUploadPress}
            activeOpacity={0.8}
          >
            <Text style={styles.inlineUploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </View>
)

// GhanaCardPreview — shows thumbnail previews of front/back images
const GhanaCardPreview = ({ frontUri, backUri }) => {
  if (!frontUri && !backUri) return null
  return (
    <View style={styles.previewRow}>
      {frontUri ? (
        <View style={styles.previewItem}>
          <Image source={{ uri: frontUri }} style={styles.previewImage} />
          <Text style={styles.previewLabel}>Front View</Text>
        </View>
      ) : null}
      {backUri ? (
        <View style={styles.previewItem}>
          <Image source={{ uri: backUri }} style={styles.previewImage} />
          <Text style={styles.previewLabel}>Back View</Text>
        </View>
      ) : null}
    </View>
  )
}

const DriverRegisterStep3 = ({ initialData, onSubmit, onBack, onLogin }) => {
  // STATE PERSISTENCE HYDRATION: Keeps documents and inputs alive if needed via App.js memory layer
  const [insuranceFile, setInsuranceFile]       = useState(initialData?.insuranceFile || null)
  const [licenseFile, setLicenseFile]           = useState(initialData?.licenseFile || null)
  const [registrationFile, setRegistrationFile] = useState(initialData?.registrationFile || null)

  const [ghanaCardFront, setGhanaCardFront]     = useState(initialData?.ghanaCardFront || null)
  const [ghanaCardBack, setGhanaCardBack]       = useState(initialData?.ghanaCardBack || null)

  const [nationalIdNumber, setNationalIdNumber] = useState(initialData?.nationalIdNumber || '')
  const [errors, setErrors]                     = useState({})

  let ghanaCardPlaceholder = 'Select front & back images'
  if (ghanaCardFront && !ghanaCardBack) ghanaCardPlaceholder = 'Front added — select back...'
  if (!ghanaCardFront && ghanaCardBack) ghanaCardPlaceholder = 'Back added — select front...'
  if (ghanaCardFront && ghanaCardBack)  ghanaCardPlaceholder = '✓ Front & Back uploaded'

  const handleIdNumberChange = (text) => {
    let cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (!cleaned.startsWith('GHA') && cleaned.length > 0) {
      cleaned = 'GHA' + cleaned.replace(/[^0-9]/g, '')
    }

    let formatted = ''
    if (cleaned.length > 0) {
      formatted = 'GHA'
      const numbersOnly = cleaned.slice(3).replace(/[^0-9]/g, '')
      if (numbersOnly.length > 0) formatted += '-' + numbersOnly.slice(0, 9)
      if (numbersOnly.length > 9) formatted += '-' + numbersOnly.slice(9, 10)
    }

    setNationalIdNumber(formatted)
    setErrors((e) => ({ ...e, nationalIdNumber: null }))
  }

  const handleUpload = async (docType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      })

      if (result.canceled) return

      const file = result.assets[0]

      if (docType === 'insurance')    setInsuranceFile(file)
      if (docType === 'license')      setLicenseFile(file)
      if (docType === 'registration') setRegistrationFile(file)

      setErrors((e) => ({ ...e, [`${docType}File`]: null }))
    } catch (error) {
      Alert.alert('Error', 'Could not open file manager. Please try again.')
    }
  }

  const handleGhanaCardUploadPrompt = () => {
    Alert.alert(
      'Upload Ghana Card',
      'Which side are you uploading?',
      [
        { text: 'Front Side', onPress: () => pickGhanaCardImage('front') },
        { text: 'Back Side', onPress: () => pickGhanaCardImage('back') },
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const pickGhanaCardImage = (side) => {
    Alert.alert(
      `Ghana Card — ${side === 'front' ? 'Front' : 'Back'} Side`,
      'Choose how to provide the image:',
      [
        { text: '📁 File Manager', onPress: () => pickGhanaCardFromFiles(side) },
        { text: '📷 Take a Photo', onPress: () => pickGhanaCardFromCamera(side) },
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const pickGhanaCardFromFiles = async (side) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      })

      if (result.canceled) return

      const uri = result.assets[0].uri
      if (side === 'front') setGhanaCardFront(uri)
      if (side === 'back')  setGhanaCardBack(uri)

      setErrors((e) => ({ ...e, ghanaCardFile: null }))
    } catch (error) {
      Alert.alert('Error', `Could not open image library: ${error.message}`)
    }
  }

  const pickGhanaCardFromCamera = async (side) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access in Settings.')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      })

      if (result.canceled) return

      const uri = result.assets[0].uri
      if (side === 'front') setGhanaCardFront(uri)
      if (side === 'back')  setGhanaCardBack(uri)

      setErrors((e) => ({ ...e, ghanaCardFile: null }))
    } catch (error) {
      Alert.alert('Error', `Could not open camera: ${error.message}`)
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!insuranceFile)    newErrors.insuranceFile    = 'Driver insurance document is required'
    if (!licenseFile)      newErrors.licenseFile      = 'Driver license document is required'
    if (!registrationFile) newErrors.registrationFile = 'Vehicle registration document is required'
    if (!ghanaCardFront || !ghanaCardBack) newErrors.ghanaCardFile = 'Both Front and Back images are required'

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

    // TODO: BACKEND INTEGRATION (Step 3 of 3 Completion Gateway)
    // To send files to your live API server, compile them using FormData inside your parent submit runner:
    //
    // const multipartForm = new FormData()
    // multipartForm.append('nationalIdNumber', nationalIdNumber)
    // multipartForm.append('insurance', { uri: insuranceFile.uri, name: insuranceFile.name, type: insuranceFile.mimeType || 'application/pdf' })
    // multipartForm.append('license', { uri: licenseFile.uri, name: licenseFile.name, type: licenseFile.mimeType || 'application/pdf' })
    // multipartForm.append('registration', { uri: registrationFile.uri, name: registrationFile.name, type: registrationFile.mimeType || 'application/pdf' })
    // multipartForm.append('ghanaCardFront', { uri: ghanaCardFront, name: 'ghana_card_front.jpg', type: 'image/jpeg' })
    // multipartForm.append('ghanaCardBack', { uri: ghanaCardBack, name: 'ghana_card_back.jpg', type: 'image/jpeg' })
    //
    // fetch('https://your-api-url/api/v1/auth/drivers/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'multipart/form-data' },
    //   body: multipartForm
    // })

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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />

      <View style={styles.headerNav}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 3 of 3</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarInactive} />
        <View style={styles.progressBarInactive} />
        <View style={styles.progressBarActive} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Upload Documents</Text>
          <Text style={styles.screenSubtitle}>Required for verified system access</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Verification Assets</Text>

          {/* Driver Insurance */}
          <UploadRow
            label="Driver Insurance Cover"
            icon="shield-checkmark-outline"
            fileName={insuranceFile ? insuranceFile.name : 'No file selected'}
            onUploadPress={() => handleUpload('insurance')}
          />
          {errors.insuranceFile && <Text style={styles.errorText}>{errors.insuranceFile}</Text>}

          {/* Driver License */}
          <UploadRow
            label="Driver's License"
            icon="card-outline"
            fileName={licenseFile ? licenseFile.name : 'No file selected'}
            onUploadPress={() => handleUpload('license')}
          />
          {errors.licenseFile && <Text style={styles.errorText}>{errors.licenseFile}</Text>}

          {/* Vehicle Registration */}
          <UploadRow
            label="Vehicle Logbook / Registration"
            icon="car-sport-outline"
            fileName={registrationFile ? registrationFile.name : 'No file selected'}
            onUploadPress={() => handleUpload('registration')}
          />
          {errors.registrationFile && <Text style={styles.errorText}>{errors.registrationFile}</Text>}

          {/* Ghana Card Upload */}
          <UploadRow
            label="Ghana Card (Front & Back Images)"
            icon="person-add-outline"
            fileName={ghanaCardPlaceholder}
            onUploadPress={handleGhanaCardUploadPrompt}
          />
          {errors.ghanaCardFile && <Text style={styles.errorText}>{errors.ghanaCardFile}</Text>}

          {/* Ghana Card image previews */}
          <GhanaCardPreview frontUri={ghanaCardFront} backUri={ghanaCardBack} />

          {/* Ghana Card Number */}
          <UploadRow
            label="Ghana Card Number Ident"
            icon="keypad-outline"
            showInput={true}
            inputValue={nationalIdNumber}
            onInputChange={handleIdNumberChange}
          />
          {errors.nationalIdNumber && <Text style={styles.errorText}>{errors.nationalIdNumber}</Text>}

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>Submit Application</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} style={styles.goBackCenterBtn} activeOpacity={0.7}>
            <Text style={styles.goBackCenterText}>← Modify Vehicle Info</Text>
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
    marginLeft: 8,
  },
  progressBarInactive: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    borderRadius: 2,
    opacity: 0.15,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
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
  uploadLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  actionRow: {
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
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  previewItem: {
    alignItems: 'center',
  },
  previewImage: {
    width: 100,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginBottom: 12,
    marginLeft: 4,
  },
  submitBtn: {
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
    color: '#64748B',
  },
})

export default DriverRegisterStep3