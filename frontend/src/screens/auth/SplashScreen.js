import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Image,
  AccessibilityInfo,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';

export const ONBOARDING_VERSION_KEY = 'onboarding_version';
export const CURRENT_ONBOARDING_VERSION = 1;

const SplashScreen = ({ onFinish }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animation values
  const iconScale = useRef(new Animated.Value(0.85)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(16)).current;
  const dot1Opacity = useRef(new Animated.Value(0.25)).current;
  const dot2Opacity = useRef(new Animated.Value(0.25)).current;
  const dot3Opacity = useRef(new Animated.Value(0.25)).current;

  // Active animation loop refs for clean unmount teardown
  const loop1Ref = useRef(null);
  const loop2Ref = useRef(null);
  const loop3Ref = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let timerId = null;

    // Detect initial reduced-motion setting
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setReduceMotion(enabled);
      })
      .catch(() => {});

    // Listen for runtime reduced-motion toggles
    const motionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (isMounted) setReduceMotion(enabled);
      }
    );

    // Session presentation & versionable onboarding check
    const initializeApp = async () => {
      let isCompleted = false;
      try {
        const storedVersionStr = await AsyncStorage.getItem(ONBOARDING_VERSION_KEY);
        if (storedVersionStr !== null) {
          const storedVersion = parseInt(storedVersionStr, 10);
          isCompleted = !isNaN(storedVersion) && storedVersion >= CURRENT_ONBOARDING_VERSION;
        }
      } catch (err) {
        console.warn('[SplashScreen] Onboarding version read warning:', err);
      }

      // Maintain minimum presentation display (~2000ms) for smooth brand reveal
      timerId = setTimeout(() => {
        if (isMounted && onFinish) {
          onFinish({ hasCompletedOnboarding: isCompleted });
        }
      }, 2000);
    };

    initializeApp();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      if (motionSubscription?.remove) motionSubscription.remove();
      if (loop1Ref.current) loop1Ref.current.stop();
      if (loop2Ref.current) loop2Ref.current.stop();
      if (loop3Ref.current) loop3Ref.current.stop();
    };
  }, [onFinish]);

  // Execute motion animations or set instantaneous states based on reduceMotion preference
  useEffect(() => {
    if (reduceMotion) {
      // Reduced Motion Mode: Immediate static display, no continuous pulse loop
      iconScale.setValue(1);
      iconOpacity.setValue(1);
      brandOpacity.setValue(1);
      brandTranslateY.setValue(0);
      dot1Opacity.setValue(1);
      dot2Opacity.setValue(1);
      dot3Opacity.setValue(1);
      return;
    }

    // Standard Motion Sequence
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(brandTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Continuous loading pulse loops with stored cancellation handles
    const startPulse = (dot, delay) => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.25,
            duration: 350,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      return anim;
    };

    loop1Ref.current = startPulse(dot1Opacity, 0);
    loop2Ref.current = startPulse(dot2Opacity, 180);
    loop3Ref.current = startPulse(dot3Opacity, 360);

    return () => {
      if (loop1Ref.current) loop1Ref.current.stop();
      if (loop2Ref.current) loop2Ref.current.stop();
      if (loop3Ref.current) loop3Ref.current.stop();
    };
  }, [reduceMotion]);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel="CampusRide. Smart Rides Around Campus. Initializing application."
    >
      <StatusBar style="dark" />

      {/* Decorative ambient subtle accents - Excluded from screen readers */}
      <View
        style={[styles.ambientDot, { top: insets.top + 50, left: 32 }]}
        accessible={false}
        importantForAccessibility="no"
      />
      <View
        style={[styles.ambientDot, { top: insets.top + 90, right: 40 }]}
        accessible={false}
        importantForAccessibility="no"
      />
      <View
        style={[styles.ambientDot, { bottom: insets.bottom + 140, left: 48 }]}
        accessible={false}
        importantForAccessibility="no"
      />
      <View
        style={[styles.ambientDot, { bottom: insets.bottom + 180, right: 36 }]}
        accessible={false}
        importantForAccessibility="no"
      />

      {/* Center Layout Stack */}
      <View style={styles.centerContent}>
        {/* Shield App Icon Badge */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }],
            },
          ]}
          accessible={false}
          importantForAccessibility="no"
        >
          <Image
            source={require('../../../assets/brand/icon_light.png')}
            style={styles.heroIcon}
            resizeMode="contain"
            accessible={false}
          />
        </Animated.View>

        {/* Wordmark Typography & Tagline */}
        <Animated.View
          style={[
            styles.brandBlock,
            {
              opacity: brandOpacity,
              transform: [{ translateY: brandTranslateY }],
            },
          ]}
          accessible={false}
          importantForAccessibility="no"
        >
          <Image
            source={require('../../../assets/brand/wordmark_transparent.png')}
            style={[styles.wordmark, { width: Math.min(width * 0.58, 220) }]}
            resizeMode="contain"
            accessible={false}
          />

          <View style={styles.goldDivider} />

          <Text style={styles.tagline}>Smart Rides Around Campus</Text>
        </Animated.View>
      </View>

      {/* Loading Indicator Footer */}
      <View
        style={[styles.loadingContainer, { bottom: Math.max(insets.bottom + 24, 48) }]}
        accessible={false}
        importantForAccessibility="no"
      >
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
        <Text style={styles.loadingText}>LOADING</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.introductoryCanvas || '#ECE5D2', // Canonical #ECE5D2
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(200, 159, 62, 0.25)', // Primary Gold subtle accent
  },
  centerContent: {
    alignItems: 'center',
    gap: 20,
    marginTop: -20,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    width: 104,
    height: 104,
  },
  brandBlock: {
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    height: 48,
  },
  goldDivider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brand.primary, // #C89F3E
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text.secondary, // #6B665C (4.54:1 contrast on #ECE5D2)
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
    alignItems: 'center',
    gap: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary, // #C89F3E
  },
  loadingText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.text.secondary, // #6B665C (4.54:1 contrast on #ECE5D2, exceeding AA)
    letterSpacing: 1.5,
  },
});

export default SplashScreen;