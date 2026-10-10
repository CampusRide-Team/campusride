import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';

const NameInputScreen = ({ onContinue, onBack, route, initialFirstName = '', initialLastName = '' }) => {
  const insets = useSafeAreaInsets();
  const role = route?.params?.role || 'passenger';

  const [firstName, setFirstName] = useState(route?.params?.firstName || initialFirstName);
  const [lastName, setLastName] = useState(route?.params?.lastName || initialLastName);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Permissive name validation: letters, spaces, hyphens, apostrophes, international unicode characters
  const nameRegex = /^[\p{L}\p{M}'\-\s]{2,50}$/u;

  const isFirstNameValid = firstName.trim().length >= 2 && nameRegex.test(firstName.trim());
  const isLastNameValid = lastName.trim().length >= 2 && nameRegex.test(lastName.trim());
  const isFormValid = isFirstNameValid && isLastNameValid;

  const handleContinue = () => {
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    if (!lastName.trim()) {
      setError('Please enter your last name');
      return;
    }
    if (!isFirstNameValid || !isLastNameValid) {
      setError('Names must be at least 2 characters and contain valid letters');
      return;
    }

    setError(null);
    setLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    setTimeout(() => {
      setLoading(false);
      if (onContinue) {
        onContinue({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName,
          role,
        });
      }
    }, 250);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.inner, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content Area */}
          <View style={styles.contentBlock}>
            <View style={styles.headerBlock}>
              <Text style={styles.title}>WHAT'S YOUR NAME?</Text>
              <Text style={styles.subtitle}>
                Enter your official name so drivers and campus security can verify your identity.
              </Text>
            </View>

            {/* Inputs sitting directly on #ECE5D2 canvas */}
            <View style={styles.formGroup}>
              {/* First Name Input */}
              <View
                style={[
                  styles.inputPill,
                  focusedField === 'firstName' && styles.inputPillFocused,
                  error && !isFirstNameValid && styles.inputPillError,
                ]}
              >
                <TextInput
                  style={styles.inputField}
                  placeholder="First name (e.g. Kwame)"
                  placeholderTextColor={colors.text.muted}
                  value={firstName}
                  onChangeText={(val) => {
                    setFirstName(val);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoFocus={true}
                  returnKeyType="next"
                  accessibilityLabel="First Name"
                />
                {firstName.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setFirstName('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Clear first name"
                  >
                    <Ionicons name="close-circle" size={18} color={colors.text.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Last Name Input */}
              <View
                style={[
                  styles.inputPill,
                  focusedField === 'lastName' && styles.inputPillFocused,
                  error && !isLastNameValid && styles.inputPillError,
                ]}
              >
                <TextInput
                  style={styles.inputField}
                  placeholder="Last name (e.g. Mensah)"
                  placeholderTextColor={colors.text.muted}
                  value={lastName}
                  onChangeText={(val) => {
                    setLastName(val);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={isFormValid ? handleContinue : undefined}
                  accessibilityLabel="Last Name"
                />
                {lastName.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setLastName('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Clear last name"
                  >
                    <Ionicons name="close-circle" size={18} color={colors.text.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Contextual Error Message */}
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.semantic.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Bottom Dynamic Action Button */}
          <View style={styles.bottomRegion}>
            {isFormValid ? (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleContinue}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Next step"
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.brand.onGoldText} />
                ) : (
                  <Text style={styles.continueBtnText}>Next</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.baseBackground,
  },
  inner: {
    flex: 1,
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
  formGroup: {
    gap: 14,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.surface.base,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputPillFocused: {
    borderColor: colors.brand.primary,
  },
  inputPillError: {
    borderColor: colors.semantic.danger,
  },
  inputField: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.semantic.danger,
    flex: 1,
  },
  bottomRegion: {
    width: '100%',
    paddingTop: 24,
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
});

export default NameInputScreen;
