import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { fonts, radii, spacing } from '../../theme';
import { CRIcon } from '../../components/common';
import api from '../../api/axios';

export default function EditDriverProfile({
  onBack,
  onChangeTab,
  driverData,
  onProfileUpdated,
}) {
  const { theme, isDark } = useTheme();
  const { colors } = theme;

  const [fullName, setFullName] = useState(driverData?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(driverData?.phoneNumber || '');
  const [email] = useState(driverData?.email || '');
  const [avatarUri, setAvatarUri] = useState(driverData?.avatarUri || null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (driverData) {
      if (driverData.fullName) setFullName(driverData.fullName);
      if (driverData.phoneNumber) setPhoneNumber(driverData.phoneNumber);
      if (driverData.avatarUri) setAvatarUri(driverData.avatarUri);
    }
  }, [driverData]);

  const initials = (fullName?.trim() || 'Driver')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'D';

  const currentAvatarUri = selectedImage?.uri || (avatarUri && avatarUri.startsWith('http') ? `${avatarUri}?t=${Date.now()}` : avatarUri);

  const handleUpdatePhoto = async () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option to update your photo:',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (!cameraPermission.granted) {
                Alert.alert('Permission Required', 'Camera access is required to take a picture.');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const filename = asset.uri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                setSelectedImage({ uri: asset.uri, name: filename, type });
              }
            } catch (err) {
              console.warn('Camera error:', err.message);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            try {
              const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!galleryPermission.granted) {
                Alert.alert('Permission Required', 'Gallery access is required to choose a picture.');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const filename = asset.uri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                setSelectedImage({ uri: asset.uri, name: filename, type });
              }
            } catch (err) {
              console.warn('Gallery error:', err.message);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSaveChanges = async () => {
    const finalName = fullName.trim();
    const finalPhone = phoneNumber.trim().replace(/\s+/g, '');

    if (!finalName) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }

    if (!finalPhone || finalPhone.length < 8) {
      Alert.alert('Validation Error', 'Please enter a valid phone number.');
      return;
    }

    try {
      setIsSubmitting(true);

      const profilePayload = new FormData();
      profilePayload.append('fullName', finalName);
      profilePayload.append('phoneNumber', finalPhone);
      profilePayload.append('email', email.trim());

      if (selectedImage) {
        const fileExt = selectedImage.name?.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeTypeFormat = fileExt === 'png' ? 'image/png' : 'image/jpeg';

        profilePayload.append('avatar', {
          uri: Platform.OS === 'android' ? selectedImage.uri : selectedImage.uri.replace('file://', ''),
          name: `profile_${Date.now()}.${fileExt}`,
          type: mimeTypeFormat,
        });
      }

      const response = await api.put('/driver/profile', profilePayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        Alert.alert('Profile Updated', 'Your profile details have been saved.', [
          {
            text: 'OK',
            onPress: () => {
              if (onProfileUpdated) onProfileUpdated(response.data.data);
              if (onBack) onBack();
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Driver profile update error:', error);
      const msg = error.response?.data?.error?.message || error.message || 'Failed to update profile details.';
      Alert.alert('Update Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.brand.baseBackground }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.brand.baseBackground}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={[styles.backButton, { backgroundColor: colors.surface.elevated }]}
              disabled={isSubmitting}
            >
              <CRIcon name="arrow-back" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Personal Information
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={[styles.avatarWrap, { backgroundColor: colors.surface.elevated }]}
              onPress={handleUpdatePhoto}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {currentAvatarUri ? (
                <Image source={{ uri: currentAvatarUri }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarInitials, { color: colors.text.primary }]}>
                  {initials}
                </Text>
              )}

              <View style={[styles.cameraBadge, { backgroundColor: colors.brand.primary, borderColor: colors.brand.baseBackground }]}>
                <CRIcon name="camera" size={14} color={colors.brand.onGoldText} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleUpdatePhoto} activeOpacity={0.7} disabled={isSubmitting}>
              <Text style={[styles.changePhotoText, { color: colors.brand.primary }]}>
                Change profile photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Stack */}
          <View style={styles.formStack}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>FULL NAME</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle }]}>
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.text.muted}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>PHONE NUMBER</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle }]}>
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholder="e.g. 0240000002"
                  placeholderTextColor={colors.text.muted}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Email (Read Only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                EMAIL ADDRESS (VERIFIED)
              </Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surface.disabled, borderColor: colors.border.subtle }]}>
                <TextInput
                  style={[styles.input, { color: colors.text.muted }]}
                  value={email}
                  editable={false}
                  selectTextOnFocus={false}
                />
                <CRIcon name="lock-closed-outline" size={16} color={colors.text.muted} />
              </View>
            </View>
          </View>

          {/* Save Changes CTA */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.brand.primary },
              isSubmitting && { opacity: 0.65 },
            ]}
            onPress={handleSaveChanges}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.brand.onGoldText} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.brand.onGoldText }]}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.xs + 2,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  avatarInitials: {
    fontFamily: fonts.extraBold,
    fontSize: 32,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  formStack: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14.5,
    height: '100%',
  },
  saveBtn: {
    height: 50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
});