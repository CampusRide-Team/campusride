// ProfileScreen.js
<<<<<<< HEAD
import React from 'react';
=======
import React, { useState } from 'react';
>>>>>>> dev
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
<<<<<<< HEAD
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

const BLUE = '#2F6BFF';
const TEXT = '#0F1733';
const MUTED = '#8A8FA3';
const RED = '#FF3B30';
const ICON_BG_BLUE = '#E6EFFF';
const ICON_BG_GRAY = '#EEF0F4';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F4F5F7';
const TAB_ACTIVE_BG = '#E8EEFF';

const Row = ({ icon, iconBg = ICON_BG_BLUE, label, badge, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
      {icon}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{String(badge)}</Text>
        </View>
      ) : null}
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
    <Feather name="chevron-right" size={22} color="#C2C6D0" />
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const TabItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
      {icon}
    </View>
    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

export default function ProfileScreen({ onLogout, onNavigate }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header Background Accent */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => onNavigate('home')} style={styles.navTouchArea}>
              <Feather name="arrow-left" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.navTouchArea}>
              <Feather name="more-vertical" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarWrap}>
            <FontAwesome5 name="user-alt" size={54} color={BLUE} />
          </View>
          
          <Text style={styles.name}>Sarah Mitchell</Text>
          <Text style={styles.sub}>Student ID: STU-2024-1547</Text>
          <Text style={styles.sub}>sarah.mitchell@university.edu</Text>
        </View>

        {/* Menu Cards */}
        <View style={styles.cardShifted}>
          <Row icon={<MaterialCommunityIcons name="history" size={22} color={BLUE} />} label="Edit Profile" />
          <Divider />
          <Row 
            icon={<Ionicons name="notifications" size={20} color={BLUE} />} 
            label="Ride History" 
            badge={3} 
            onPress={() => onNavigate('history')} 
          />
          <Divider />
          <Row 
            icon={<Feather name="help-circle" size={22} color={BLUE} />} 
            label="Help & Support" 
            onPress={() => onNavigate('support')} 
          />
        </View>

        <View style={styles.card}>
          <Row icon={<Ionicons name="settings-sharp" size={20} color="#3A3F52" />} iconBg={ICON_BG_GRAY} label="Settings" />
          <Divider />
          <Row icon={<MaterialCommunityIcons name="shield" size={22} color="#3A3F52" />} iconBg={ICON_BG_GRAY} label="Privacy Policy" />
          <Divider />
          <Row icon={<Ionicons name="document-text" size={20} color="#3A3F52" />} iconBg={ICON_BG_GRAY} label="Terms of Service" />
        </View>

        <TouchableOpacity style={styles.logout} onPress={onLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={22} color={RED} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Synchronized Shared System Bottom Tab Navigation Bar */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={MUTED} />} label="Rides" onPress={() => onNavigate('history')} />
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => onNavigate('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={BLUE} />} label="Profile" active={true} />
=======
  StatusBar,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';

import EditProfileScreen from './EditProfileScreen';
import RideHistoryScreen from './RideHistoryScreen';
import SettingsScreen from './SettingsScreen'; // <-- Imported SettingsScreen

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#8A8FA3';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const TAB_ACTIVE_BG = '#EEF2FF';
const BORDER = '#E2E8F0';
const PILL_BG = '#F0F6FF';

const STUDENT_PROFILE = {
  name: 'Sarah Mitchell',
  studentId: 'STU-2024-1547',
  email: 'sarah.mitchell@university.edu',
  avatarUri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
};

export default function ProfileScreen({ onLogout, onNavigate }) {
  const [profile] = useState(STUDENT_PROFILE);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'edit-profile', 'ride-history', 'settings'

  // Conditional sub-screen rendering based on internal profile navigation state
  if (currentView === 'edit-profile') {
    return (
      <EditProfileScreen 
        onBack={() => setCurrentView('main')} 
        onSave={() => setCurrentView('main')} 
      />
    );
  }

  if (currentView === 'ride-history') {
    return (
      <RideHistoryScreen 
        onNavigate={(tab) => {
          if (tab === 'profile') setCurrentView('main');
          else onNavigate(tab);
        }} 
      />
    );
  }

  if (currentView === 'settings') {
    return (
      <SettingsScreen 
        onNavigate={(tab) => {
          if (tab === 'profile') setCurrentView('main');
          else onNavigate(tab);
        }} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Top Vibrant Blue Header Section with Overlapping Card Design */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.headerBackButton} onPress={() => onNavigate('home')}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.headerMoreButton} onPress={() => Alert.alert("Options", "More options...")}>
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar & Student Credentials */}
          <View style={styles.profileIdentityArea}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
            </View>
            <Text style={styles.studentName}>{profile.name}</Text>
            <Text style={styles.studentIdText}>Student ID: {profile.studentId}</Text>
            <Text style={styles.studentEmailText}>{profile.email}</Text>
          </View>
        </View>

        {/* Floating Content Body Container */}
        <View style={styles.bodyContent}>

          {/* Group 1: Account & Activity */}
          <View style={styles.menuCardGroup}>
            <ProfileMenuItem 
              icon={<Ionicons name="time-outline" size={20} color={BLUE} />} 
              label="Edit Profile" 
              onPress={() => setCurrentView('edit-profile')} 
            />
            <View style={styles.separatorLine} />
            <ProfileMenuItem 
              icon={<Ionicons name="car-outline" size={20} color={BLUE} />} 
              label="Ride History" 
              badgeCount={3}
              onPress={() => setCurrentView('ride-history')} 
            />
            <View style={styles.separatorLine} />
            <ProfileMenuItem 
              icon={<Ionicons name="help-circle-outline" size={20} color={BLUE} />} 
              label="Help & Support" 
              onPress={() => onNavigate('support')} 
            />
          </View>

          {/* Group 2: App Preferences & Legal */}
          <View style={styles.menuCardGroup}>
            <ProfileMenuItem 
              icon={<Ionicons name="settings-outline" size={20} color={TEXT} />} 
              label="Settings" 
              onPress={() => setCurrentView('settings')} 
            />
            <View style={styles.separatorLine} />
            <ProfileMenuItem 
              icon={<Ionicons name="shield-outline" size={20} color={TEXT} />} 
              label="Privacy Policy" 
              onPress={() => Alert.alert("Privacy", "Opening privacy policy...")} 
            />
            <View style={styles.separatorLine} />
            <ProfileMenuItem 
              icon={<Ionicons name="document-text-outline" size={20} color={TEXT} />} 
              label="Terms of Service" 
              onPress={() => Alert.alert("Terms", "Opening terms of service...")} 
            />
          </View>

          {/* Logout Action Button */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                "Log Out",
                "Are you sure you want to end your session?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Log Out", style: "destructive", onPress: onLogout }
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Unified Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home-outline" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={MUTED} />} label="Rides" onPress={() => onNavigate('rides')} />
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => onNavigate('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={BLUE} />} label="Profile" active={true} onPress={() => {}} />
>>>>>>> dev
      </View>
    </SafeAreaView>
  );
}

