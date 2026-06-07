import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'

const { width, height } = Dimensions.get('window')

const SplashScreen = ({ onFinish }) => {

  // Animation values
  const iconScale    = useRef(new Animated.Value(0)).current
  const iconOpacity  = useRef(new Animated.Value(0)).current
  const textOpacity  = useRef(new Animated.Value(0)).current
  const textY        = useRef(new Animated.Value(20)).current
  const dot1Opacity  = useRef(new Animated.Value(0.3)).current
  const dot2Opacity  = useRef(new Animated.Value(0.3)).current
  const dot3Opacity  = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    // 1. Pop in the icon
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Fade in text after icon appears
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start()
    })

    // 3. Bouncing loading dots
    const bounceDot = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }

    bounceDot(dot1Opacity, 0)
    bounceDot(dot2Opacity, 200)
    bounceDot(dot3Opacity, 400)

    // 4. Navigate to onboarding after 3 seconds
    const timer = setTimeout(() => {
      if (onFinish) onFinish()
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Decorative background dots */}
      <View style={[styles.bgDot, { top: height * 0.14, left: width * 0.12 }]} />
      <View style={[styles.bgDot, { top: height * 0.20, right: width * 0.28 }]} />
      <View style={[styles.bgDot, { top: height * 0.38, right: width * 0.07 }]} />
      <View style={[styles.bgDot, { top: height * 0.62, right: width * 0.10 }]} />
      <View style={[styles.bgDot, { top: height * 0.68, left: width * 0.20 }]} />

      {/* Center content */}
      <View style={styles.centerContent}>

        {/* App icon card */}
        <Animated.View
          style={[
            styles.iconCard,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          {/* Car SVG replaced with Unicode car emoji-style using shapes */}
          <CarIcon />
        </Animated.View>

        {/* App name + tagline */}
        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: textOpacity,
              transform: [{ translateY: textY }],
            },
          ]}
        >
          <Text style={styles.appName}>CampusRide</Text>

          {/* Divider line */}
          <View style={styles.divider} />

          <Text style={styles.tagline}>Smart Rides Around Campus</Text>
        </Animated.View>

      </View>

      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
        <Text style={styles.loadingText}>LOADING</Text>
      </View>

    </View>
  )
}

// Car icon drawn with React Native views
const CarIcon = () => (
  <View style={styles.carWrap}>
    {/* Car body */}
    <View style={styles.carBody}>
      {/* Car roof */}
      <View style={styles.carRoof} />
      {/* Car base */}
      <View style={styles.carBase}>
        {/* Left wheel */}
        <View style={[styles.wheel, { left: 6 }]} />
        {/* Right wheel */}
        <View style={[styles.wheel, { right: 6 }]} />
      </View>
    </View>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    // Radial-like gradient via overlay — use LinearGradient for true gradient
  },

  // Background decorative dots
  bgDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  // Center content block
  centerContent: {
    alignItems: 'center',
    gap: 24,
  },

  // Icon card
  iconCard: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Car icon pieces
  carWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carBody: {
    alignItems: 'center',
  },
  carRoof: {
    width: 28,
    height: 14,
    backgroundColor: 'white',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginBottom: -1,
  },
  carBase: {
    width: 46,
    height: 18,
    backgroundColor: 'white',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: -4,
    paddingHorizontal: 2,
  },
  wheel: {
    position: 'absolute',
    bottom: -6,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#1E3A8A',
    borderWidth: 3,
    borderColor: 'white',
  },

  // Text block
  textBlock: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  divider: {
    width: 32,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(147,197,253,0.7)',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: '#93C5FD',
    letterSpacing: 0.3,
  },

  // Loading dots
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    gap: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#93C5FD',
  },
  loadingText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
  },
})

export default SplashScreen