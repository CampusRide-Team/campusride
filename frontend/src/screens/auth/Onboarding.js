import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  useWindowDimensions,
  AccessibilityInfo,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';

export const ONBOARDING_VERSION_KEY = 'onboarding_version';
export const CURRENT_ONBOARDING_VERSION = 1;

// Canonical 3 Onboarding Slides
const SLIDES = [
  {
    id: '1',
    image: require('../../../assets/images/onboarding_stop_waiting.png'),
    title: 'Stop Waiting for Rides',
    subtitle: 'See available campus taxis in real-time.',
  },
  {
    id: '2',
    image: require('../../../assets/images/onboarding_book_instantly.png'),
    title: 'Book Your Ride Instantly',
    subtitle: 'Match with a driver in seconds, right on campus.',
  },
  {
    id: '3',
    image: require('../../../assets/images/onboarding_ride_safe.png'),
    title: 'Ride Safe, Arrive Smart',
    subtitle: 'Track your trip live and get to class on time.',
  },
];

const Onboarding = ({ onFinish }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const isTransitioningRef = useRef(false);

  const isLast = activeIndex === SLIDES.length - 1;

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setReduceMotion(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (isMounted) setReduceMotion(enabled);
      }
    );

    return () => {
      isMounted = false;
      if (subscription?.remove) subscription.remove();
    };
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_VERSION_KEY, String(CURRENT_ONBOARDING_VERSION));
    } catch (err) {
      console.warn('[Onboarding] Failed to save versionable onboarding status:', err);
    }
    if (onFinish) {
      onFinish();
    }
  };

  const handleNext = () => {
    if (isTransitioningRef.current) return;

    if (isLast) {
      completeOnboarding();
    } else {
      isTransitioningRef.current = true;
      const nextIndex = Math.min(activeIndex + 1, SLIDES.length - 1);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: !reduceMotion,
      });
      setActiveIndex(nextIndex);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, reduceMotion ? 50 : 300);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setActiveIndex(newIndex);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      {/* Top Bar Header with Skip Action */}
      <View style={styles.topBar}>
        {!isLast ? (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleSkip}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            accessibilityHint="Skips remaining slides and continues to role selection"
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      {/* Horizontally Paging Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={
          reduceMotion
            ? undefined
            : Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )
        }
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Illustration Frame Container - Purely Decorative */}
            <View
              style={[
                styles.imageCard,
                {
                  width: width - 48,
                  height: width * 0.82,
                },
              ]}
              accessible={false}
              importantForAccessibility="no"
            >
              <Image
                source={item.image}
                style={styles.illustration}
                resizeMode="contain"
                accessible={false}
              />
            </View>

            {/* Typography Content Block - Primary Accessible Information */}
            <View
              style={styles.textContent}
              accessible={true}
              accessibilityLabel={`${item.title}. ${item.subtitle}`}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
        style={styles.flatList}
      />

      {/* Synchronized Footer Controls */}
      <View style={styles.footer}>
        {/* Progress Pills */}
        <View
          style={styles.dotsRow}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Slide ${activeIndex + 1} of ${SLIDES.length}`}
        >
          {SLIDES.map((_, i) => {
            if (reduceMotion) {
              const isActive = i === activeIndex;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      width: isActive ? 24 : 8,
                      backgroundColor: isActive ? colors.brand.primary : '#D8D2C3',
                    },
                  ]}
                />
              );
            }

            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });

            const dotColor = scrollX.interpolate({
              inputRange,
              outputRange: ['#D8D2C3', colors.brand.primary, '#D8D2C3'],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    backgroundColor: dotColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleNext}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get Started' : 'Next slide'}
          accessibilityHint={
            isLast
              ? 'Completes onboarding and continues to role selection'
              : 'Moves to the next introductory slide'
          }
        >
          <Text style={styles.actionBtnText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.baseBackground, // Canonical #ECE5D2
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  skipBtn: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipPlaceholder: {
    minHeight: 48,
    minWidth: 48,
  },
  skipText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.text.secondary, // #6B665C (4.54:1 contrast on #ECE5D2)
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageCard: {
    maxHeight: 330,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.text.primary, // #1A1815 (14.09:1 contrast on #ECE5D2)
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.secondary, // #6B665C (4.54:1 contrast on #ECE5D2)
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    height: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.brand.primary, // #C89F3E Primary Gold
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.brand.onGoldText, // #1A1815 (7.16:1 contrast on #C89F3E)
    letterSpacing: 0.2,
  },
});

export default Onboarding;