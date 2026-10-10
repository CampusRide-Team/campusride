import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts } from '../../theme';

const ProfilePhotoScreen = ({ onContinue, onSkip, onBack, route }) => {
  const insets = useSafeAreaInsets();
  const role = route?.params?.role || 'passenger';
  const isDriver = role === 'driver';

  const [photoUri, setPhotoUri] = useState(route?.params?.photoUri || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestPermissionAndPick = async (useCamera = false) => {
    try {
      setError(null);
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setError('Camera permission is required to take a photo.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhotoUri(result.assets[0].uri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Photo library permission is required to choose a photo.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhotoUri(result.assets[0].uri);
        }
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      setError('Unable to pick photo. Please try again.');
    }
  };

  const handleContinue = () => {
    if (isDriver && !photoUri) {
      setError('A verified profile photo is required for CampusRide drivers.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onContinue) {
        onContinue({
          photoUri,
          role,
        });
      }
    }, 250);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip({
        photoUri: null,
        role,
      });
    } else if (onContinue) {
      onContinue({
        photoUri: null,
        role,
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.topBarSpacer} />
        )}

        <Image
          source={require('../../../assets/brand/wordmark_transparent.png')}
          style={styles.brandWordmark}
          resizeMode="contain"
          accessible={false}
          importantForAccessibility="no"
        />

        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Main Content Area */}
        <View style={styles.contentBlock}>
          <View style={styles.headerBlock}>
            <Text style={styles.title}>ADD A PROFILE PHOTO</Text>
            <Text style={styles.subtitle}>
              {isDriver
                ? 'CampusRide drivers require a clear face photo for university campus safety verification.'
                : 'A clear photo helps your driver or riders identify you quickly at pickup points.'}
            </Text>
          </View>

          {/* Avatar Container directly on #ECE5D2 */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => requestPermissionAndPick(false)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Select profile photo"
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={64} color={colors.text.muted} />
                </View>
              )}

              {/* Camera Action Badge */}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={18} color={colors.brand.onGoldText} />
              </View>
            </TouchableOpacity>

            {/* Photo Action Buttons */}
            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                style={styles.actionPill}
                onPress={() => requestPermissionAndPick(true)}
                activeOpacity={0.75}
              >
                <Ionicons name="camera-outline" size={18} color={colors.text.primary} />
                <Text style={styles.actionPillText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionPill}
                onPress={() => requestPermissionAndPick(false)}
                activeOpacity={0.75}
              >
                <Ionicons name="images-outline" size={18} color={colors.text.primary} />
                <Text style={styles.actionPillText}>Choose Library</Text>
              </TouchableOpacity>
            </View>

            {photoUri && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => setPhotoUri(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtnText}>Remove photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={colors.semantic.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Region */}
        <View style={styles.bottomRegion}>
          {photoUri ? (
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={handleContinue}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Continue with photo"
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.brand.onGoldText} />
              ) : (
                <Text style={styles.continueBtnText}>Continue</Text>
              )}
            </TouchableOpacity>
          ) : !isDriver ? (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Skip for now"
            >
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.baseBackground,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarSpacer: {
    width: 44,
    height: 44,
  },
  brandWordmark: {
    height: 26,
    width: 140,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  contentBlock: {
    width: '100%',
  },
  headerBlock: {
    marginBottom: 28,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.text.primary,
    letterSpacing: -0.4,
    lineHeight: 30,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: 8,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surface.base,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarImage: {
    width: 136,
    height: 136,
    borderRadius: 68,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.brand.baseBackground,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface.base,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionPillText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text.primary,
  },
  removeBtn: {
    marginTop: 14,
    padding: 6,
  },
  removeBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.semantic.danger,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.semantic.danger,
  },
  bottomRegion: {
    width: '100%',
    paddingTop: 24,
    alignItems: 'center',
  },
  continueBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.brand.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  continueBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.brand.onGoldText,
    letterSpacing: 0.3,
  },
  skipBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  skipBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});

export default ProfilePhotoScreen;
