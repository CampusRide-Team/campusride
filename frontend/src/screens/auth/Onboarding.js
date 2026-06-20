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
    image: require('../../../assets/images/onboarding1.png'),
    title: 'Stop Waiting for\nRides',
    subtitle: 'See available campus taxis in real-time.',
  },
  {
    id: '2',
    image: require('../../../assets/images/onboarding2.png'),
    title: 'Book Your Ride\nInstantly',
    subtitle: 'Match with a driver in seconds, right on campus.',
  },
  {
    id: '3',
    image: require('../../../assets/images/onboarding3.png'),
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

// Single slide layout block
const Slide = ({ item }) => (
  <View style={styles.slide}>
    <View style={styles.imageWrapper}>
      <Image
        source={item.image}
        style={styles.onboardingImage}
        resizeMode="cover"
      />
    </View>

    {/* Text Content Block */}
    <View style={styles.textContent}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  </View>
)

// Main Onboarding Screen
const Onboarding = ({ onFinish }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef(null)

  const isLast = activeIndex === SLIDES.length - 1

  const handleNext = () => {
    if (isLast) {
      if (onFinish) onFinish()
    } else {
      const nextIndex = activeIndex + 1
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true })
      setActiveIndex(nextIndex)
    }
  }

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

      {/* Skip Context Gateway */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={handleSkip}
        activeOpacity={0.6}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

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

      {/* Control Navigation Footer */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    padding: 6,
  },
  skipText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '700',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
    alignItems: 'center',
    paddingTop: 90,
    paddingHorizontal: 24,
  },
  imageWrapper: {
    width: width * 0.8,
    height: height * 0.4,
    borderRadius: 16, // Enforced 16px standard token
    overflow: 'hidden',
    marginBottom: 36,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  onboardingImage: {
    width: '100%',
    height: '100%',
  },
  textContent: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3A8A', // Harmonized to theme brand accent
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 24,
  },
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
    backgroundColor: '#E2E8F0',
  },
  nextBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#1E3A8A',
    borderRadius: 16, // Enforced 16px standard token
    alignItems: 'center',
    justifyContent: 'center',
    //  Styled flat to preserve clean minimalist layout guidelines
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF', // Clean high-contrast typography token
  },
})

export default Onboarding