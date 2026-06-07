import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'

const { width, height } = Dimensions.get('window')

// Slide data
const SLIDES = [
  {
    id: '1',
    image: require('../../assets/images/onboarding1.png'),
    title: 'Stop Waiting for\nRides',
    subtitle: 'See available campus taxis in real-time.',
  },
  {
    id: '2',
    image: require('../../assets/images/onboarding2.png'),
    title: 'Book Your Ride\nInstantly',
    subtitle: 'Match with a driver in seconds, right on campus.',
  },
  {
    id: '3',
    image: require('../../assets/images/onboarding3.png'),
    title: 'Ride Safe,\nArrive Smart',
    subtitle: 'Track your trip live and get to class on time.',
  },
]


// Dot indicator
const Dots = ({ total, active }) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          i === active ? styles.dotActive : styles.dotInactive,
        ]}
      />
    ))}
  </View>
)

// Single slide
const Slide = ({ item }) => (
  <View style={styles.slide}>

    <View style={styles.imageWrapper}>
      <Image
        source={item.image}
        style={styles.onboardingImage}
        resizeMode="cover"
      />
    </View>

    {/* Text content */}
    <View style={styles.textContent}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>

  </View>
)

// Main Onboarding component
const Onboarding = ({ onFinish }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef(null)

  const isLast = activeIndex === SLIDES.length - 1

  // Next slide or finish on last slide
  const handleNext = () => {
    if (isLast) {
      if (onFinish) onFinish()
    } else {
      const nextIndex = activeIndex + 1
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true })
      setActiveIndex(nextIndex)
    }
  }

  // Skip — goes straight to Login
  const handleSkip = () => {
    if (onFinish) onFinish()
  }

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index)
    }
  }).current

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Skip button — redirects to Login */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={handleSkip}
        activeOpacity={0.6}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Slide item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Bottom — dots + button */}
      <View style={styles.bottom}>
        <Dots total={SLIDES.length} active={activeIndex} />
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}

// Styles
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Skip button
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 28,
    zIndex: 10,
    padding: 4,
  },
  skipText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },

  flatList: {
    flex: 1,
  },

  // Each slide
  slide: {
    width: width,
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 28,
  },

  imageWrapper: {
    width: width * 0.75,
    height: height * 0.42,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    backgroundColor: '#F1F5F9',
    top: 20,
  },
  
  onboardingImage: {
    width: '100%',
    height: '100%',
  },

  // Text content
  textContent: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },

  // Bottom section
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 24,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#1E3A8A',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#CBD5E1',
  },

  // Next / Get Started button
  nextBtn: {
    width: '100%',
    height: 58,
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  nextText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
})

export default Onboarding