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

const ForgotPasswordScreen = ({ onSendCode, onBack, route }) => {
  const insets = useSafeAreaInsets();
  const role = route?.params?.role || 'passenger';

  const [identifier, setIdentifier] = useState(route?.params?.identifier || '');
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cleanInput = identifier.trim();
  const isPhone = /^[0-9+ ]{9,15}$/.test(cleanInput);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanInput);
  const isValid = isPhone || isEmail;

  const handleSendCode = async () => {
    if (!cleanInput) {
      setError('Please enter your phone number or email address');
      return;
    }
    if (!isValid) {
      setError('Please enter a valid Ghana phone number or email address');
      return;
    }

    setError(null);
    setLoading(true);

    // TODO(CAMPUSRIDE-BACKEND): Backend integration required - POST /api/v1/auth/forgot-password
    // Once backend endpoint is implemented, dispatch actual recovery code request.
    setTimeout(() => {
      setLoading(false);
      if (onSendCode) {
        onSendCode({
          identifier: cleanInput,
          isPhone,
          role,
        });
      }
    }, 400);
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
              <Text style={styles.title}>RESET YOUR PASSWORD</Text>
              <Text style={styles.subtitle}>
                Enter the phone number or email address associated with your CampusRide account.
              </Text>
            </View>

            {/* Input pill sitting directly on #ECE5D2 canvas */}
            <View
              style={[
                styles.inputPill,
                isFocused && styles.inputPillFocused,
                error && styles.inputPillError,
              ]}
            >
              <Ionicons
                name={isEmail ? 'mail-outline' : 'call-outline'}
                size={20}
                color={isFocused ? colors.brand.primary : colors.text.muted}
                style={styles.leadingIcon}
              />
              <TextInput
                style={styles.inputField}
                placeholder="024 123 4567 or student@ug.edu.gh"
                placeholderTextColor={colors.text.muted}
                value={identifier}
                onChangeText={(val) => {
                  setIdentifier(val);
                  if (error) setError(null);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={isValid ? handleSendCode : undefined}
                accessibilityLabel="Phone or Email address"
              />
              {identifier.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setIdentifier('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear input"
                >
                  <Ionicons name="close-circle" size={18} color={colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Error Feedback */}
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.semantic.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Bottom Region */}
          <View style={styles.bottomRegion}>
            {isValid ? (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleSendCode}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Send recovery code"
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.brand.onGoldText} />
                ) : (
                  <Text style={styles.continueBtnText}>Send Recovery Code</Text>
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
  leadingIcon: {
    marginRight: 12,
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

export default ForgotPasswordScreen;
