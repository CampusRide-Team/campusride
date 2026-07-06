import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'

const { width } = Dimensions.get('window')

const EditDriverProfile = ({ onBack, onChangeTab }) => {
  // Local state properties bound to text field inputs
  const [fullName, setFullName] = useState('Alex Johnson')
  const [phoneNumber, setPhoneNumber] = useState('+233 (0) 235-343-900')
  const [email, setEmail] = useState('alex.j@gmail.com')
  const [avatarUri, setAvatarUri] = useState(null) 

  // Handles the native camera and gallery workflows with automatic OS cropping overlays
  const handleUpdatePhoto = async () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option to update your profile picture:',
      [
        {
          text: 'Take Photo (Camera)',
          onPress: async () => {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync()
            if (!cameraPermission.granted) {
              Alert.alert('Permission Denied', 'CampusRide requires camera access to snap pictures.')
              return
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true, // 🌟 Launches the native OS cropping UI automatically
              aspect: [1, 1],      // 🌟 Multi-platform standard 1:1 square ratio force crop grid
              quality: 0.7,
            })

            if (!result.canceled && result.assets && result.assets.length > 0) {
              setAvatarUri(result.assets[0].uri)
            }
          },
        },
        {
          text: 'Choose From Gallery',
          onPress: async () => {
            const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (!galleryPermission.granted) {
              Alert.alert('Permission Denied', 'CampusRide requires gallery access to browse pictures.')
              return
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true, // 🌟 Launches the native OS cropping UI automatically
              aspect: [1, 1],      // 🌟 Multi-platform standard 1:1 square ratio force crop grid
              quality: 0.7,
            })

            if (!result.canceled && result.assets && result.assets.length > 0) {
              setAvatarUri(result.assets[0].uri)
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    )
  }

  const handleSaveChanges = () => {
    // TODO: BACKEND INTEGRATION — Append avatarUri directly into FormData binary stream payloads
    console.log('Saved data values structure: ', { fullName, phoneNumber, email, avatarUri })
    if (onBack) onBack()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Top Bar Navbar Section */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.topBarButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Edit Profile</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Avatar Media Changer Interactive Component Element */}
        <View style={styles.avatarSection}>
          <View style={styles.photoContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {fullName.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.pencilBadgeButton} 
              activeOpacity={0.85} 
              onPress={handleUpdatePhoto}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#1E3A8A" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleUpdatePhoto} activeOpacity={0.7} style={styles.changePhotoLink}>
            <Text style={styles.changePhotoLinkText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Forms TextField Wrappers Stack Container */}
        <View style={styles.formStack}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabelText}>Full Name</Text>
            <TextInput
              style={styles.textFieldInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabelText}>Phone Number</Text>
            <TextInput
              style={styles.textFieldInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabelText}>Email Address</Text>
            <TextInput
              style={styles.textFieldInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="username@gmail.com"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Actions Footer Controllers Interactive Layer */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.saveChangesButton} 
            activeOpacity={0.85} 
            onPress={handleSaveChanges}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.7} onPress={onBack}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Persistent App Footer Bottom Nav Tabs Menu */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => onChangeTab && onChangeTab('home')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="home-outline" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => onChangeTab && onChangeTab('trips')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="car-multiple" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.navLabel}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => onBack && onBack()} activeOpacity={0.7}>
          <View style={[styles.tabIconBackground, styles.activeTabIconBackground]}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#1E3A8A" />
          </View>
          <Text style={styles.navLabelActive}>Profile</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topBarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  topBarSpacer: {
    width: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  photoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pencilBadgeButton: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A3E635', 
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  changePhotoLink: {
    paddingVertical: 4,
  },
  changePhotoLinkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  formStack: {
    gap: 20,
    marginBottom: 40,
  },
  inputWrapper: {
    flexDirection: 'column',
  },
  inputLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  textFieldInput: {
    height: 56,
    backgroundColor: '#F1F5F9', 
    borderRadius: 16, 
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1E2937',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  saveChangesButton: {
    backgroundColor: '#1E3A8A',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 6,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: 74,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBackground: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabIconBackground: {
    backgroundColor: '#F1F5F9',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navLabelActive: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '700',
  },
})

export default EditDriverProfile