import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import SplashScreen from './src/screens/SplashScreen'
import Onboarding   from './src/screens/Onboarding'
import LoginScreen  from './src/screens/LoginScreen'
import SignupScreen from './src/screens/SignupScreen'

// Uncomment as you build each screen
// import HomeScreen from './src/screens/HomeScreen'

// ─────────────────────────────────────────────
// Temporary home placeholder
// Remove this entire component once HomeScreen is built
// ─────────────────────────────────────────────
const HomePlaceholder = ({ onBack }) => (
  <View style={styles.container}>
    <View style={styles.iconCard}>
      <Text style={styles.iconEmoji}>🚗</Text>
    </View>
    <Text style={styles.title}>Welcome to CampusRide 🎉</Text>
    <Text style={styles.subtitle}>
      You are logged in.{'\n'}Home screen coming soon.
    </Text>
    <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.85}>
      <Text style={styles.backBtnText}>← Back to Login</Text>
    </TouchableOpacity>
  </View>
)

// ─────────────────────────────────────────────
// Root App — manages screen navigation
// ─────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('splash')

  // ── 1. Splash ──
  // Auto-navigates to onboarding after 3 seconds
  if (screen === 'splash') {
    return (
      <SplashScreen
        onFinish={() => setScreen('onboarding')}
      />
    )
  }

  // ── 2. Onboarding ──
  // 3 slides — Get Started and Skip both go to Login
  if (screen === 'onboarding') {
    return (
      <Onboarding
        onFinish={() => setScreen('login')}
      />
    )
  }

  // ── 3. Login ──
  // For students — uses Student ID + university email
  // TODO: BACKEND — after login, store JWT token from
  // POST /api/auth/login before calling setScreen('home')
  if (screen === 'login') {
    return (
      <LoginScreen
        onLogin={()         => setScreen('home')}
        onCreateAccount={() => setScreen('signup')}
        onGoogleLogin={()   => setScreen('home')}
      />
    )
  }

  // ── 4. Signup ──
  // For guest users — full name, phone, email, password
  // TODO: BACKEND — after signup, store JWT token from
  // POST /api/auth/signup before calling setScreen('home')
  if (screen === 'signup') {
    return (
      <SignupScreen
        onDone={()   => setScreen('home')}
        onSignIn={() => setScreen('login')}
      />
    )
  }

  // ── 5. Home ──
  // Uncomment when HomeScreen is built
  // TODO: BACKEND — protect this route by checking
  // if a valid token exists in AsyncStorage before rendering
  // if (screen === 'home') {
  //   return <HomeScreen onLogout={() => setScreen('login')} />
  // }

  // ── Temporary placeholder ──
  // Shown for 'home' until HomeScreen is ready
  return (
    <HomePlaceholder onBack={() => setScreen('login')} />
  )
}

// ─────────────────────────────────────────────
// Styles — for HomePlaceholder only
// ─────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── Layout ──
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 32,
  },

  // ── Icon card ──
  iconCard: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  iconEmoji: {
    fontSize: 32,
  },

  // ── Text ──
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Back button ──
  backBtn: {
    marginTop: 40,
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
})