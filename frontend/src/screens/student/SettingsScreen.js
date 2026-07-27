// SettingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#6B7280';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const TAB_ACTIVE_BG = '#EEF2FF';
const BORDER = '#E2E8F0';
const PILL_BG = '#F1F5F9';

export default function SettingsScreen({ onNavigate }) {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLock, setBiometricLock] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('profile')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>Settings</Text>
        <TouchableOpacity style={styles.helpButton} onPress={() => Alert.alert("Help", "Opening settings support...")} activeOpacity={0.7}>
          <Ionicons name="help-circle-outline" size={22} color={NAVY} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* PREFERENCES SECTION */}
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <View style={styles.cardGroup}>
          
          <View style={styles.settingRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="notifications-outline" size={18} color={BLUE} />
            </View>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#CBD5E1', true: BLUE }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.separatorLine} />

          <TouchableOpacity 
            style={styles.settingRow} 
            activeOpacity={0.7}
            onPress={() => Alert.alert("Reminder Alerts", "Configuring pre-commute countdown alert intervals...")}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="time-outline" size={18} color={BLUE} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.settingLabel}>Reminder Alerts</Text>
              <Text style={styles.settingSubLabel}>20-min pre-commute countdown</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.separatorLine} />

          <View style={styles.settingRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="moon-outline" size={18} color={BLUE} />
            </View>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#CBD5E1', true: BLUE }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.separatorLine} />

          <TouchableOpacity 
            style={styles.settingRow} 
            activeOpacity={0.7}
            onPress={() => Alert.alert("Location Services", "Managing GPS permission settings...")}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="location-outline" size={18} color={BLUE} />
            </View>
            <Text style={styles.settingLabel}>Location Services</Text>
            <View style={styles.rowRight}>
              <Text style={styles.statusText}>Always</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>

        </View>

        {/* SECURITY & PRIVACY SECTION */}
        <Text style={styles.sectionHeader}>SECURITY & PRIVACY</Text>
        <View style={styles.cardGroup}>
          
          <TouchableOpacity 
            style={styles.settingRow} 
            activeOpacity={0.7}
            onPress={() => Alert.alert("Privacy Settings", "Opening account privacy options...")}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={BLUE} />
            </View>
            <Text style={styles.settingLabel}>Account Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.separatorLine} />

          <View style={styles.settingRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="finger-print-outline" size={18} color={BLUE} />
            </View>
            <Text style={styles.settingLabel}>Biometric Lock</Text>
            <Switch
              value={biometricLock}
              onValueChange={setBiometricLock}
              trackColor={{ false: '#CBD5E1', true: BLUE }}
              thumbColor="#FFFFFF"
            />
          </View>

        </View>

        {/* ABOUT & LEGAL SECTION */}
        <Text style={styles.sectionHeader}>ABOUT & LEGAL</Text>
        <View style={styles.cardGroup}>
          
          <TouchableOpacity 
            style={styles.settingRow} 
            activeOpacity={0.7}
            onPress={() => Alert.alert("Terms of Service", "Opening terms of service...")}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="document-text-outline" size={18} color={BLUE} />
            </View>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.separatorLine} />

          <TouchableOpacity 
            style={styles.settingRow} 
            activeOpacity={0.7}
            onPress={() => Alert.alert("Privacy Policy", "Opening privacy policy...")}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="shield-outline" size={18} color={BLUE} />
            </View>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.separatorLine} />

          <View style={styles.settingRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="information-circle-outline" size={18} color={BLUE} />
            </View>
            <Text style={styles.settingLabel}>App Version</Text>
            <Text style={styles.versionText}>v2.4.0</Text>
          </View>

        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Unified Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home-outline" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={MUTED} />} label="Rides" onPress={() => onNavigate('rides')} />
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => onNavigate('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={BLUE} />} label="Profile" active={true} onPress={() => onNavigate('profile')} />
      </View>
    </SafeAreaView>
  );
}

function TabItem({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
        {icon}
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    elevation: 2,
    zIndex: 20,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: 18, fontWeight: '800', color: NAVY },
  helpButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scrollContainer: { padding: 16, paddingTop: 16, paddingBottom: 110 },

  sectionHeader: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.8, marginBottom: 8, marginTop: 10, marginLeft: 4 },
  cardGroup: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TAB_ACTIVE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    marginLeft: 14,
  },
  settingSubLabel: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: BLUE,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '700',
    color: MUTED,
  },
  separatorLine: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },

  tabBar: { 
    position: 'absolute', left: 0, right: 0, bottom: 0, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    paddingTop: 8, 
    paddingBottom: Platform.OS === 'ios' ? 24 : 12, 
    borderTopLeftRadius: 24, borderTopRightRadius: 24, 
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 10 
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 16 },
  tabIconWrapActive: { backgroundColor: TAB_ACTIVE_BG },
  tabLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
  tabLabelActive: { color: NAVY, fontWeight: '700' },
});