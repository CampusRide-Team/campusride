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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../../components/common';
import { fonts, radii, spacing } from '../../theme';
import { API_BASE_URL } from '../../api/axios';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export default function EditProfileScreen({ navigation }) {
  const { user, login, token } = useAuth();
  const { theme, isDark } = useTheme();
  const { colors } = theme;

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [email] = useState(user?.email || '');
  const [selectedImage, setSelectedImage] = useState(null); // { uri, name, type }
  const [saving, setSaving] = useState(false);

  const currentAvatarUri = selectedImage?.uri || resolveMediaUrl(user?.avatarUri || user?.avatarUrl, API_BASE_URL);

  const getInitials = (name) => {
    if (!name) return 'CP';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera roll access is needed to select a profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.uri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        setSelectedImage({
          uri: asset.uri,
          name: filename,
          type,
        });
      }
    } catch (err) {
      console.warn('Avatar picker error:', err);
      Alert.alert('Image Selection Failed', 'Could not open image picker. Please try again.');
    }
  };

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim().replace(/\s+/g, '');

    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 8) {
      Alert.alert('Validation Error', 'Please enter a valid phone number (minimum 8 digits).');
      return;
    }

    try {
      setSaving(true);

      let response;
      if (selectedImage) {
        // Multi-part payload when avatar is updated
        const formData = new FormData();
        formData.append('fullName', trimmedName);
        formData.append('phoneNumber', trimmedPhone);
        formData.append('avatar', {
          uri: Platform.OS === 'android' ? selectedImage.uri : selectedImage.uri.replace('file://', ''),
          name: selectedImage.name || 'avatar.jpg',
          type: selectedImage.type || 'image/jpeg',
        });

        response = await api.patch('/auth/profile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Standard JSON update
        response = await api.patch('/auth/profile', {
          fullName: trimmedName,
          phoneNumber: trimmedPhone,
        });
      }

      setSaving(false);

      if (response.data?.success) {
        const updatedUser = response.data.data?.user || {
          ...user,
          fullName: trimmedName,
          phoneNumber: trimmedPhone,
          ...(response.data.data?.user?.avatarUri ? { avatarUri: response.data.data.user.avatarUri } : {}),
        };

        if (login && token) {
          await login(updatedUser, token);
        }

        Alert.alert('Profile Updated', 'Your personal information has been saved.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      setSaving(false);
      const message = err.response?.data?.error?.message || err.message || 'Failed to update profile.';
      Alert.alert('Update Failed', message);
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

      {/* Screen Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.subtle }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <CRIcon name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Personal Information
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={[
              styles.avatarWrap,
              {
                backgroundColor: colors.brand.primaryTint,
                borderColor: colors.brand.primary,
              },
            ]}
            onPress={handlePickAvatar}
            activeOpacity={0.8}
          >
            {currentAvatarUri ? (
              <Image source={{ uri: currentAvatarUri }} style={styles.avatarImg} />
            ) : (
              <Text style={[styles.avatarInitials, { color: colors.brand.primary }]}>
                {getInitials(fullName)}
              </Text>
            )}
            <View
              style={[
                styles.cameraBadge,
                {
                  backgroundColor: colors.brand.primary,
                  borderColor: colors.surface.base,
                },
              ]}
            >
              <CRIcon name="camera" size={14} color={colors.text.inverse} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.text.secondary }]}>
            Change photo
          </Text>
        </View>

        <View style={styles.formFields}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
              Full name
            </Text>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: colors.surface.base,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <TextInput
                style={[styles.textInput, { color: colors.text.primary }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
              Phone number
            </Text>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: colors.surface.base,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <TextInput
                style={[styles.textInput, { color: colors.text.primary }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={colors.text.muted}
                keyboardType="phone-pad"
              />
            </View>
            <Text style={[styles.inputHintText, { color: colors.text.muted }]}>
              Used for driver trip coordination and SOS emergency alerts.
            </Text>
          </View>

          {/* Email Address (Read-Only) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
              Email
            </Text>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: colors.surface.disabled,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <TextInput
                style={[styles.textInput, { color: colors.text.muted }]}
                value={email}
                editable={false}
              />
            </View>
            <Text style={[styles.inputHintText, { color: colors.text.muted }]}>
              Email is linked to your account authentication identity.
            </Text>
          </View>

        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.brand.primary,
              opacity: saving ? 0.7 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={colors.brand.onGoldText} size="small" />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.brand.onGoldText }]}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.extraBold,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
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
  avatarHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  formFields: { marginBottom: spacing.xs },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  inputHintText: {
    fontSize: 11,
    marginTop: 4,
    paddingLeft: 2,
  },
  saveButton: {
    height: 50,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },
});
