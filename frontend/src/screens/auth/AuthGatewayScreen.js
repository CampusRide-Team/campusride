import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts } from '../../theme';

const AuthGatewayScreen = ({
  onContinueWithPhone,
  onContinueWithGoogle,
  onSignIn,
  onBack,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [role, setRole] = useState(route?.params?.role || 'passenger');

  useEffect(() => {
    let isMounted = true;
    const fetchStoredRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('selected_role');
        if (storedRole && isMounted) {
          setRole(storedRole);
        }
      } catch (err) {
        console.warn('[AuthGateway] Error reading cached role:', err);
      }
    };

    if (!route?.params?.role) {
      fetchStoredRole();
    }
    return () => {
      isMounted = false;
    };
  }, [route?.params?.role]);

  const handlePhoneAction = () => {
    if (onContinueWithPhone) {
      onContinueWithPhone(role);
    }
  };

  const handleGoogleAction = () => {
    if (onContinueWithGoogle) {
      onContinueWithGoogle(role);
    } else {
      Alert.alert(
        'Google Authentication',
        'Google Sign-In is currently in configuration on the campus backend. Please continue with your phone number.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSignInAction = () => {
    if (onSignIn) {
      onSignIn(role);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      {/* Navigation Top Bar with Centered Branding */}
      <View style={styles.navBar}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to role selection"
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        <Image
          source={require('../../../assets/brand/wordmark_transparent.png')}
          style={styles.brandWordmark}
          resizeMode="contain"
          accessible={false}
          importantForAccessibility="no"
        />

        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Screen Header Typography */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Safe, Smart Rides Across Campus</Text>
          <Text style={styles.subtitle}>
            {role === 'driver'
              ? 'Connect with campus riders and start driving'
              : 'Connect with verified campus drivers in seconds'}
          </Text>
        </View>

        {/* Hero Illustration - Transparent PNG directly on #ECE5D2 */}
        <View
          style={[styles.imageWrapper, { height: width * 0.62 }]}
          accessible={false}
          importantForAccessibility="no"
        >
          <Image
            source={require('../../../assets/images/auth_gateway_safety.png')}
            style={styles.illustration}
            resizeMode="contain"
            accessible={false}
          />
        </View>

        {/* Actions Stack */}
        <View style={styles.actionsStack}>
          {/* Primary Action 1: Continue with Phone */}
          <TouchableOpacity
            style={styles.primaryPhoneBtn}
            onPress={handlePhoneAction}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Continue with phone"
            accessibilityHint="Opens phone number verification screen"
          >
            <Ionicons name="call" size={20} color={colors.brand.onGoldText} style={styles.btnIcon} />
            <Text style={styles.primaryPhoneBtnText}>Continue with phone</Text>
          </TouchableOpacity>

          {/* Primary Action 2: Continue with Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleAction}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityHint="Sign in using your Google account"
          >
            <Image
              source={require('../../../assets/brand/google_g_logo.png')}
              style={styles.googleLogo}
              resizeMode="contain"
            />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Sign In Existing User Row */}
          <View style={styles.signinRow}>
            <Text style={styles.signinPrompt}>Already have an account? </Text>
            <TouchableOpacity
              onPress={handleSignInAction}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityHint="Navigates to existing user sign-in screen"
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Disclaimer Footer */}
          <Text style={styles.disclaimerText}>
            By continuing, you agree to CampusRide Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.introductoryCanvas || '#ECE5D2', // Canonical #ECE5D2
  },
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPlaceholder: {
    width: 48,
    height: 48,
  },
  brandWordmark: {
    height: 32,
    width: 156,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text.primary, // #1A1815 (14.09:1 contrast on #ECE5D2)
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.secondary, // #6B665C (4.54:1 contrast on #ECE5D2)
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 22,
    maxWidth: 320,
  },
  imageWrapper: {
    width: '100%',
    maxHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  actionsStack: {
    width: '100%',
    gap: 14,
    marginTop: 8,
  },
  primaryPhoneBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.brand.primary, // #C89F3E Primary Gold
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  btnIcon: {
    marginRight: 10,
  },
  primaryPhoneBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.brand.onGoldText, // #1A1815 (7.16:1 contrast on #C89F3E)
    letterSpacing: 0.2,
  },
  googleBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.surface.base, // #FFFFFF Surface White
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border.subtle, // #D8D2C3
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text.primary, // #1A1815 (17.72:1 contrast on #FFFFFF)
    letterSpacing: 0.1,
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signinPrompt: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text.secondary, // #6B665C
  },
  signinLink: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text.primary, // #1A1815
    textDecorationLine: 'underline',
  },
  disclaimerText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text.secondary, // #6B665C
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
    paddingHorizontal: 12,
  },
});

export default AuthGatewayScreen;