<<<<<<< HEAD
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  scrollContent: { paddingBottom: 120 },
  header: { backgroundColor: BLUE, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 56, alignItems: 'center', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  headerTop: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyStyle: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navTouchArea: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  avatarWrap: { width: 116, height: 116, borderRadius: 58, borderWidth: 4, borderColor: '#fff', marginTop: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 12 },
  sub: { color: '#D8E3FF', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: CARD_BG, marginHorizontal: 16, marginTop: 16, borderRadius: 16, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardShifted: { backgroundColor: CARD_BG, marginHorizontal: 16, marginTop: -40, borderRadius: 16, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowLabel: { flex: 1, fontSize: 16, color: TEXT, fontWeight: '500' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: RED, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#EFF1F4', marginLeft: 70 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingVertical: 12 },
  logoutText: { color: RED, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', flexDirection: 'row', paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 22 : 10, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: -4 }, elevation: 8 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 16 },
  tabIconWrapActive: { backgroundColor: TAB_ACTIVE_BG },
  tabLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
  tabLabelActive: { color: TEXT, fontWeight: '600' },
=======
function ProfileMenuItem({ icon, label, badgeCount, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconWrap}>{icon}</View>
      <Text style={styles.menuLabel}>{label}</Text>
      
      {badgeCount > 0 && (
        <View style={styles.badgeBubble}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      )}

      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 8 }} />
    </TouchableOpacity>
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
  scrollContainer: { paddingBottom: 30 },
  
  headerBanner: {
    backgroundColor: BLUE,
    paddingTop: 12,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerBackButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerMoreButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  profileIdentityArea: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImage: { width: '100%', height: '100%' },
  studentName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  studentIdText: { fontSize: 13, color: '#E0F2FE', fontWeight: '600', marginBottom: 2 },
  studentEmailText: { fontSize: 12, color: '#E0F2FE', fontWeight: '500' },

  bodyContent: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  menuCardGroup: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PILL_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    marginLeft: 14,
  },
  separatorLine: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 18,
  },
  badgeBubble: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  logoutButton: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    elevation: 1,
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '800' },

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
>>>>>>> dev
});