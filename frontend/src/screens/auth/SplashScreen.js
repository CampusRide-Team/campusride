import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')

const SplashScreen = ({ onFinish }) => {
  // Animation state tracking keys
  const iconScale    = useRef(new Animated.Value(0)).current
  const iconOpacity  = useRef(new Animated.Value(0)).current
  const textOpacity  = useRef(new Animated.Value(0)).current
  const textY        = useRef(new Animated.Value(20)).current
  const dot1Opacity  = useRef(new Animated.Value(0.3)).current
  const dot2Opacity  = useRef(new Animated.Value(0.3)).current
  const dot3Opacity  = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    // 1. Pop-in choreography sequence for the central icon card
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
      // 2. Slide and fade text structures once icon rests
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

    // 3. Continuous loading pulse loop engine
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

    // 4. Session timeout exit dispatch
    const timer = setTimeout(() => {
      if (onFinish) onFinish()
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Decorative ambient context elements */}
      <View style={[styles.bgDot, { top: height * 0.14, left: width * 0.12 }]} />
      <View style={[styles.bgDot, { top: height * 0.20, right: width * 0.28 }]} />
      <View style={[styles.bgDot, { top: height * 0.38, right: width * 0.07 }]} />
      <View style={[styles.bgDot, { top: height * 0.62, right: width * 0.10 }]} />
      <View style={[styles.bgDot, { top: height * 0.68, left: width * 0.20 }]} />

      {/* Center Layout Stack */}
      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.iconCard,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          {/* Unified clean vector icon to replace complex custom view grids */}
          <MaterialCommunityIcons name="car-electric" size={52} color="#FFFFFF" />
        </Animated.View>

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
          <View style={styles.divider} />
          <Text style={styles.tagline}>Smart Rides Around Campus</Text>
        </Animated.View>
      </View>

      {/* Synchronized Action Footer */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  centerContent: {
    alignItems: 'center',
    gap: 24,
  },
  iconCard: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  textBlock: {
    alignItems: 'center',
    gap: 12,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  divider: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(147,197,253,0.5)',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    gap: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
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
    fontWeight: '700',
    letterSpacing: 3,
  },
})

export default SplashScreen