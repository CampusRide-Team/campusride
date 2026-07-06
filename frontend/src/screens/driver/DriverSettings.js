import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

const DriverSettings = ({ onBack, onNavigate }) => {
  // Interactive Local Switch State Managers
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [darkModeEnabled, setDarkModeEnabled] = useState(false)

  const handlePrivacyCenter = () => {
    // TODO: BACKEND INTEGRATION — Map out sub-route sequence or internal disclosure link
    console.log('Privacy center routine activated.')
  }

  const handleLanguageSelect = () => {
    // TODO: BACKEND INTEGRATION — Initialize locale/i18n picker engine arrays
    console.log('Language panel picker fired.')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Top Navbar Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Title Intro Layout Headers */}
        <Text style={styles.mainTitle}>Preferences</Text>
        <Text style={styles.subTitle}>Customize your driving experience and notification triggers.</Text>

        {/* Notifications Configuration Zone */}
        <Text style={styles.sectionHeaderLabel}>Notifications</Text>

        <View style={styles.cardStack}>
          {/* Push Toggle Card Row */}
          <View style={styles.preferenceCard}>
            <View style={styles.cardIconWrap}>
              <MaterialCommunityIcons name="bell-outline" size={22} color="#1E3A8A" />
            </View>
            <View style={styles.cardTextContent}>
              <Text style={styles.settingTitleText}>Push Notifications</Text>
              <Text style={styles.settingSubtitleText}>Instant ride requests & alerts</Text>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#A3E635' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
              onValueChange={setPushEnabled}
              value={pushEnabled}
            />
          </View>

          {/* Email Toggle Card Row */}
          <View style={styles.preferenceCard}>
            <View style={styles.cardIconWrap}>
              <MaterialCommunityIcons name="email-outline" size={22} color="#1E3A8A" />
            </View>
            <View style={styles.cardTextContent}>
              <Text style={styles.settingTitleText}>Email Notifications</Text>
              <Text style={styles.settingSubtitleText}>Weekly summaries and news</Text>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#A3E635' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
              onValueChange={setEmailEnabled}
              value={emailEnabled}
            />
          </View>
        </View>

        {/* System Preferences Environment Zone */}
        <Text style={styles.sectionHeaderLabel}>App & System</Text>

        <View style={styles.cardStack}>
          {/* Dark Mode Toggle Card Row */}
          <View style={styles.preferenceCard}>
            <View style={styles.cardIconWrap}>
              <MaterialCommunityIcons name="weather-night" size={22} color="#1E3A8A" />
            </View>
            <View style={styles.cardTextContent}>
              <Text style={styles.settingTitleText}>Dark Mode</Text>
              <Text style={styles.settingSubtitleText}>Easier on the eyes at night</Text>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#A3E635' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
              onValueChange={setDarkModeEnabled}
              value={darkModeEnabled}
            />
          </View>

          {/* Language Selection Card Row */}
          <TouchableOpacity 
            style={styles.preferenceCard} 
            activeOpacity={0.8}
            onPress={handleLanguageSelect}
          >
            <View style={styles.cardIconWrap}>
              <MaterialCommunityIcons name="earth" size={22} color="#1E3A8A" />
            </View>
            <View style={styles.cardTextContent}>
              <Text style={styles.settingTitleText}>App Language</Text>
              <Text style={styles.settingSubtitleText}>English (US)</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Privacy Hero Card Component Container */}
        <TouchableOpacity 
          style={styles.privacyHeroCard} 
          activeOpacity={0.9}
          onPress={handlePrivacyCenter}
        >
          <View style={styles.privacyIconWrap}>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.privacyMainTitleText}>Privacy Center</Text>
          <Text style={styles.privacySubTitleText}>Manage your location sharing and data privacy settings.</Text>

          {/* Watermarked decorative background badge emblem */}
          <View style={styles.privacyWatermarkIconWrap}>
            <MaterialCommunityIcons name="shield-check" size={100} color="rgba(255,255,255,0.06)" />
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* App Base System Tab Nav Bar Component */}
      <View style={styles.tabBarContainer}>
        {/* Home Tab */}
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate && onNavigate('home')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="home-outline" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelText}>Home</Text>
        </TouchableOpacity>

        {/* Trips Tab */}
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate && onNavigate('active-requests')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="car-multiple" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelText}>Trips</Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate && onNavigate('profile')} activeOpacity={0.7}>
          <View style={[styles.tabIconBackground, styles.activeTabIconBackground]}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#1E3A8A" />
          </View>
          <Text style={[styles.tabLabelText, styles.activeTabLabelText]}>Profile</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E2937',
    letterSpacing: -0.8,
    marginTop: 12,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 28,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingLeft: 2,
  },
  cardStack: {
    gap: 12,
    marginBottom: 28,
  },
  preferenceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTextContent: {
    flex: 1,
    justifyContent: 'center',
  },
  settingTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2937',
    marginBottom: 2,
  },
  settingSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  privacyHeroCard: {
    position: 'relative',
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 24,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  privacyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  privacyMainTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  privacySubTitleText: {
    fontSize: 13,
    color: '#EFF6FF',
    lineHeight: 18,
    fontWeight: '500',
    paddingRight: 20,
  },
  privacyWatermarkIconWrap: {
    position: 'absolute',
    bottom: -16,
    right: -16,
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 74,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBackground: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabIconBackground: {
    backgroundColor: '#F1F5F9',
  },
  tabLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeTabLabelText: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
})

export default DriverSettings