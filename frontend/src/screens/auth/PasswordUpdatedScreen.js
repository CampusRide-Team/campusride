import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';

const PasswordUpdatedScreen = ({ onSignIn, route }) => {
  const insets = useSafeAreaInsets();
  const role = route?.params?.role || 'passenger';

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn({ role });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      {/* Centered Brand Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
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
          {/* Large Success Shield / Checkmark directly on #ECE5D2 */}
          <View style={styles.iconContainer}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Ionicons name="checkmark-sharp" size={48} color={colors.brand.onGoldText} />
              </View>
            </View>
          </View>

          {/* Headline & Subtitle */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>PASSWORD UPDATED</Text>
            <Text style={styles.subtitle}>
              Your account password has been updated securely. You can now log in to CampusRide with your new credentials.
            </Text>
          </View>
        </View>

        {/* Bottom Primary Action Button */}
        <View style={styles.bottomRegion}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleSignIn}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Sign in now"
          >
            <Text style={styles.continueBtnText}>Sign In Now</Text>
          </TouchableOpacity>
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
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentBlock: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.brand.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  headerBlock: {
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.text.primary,
    letterSpacing: -0.4,
    lineHeight: 30,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 12,
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

export default PasswordUpdatedScreen;
