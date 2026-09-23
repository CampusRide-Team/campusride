import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts } from '../../theme';

export const SELECTED_ROLE_KEY = 'selected_role';

const RoleSelection = ({
  onSelectRole,
  onSelectPassenger,
  onSelectDriver,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [selectedRoleState, setSelectedRoleState] = useState(null);
  const isNavigatingRef = useRef(false);

  const handleRoleSelection = async (role) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setSelectedRoleState(role);

    try {
      await AsyncStorage.setItem(SELECTED_ROLE_KEY, role);
    } catch (err) {
      console.warn('[RoleSelection] Role persistence notice:', err);
    }

    // Brief visual feedback delay before dispatching route transition
    setTimeout(() => {
      if (onSelectRole) {
        onSelectRole(role);
      } else if (role === 'passenger' && onSelectPassenger) {
        onSelectPassenger();
      } else if (role === 'driver' && onSelectDriver) {
        onSelectDriver();
      }
      isNavigatingRef.current = false;
    }, 120);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      {/* Navigation Header */}
      <View style={styles.navBar}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to onboarding slides"
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Screen Header Typography */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Are you a passenger or a driver?</Text>
          <Text style={styles.subtitle}>Select your mode to continue</Text>
        </View>

        {/* Hero Illustration Card - Purely Decorative */}
        <View
          style={[
            styles.imageCard,
            {
              height: width * 0.58,
            },
          ]}
          accessible={false}
          importantForAccessibility="no"
        >
          <Image
            source={require('../../../assets/images/role_selection_campus.png')}
            style={styles.illustration}
            resizeMode="contain"
            accessible={false}
          />
        </View>

        {/* Stacked Selection Options */}
        <View style={styles.rolesStack}>
          {/* Passenger Role Option (Primary Gold) */}
          <TouchableOpacity
            style={[
              styles.passengerCard,
              selectedRoleState === 'passenger' && styles.selectedRoleOutline,
            ]}
            onPress={() => handleRoleSelection('passenger')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedRoleState === 'passenger' }}
            accessibilityLabel="Passenger mode"
            accessibilityHint="Select to book rides across campus"
          >
            <View style={styles.passengerIconContainer}>
              <Ionicons name="school" size={24} color="#1A1815" />
            </View>

            <View style={styles.roleMeta}>
              <Text style={styles.passengerTitle}>Passenger</Text>
              <Text style={styles.passengerSubtitle}>Book rides across campus</Text>
            </View>

            <View style={styles.chevronWrapper}>
              <Ionicons name="chevron-forward" size={22} color="#1A1815" />
            </View>
          </TouchableOpacity>

          {/* Driver Role Option (Surface White) */}
          <TouchableOpacity
            style={[
              styles.driverCard,
              selectedRoleState === 'driver' && styles.selectedDriverOutline,
            ]}
            onPress={() => handleRoleSelection('driver')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedRoleState === 'driver' }}
            accessibilityLabel="Driver mode"
            accessibilityHint="Select to drive and earn on campus"
          >
            <View style={styles.driverIconContainer}>
              <Ionicons name="car-sport" size={24} color={colors.text.primary} />
            </View>

            <View style={styles.roleMeta}>
              <Text style={styles.driverTitle}>Driver</Text>
              <Text style={styles.driverSubtitle}>Drive and earn on campus</Text>
            </View>

            <View style={styles.chevronWrapper}>
              <Ionicons name="chevron-forward" size={22} color={colors.text.secondary} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.baseBackground, // Canonical #ECE5D2
  },
  navBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 20,
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
  },
  imageCard: {
    width: '100%',
    maxHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  rolesStack: {
    width: '100%',
    gap: 16,
    marginTop: 8,
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary, // #C89F3E Primary Gold
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 76,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRoleOutline: {
    borderColor: '#1A1815',
  },
  passengerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 24, 21, 0.12)', // Subtle dark accent tint on gold
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  passengerTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.brand.onGoldText, // #1A1815 (7.16:1 contrast on #C89F3E)
    letterSpacing: -0.2,
  },
  passengerSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#1A1815',
    opacity: 0.82,
    marginTop: 2,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.base, // #FFFFFF Surface White
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border.subtle, // #D8D2C3
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 76,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedDriverOutline: {
    borderColor: colors.brand.primary, // #C89F3E
  },
  driverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.brand.primaryTint, // #F8F3E6
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  driverTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text.primary, // #1A1815 (17.72:1 contrast on #FFFFFF)
    letterSpacing: -0.2,
  },
  driverSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary, // #6B665C (5.71:1 contrast on #FFFFFF)
    marginTop: 2,
  },
  roleMeta: {
    flex: 1,
  },
  chevronWrapper: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RoleSelection;