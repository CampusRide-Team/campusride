// EditProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#6B7280';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const BORDER = '#E2E8F0';
const PILL_BG = '#F1F5F9';

export default function EditProfileScreen({ onBack, onSave }) {
  const [fullName, setFullName] = useState('Sarah Mitchell');
  const [email, setEmail] = useState('sarah.mitchell@gmail.com');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [affiliation, setAffiliation] = useState('Graduate Housing / Engineering Hall');

  const handleSave = () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    // TODO: BACKEND INTEGRATION - PUT /api/v1/user/profile
    Alert.alert("Success", "Profile updated successfully!", [
      { text: "OK", onPress: () => onSave && onSave() }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Profile Avatar Section with Camera Icon Outside */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' }} 
                style={styles.avatarImage} 
              />
            </View>
            <TouchableOpacity 
              style={styles.cameraIconOutside} 
              activeOpacity={0.8}
              onPress={() => Alert.alert("Photo", "Opening photo picker...")}
            >
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.updatePhotoText}>Update your profile photo</Text>
        </View>

        {/* Form Inputs Container */}
        <View style={styles.formCard}>
          
          <Text style={styles.inputLabel}>FULL NAME</Text>
          <TextInput
            style={styles.textInput}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.inputLabel}>PERSONAL EMAIL ADDRESS</Text>
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>PHONE NUMBER</Text>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>CAMPUS AFFILIATION / LOCATION</Text>
          <TextInput
            style={styles.textInput}
            value={affiliation}
            onChangeText={setAffiliation}
            placeholder="e.g. Graduate Housing"
            placeholderTextColor="#9CA3AF"
          />

        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton} 
            activeOpacity={0.85}
            onPress={onBack}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    elevation: 2,
    zIndex: 20,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: NAVY },

  scrollContainer: { padding: 20 },

  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarImage: { width: '100%', height: '100%' },
  cameraIconOutside: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: BLUE,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  updatePhotoText: { fontSize: 13, fontWeight: '700', color: MUTED, marginTop: 12 },

  formCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
  },
  textInput: {
    backgroundColor: PILL_BG,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    borderWidth: 1,
    borderColor: BORDER,
  },

  actionContainer: { gap: 12 },
  saveButton: {
    backgroundColor: NAVY,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NAVY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BLUE,
  },
  cancelButtonText: { color: BLUE, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});