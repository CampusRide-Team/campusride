import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';  
import api from '../../api/axios';

const STORAGE_KEYS = {
  PUSH: '@campusride_push_enabled',
  EMAIL: '@campusride_email_enabled',
};

const DriverSettings = ({ onBack, onNavigate }) => {
  // 🌟 Directly bind to global state parameters
  const { darkModeEnabled, toggleGlobalTheme, theme } = useTheme();
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [localPush, localEmail] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PUSH),
          AsyncStorage.getItem(STORAGE_KEYS.EMAIL),
        ]);

        if (localPush !== null) setPushEnabled(JSON.parse(localPush));
        if (localEmail !== null) setEmailEnabled(JSON.parse(localEmail));
      } catch (err) {
        console.error('Failed to parse notification configurations:', err);
      }
    };
    loadSettings();
  }, []);

  const syncPreferencesWithBackend = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      await api.patch('/driver/profile/preferences', {
        preferences: {
          pushNotifications: key === STORAGE_KEYS.PUSH ? value : pushEnabled,
          emailNotifications: key === STORAGE_KEYS.EMAIL ? value : emailEnabled,
          darkMode: darkModeEnabled,
        }
      });
    } catch (err) {
      console.error('Failed to sync preferences:', err);
    }
  };

  const handlePushToggle = async (value) => {
    setPushEnabled(value);
    await syncPreferencesWithBackend(STORAGE_KEYS.PUSH, value);
  };

  const handleEmailToggle = async (value) => {
    setEmailEnabled(value);
    await syncPreferencesWithBackend(STORAGE_KEYS.EMAIL, value);
  };

  const handleDarkToggle = async (value) => {
    // 1. Instantly trigger global provider update stream
    await toggleGlobalTheme(value);
    
    // 2. Sync values downstream over database pipelines
    try {
      await api.patch('/driver/profile/preferences', {
        preferences: {
          pushNotifications: pushEnabled,
          emailNotifications: emailEnabled,
          darkMode: value,
        }
      });
    } catch (err) {
      console.error('Cloud syncing preference trace error:', err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <StatusBar style={theme.statusBar} />

      {/* Top Navbar Header Section */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.tabBarBorder }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.iconColor }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.mainTitle, { color: theme.mainText }]}>Preferences</Text>
        <Text style={[styles.subTitle, { color: theme.subText }]}>Customize your driving experience and notification triggers.</Text>

        <Text style={styles.sectionHeaderLabel}>Notifications</Text>

        <View style={styles.cardStack}>
          {/* Push Toggle Card Row */}
          <View style={[styles.preferenceCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
            <View style={[styles.cardIconWrap, { backgroundColor: theme.iconWrap }]}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={theme.iconColor} />
            </View>
            <View style={styles.cardTextContent}>
              <Text style={[styles.settingTitleText, { color: theme.mainText }]}>Push Notifications</Text>
              <Text style={[styles.settingSubtitleText, { color: theme.subText }]}>Instant ride requests & alerts</Text>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#A3E635' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
              onValueChange={handlePushToggle}
              value={pushEnabled}
            />
          </View>

          {/* Email Toggle Card Row */}
          <View style={[styles.preferenceCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
            <View style={[styles.cardIconWrap, { backgroundColor: theme.iconWrap }]}>
              <MaterialCommunityIcons name="email-outline" size={22} color={theme.iconColor} />
            </View>
            <View style={styles.cardTextContent}>
              <Text style={[styles.settingTitleText, { color: theme.mainText }]}>Email Notifications</Text>
              <Text style={[styles.settingSubtitleText, { color: theme.subText }]}>Weekly summaries and news</Text>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#A3E635' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
              onValueChange={handleEmailToggle}
              value={emailEnabled}
            />
          </View>
        </View>

        <Text style={styles.sectionHeaderLabel}>App & System</Text>

        <View style={styles.cardStack}>
          {/* Dark Mode Toggle Card Row */}
          <View style={[styles.preferenceCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
            <View style={[styles.cardIconWrap, { backgroundColor: theme.iconWrap }]}>
              <MaterialCommunityIcons name="weather-night" size={22} color={theme.iconColor} />
            </View>
            <View style={styles.cardTextContent}>
              <Text style={[styles.settingTitleText, { color: theme.mainText }]}>Dark Mode</Text>
              <Text style={[styles.settingSubtitleText, { color: theme.subText }]}>Easier on the eyes at night</Text>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#A3E635' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
              onValueChange={handleDarkToggle}  
              value={darkModeEnabled}  
            />
          </View>

          {/* Language Selection Card Row */}
          <TouchableOpacity 
            style={[styles.preferenceCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]} 
            activeOpacity={0.8}
            onPress={() => Alert.alert('Language', 'CampusRide defaults to English (US).')}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: theme.iconWrap }]}>
              <MaterialCommunityIcons name="earth" size={22} color={theme.iconColor} />
            </View>
            <View style={styles.cardTextContent}>
              <Text style={[styles.settingTitleText, { color: theme.mainText }]}>App Language</Text>
              <Text style={[styles.settingSubtitleText, { color: theme.subText }]}>English (US)</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Privacy Hero Card Component */}
        <TouchableOpacity 
          style={styles.privacyHeroCard} 
          activeOpacity={0.9}
          onPress={() => Alert.alert('Privacy', 'Data pipelines track telemetry exclusively for transit matching cycles.')}
        >
          <View style={styles.privacyIconWrap}>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.privacyMainTitleText}>Privacy Center</Text>
          <Text style={styles.privacySubTitleText}>Manage your location sharing and data privacy settings.</Text>
          <View style={styles.privacyWatermarkIconWrap}>
            <MaterialCommunityIcons name="shield-check" size={100} color="rgba(255,255,255,0.06)" />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* App Base System Tab Nav Bar Component */}
      <View style={[styles.tabBarContainer, { backgroundColor: theme.background, borderTopColor: theme.tabBarBorder }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate("home")} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="home-outline" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate("active-requests")} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="car-multiple" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelText}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate("profile")} activeOpacity={0.7}>
          <View style={[styles.tabIconBackground, darkModeEnabled ? { backgroundColor: '#334155' } : styles.activeTabIconBackground]}>
            <MaterialCommunityIcons name="account-circle" size={24} color={theme.iconColor} />
          </View>
          <Text style={[styles.tabLabelText, { color: theme.iconColor, fontWeight: '700' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  activeTabIconBackground: {
    backgroundColor: '#F1F5F9',
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  cardIconWrap: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginRight: 16,
    width: 44,
  },
  cardStack: {
    gap: 12,
    marginBottom: 28,
  },
  cardTextContent: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 6,
    marginTop: 12,
  },
  preferenceCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  privacyHeroCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    elevation: 3,
    marginBottom: 12,
    marginTop: 8,
    overflow: 'hidden',
    padding: 24,
    position: 'relative',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  privacyIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
    width: 44,
  },
  privacyMainTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  privacySubTitleText: {
    color: '#EFF6FF',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    paddingRight: 20,
  },
  privacyWatermarkIconWrap: {
    bottom: -16,
    position: 'absolute',
    right: -16,
  },
  scrollContainer: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    flexGrow: 1,
  },
  sectionHeaderLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingLeft: 2,
    textTransform: 'uppercase',
  },
  settingSubtitleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  settingTitleText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 28,
  },
  tabBarContainer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 74,
  },
  tabIconBackground: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    justifyContent: 'center',
    marginBottom: 2,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tabLabelText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default DriverSettings;