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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#6B7280';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const BORDER = '#E2E8F0';
const PILL_BG = '#F1F5F9';

export default function EditProfileScreen({ onBack, onSave }) {
  const { user: authUser, login, token } = useAuth();
  const [fullName, setFullName] = useState(authUser?.fullName || 'Campus Passenger');
  const [email] = useState(authUser?.email || 'passenger@university.edu');
  const [phone, setPhone] = useState(authUser?.phoneNumber || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name.");
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch('/auth/profile', {
        fullName: fullName.trim(),
        phoneNumber: phone.trim()
      });

      setSaving(false);
      if (response.data?.success) {
        const updatedUser = response.data.data?.user || { ...authUser, fullName: fullName.trim(), phoneNumber: phone.trim() };
        if (login && token) {
          await login(updatedUser, token);
        }
        Alert.alert("Success", "Profile updated successfully!", [
          { text: "OK", onPress: () => onSave && onSave() }
        ]);
      }
    } catch (err) {
      setSaving(false);
      Alert.alert("Error", err.response?.data?.error?.message || err.message || "Failed to update profile.");
    }
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
        
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Image 
              source={{ uri: authUser?.avatarUri || authUser?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' }} 
              style={styles.avatarImg} 
            />
            <TouchableOpacity 
              style={styles.cameraBtn} 
              activeOpacity={0.8}
              onPress={() => Alert.alert("Upload Avatar", "Photo selector will open...")}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Fields Form Card */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CAMPUS EMAIL (READ ONLY)</Text>
            <View style={[styles.inputWrap, styles.inputDisabled]}>
              <Ionicons name="mail-outline" size={18} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: MUTED }]}
                value={email}
                editable={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color={MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && { opacity: 0.7 }]} 
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

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
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: NAVY },

  scrollContainer: { padding: 20 },

  avatarSection: { alignItems: 'center', marginVertical: 20 },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 48 },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BLUE,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  formCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 24,
  },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.5, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PILL_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    height: 48,
  },
  inputDisabled: { backgroundColor: '#F8FAFC' },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT },

  saveButton: {
    backgroundColor: NAVY,
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
});
