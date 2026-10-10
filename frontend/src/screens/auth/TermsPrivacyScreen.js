import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import { formatApiError } from '../../api/axios';

const TermsPrivacyScreen = ({ onAgree, onBack, route }) => {
  const insets = useSafeAreaInsets();
  const role = route?.params?.role || 'passenger';
  const isDriver = role === 'driver';

  const [hasAgreed, setHasAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAgree = async () => {
    if (!hasAgreed) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (onAgree) {
        await onAgree({
          agreedToTerms: true,
          role,
        });
      }
    } catch (err) {
      setError(formatApiError(err, 'Registration could not be completed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const TERMS_HIGHLIGHTS = [
    {
      id: 'terms-safety',
      icon: 'shield-checkmark-outline',
      title: 'COMMUNITY SAFETY',
      text: 'Members agree to respectful campus interactions, verified identity standards, and safe transit practices.',
    },
    {
      id: 'terms-service',
      icon: 'cash-outline',
      title: 'TRANSPARENT PRICING',
      text: 'Ride route and availability information is displayed before a campus ride request is submitted.',
    },
    {
      id: 'terms-privacy',
      icon: 'lock-closed-outline',
      title: 'DATA PROTECTION',
      text: 'Your account details and location coordinates are securely encrypted and used solely for ride dispatch.',
    },
  ];

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
            <Text style={styles.title}>TERMS & PRIVACY</Text>
            <Text style={styles.subtitle}>
              Review and accept CampusRide Terms of Service and Privacy Policy before continuing.
            </Text>
          </View>

          {/* Flat Unboxed Policy Highlights directly on #ECE5D2 */}
          <View style={styles.guidelinesList}>
            {TERMS_HIGHLIGHTS.map((item, index) => {
              const isLast = index === TERMS_HIGHLIGHTS.length - 1;
              return (
                <View
                  key={item.id}
                  style={[styles.guidelineItem, !isLast && styles.guidelineDivider]}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name={item.icon} size={20} color={colors.brand.primary} />
                  </View>
                  <View style={styles.guidelineContent}>
                    <Text style={styles.guidelineTitle}>{item.title}</Text>
                    <Text style={styles.guidelineText}>{item.text}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Interactive Consent Checkbox */}
          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => {
              setHasAgreed(!hasAgreed);
              if (error) setError(null);
            }}
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hasAgreed }}
          >
            <View style={[styles.checkbox, hasAgreed && styles.checkboxActive]}>
              {hasAgreed && (
                <Ionicons name="checkmark" size={16} color={colors.brand.onGoldText} />
              )}
            </View>
            <Text style={styles.consentText}>
              I have read and agree to the{' '}
              <Text style={styles.legalLink}>CampusRide Terms of Service</Text> and{' '}
              <Text style={styles.legalLink}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

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
          {hasAgreed ? (
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={handleAgree}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={isDriver ? 'Agree and continue driver setup' : 'Agree and create account'}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.brand.onGoldText} />
              ) : (
                <Text style={styles.continueBtnText}>
                  {isDriver ? 'Agree & Continue' : 'Agree & Create Account'}
                </Text>
              )}
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
    backgroundColor: colors.brand.baseBackground, // Continuous #ECE5D2 Canvas
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
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  contentBlock: {
    width: '100%',
  },
  headerBlock: {
    marginBottom: 24,
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
  guidelinesList: {
    width: '100%',
    marginBottom: 16,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 14,
  },
  guidelineDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brand.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  guidelineContent: {
    flex: 1,
  },
  guidelineTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text.primary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  guidelineText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginTop: 3,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 2,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  consentText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 20,
  },
  legalLink: {
    fontFamily: fonts.bold,
    color: colors.brand.primary,
    textDecorationLine: 'underline',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
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
    paddingTop: 20,
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

export default TermsPrivacyScreen;
