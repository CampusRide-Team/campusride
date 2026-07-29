// ProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';

import EditProfileScreen from './EditProfileScreen';
import RideHistoryScreen from './RideHistoryScreen';
import SettingsScreen from './SettingsScreen';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#8A8FA3';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const TAB_ACTIVE_BG = '#EEF2FF';
const BORDER = '#E2E8F0';
const PILL_BG = '#F0F6FF';

// TODO: Replace with dynamic user profile data fetched from authentication context or backend API
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
      <StatusBar barStyle="light-content" backgroundColor={BLUE} translucent={false} />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Top Vibrant Blue Header Section with Overlapping Card Design */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.headerBackButton} onPress={() => onNavigate('home')} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.headerMoreButton} onPress={() => Alert.alert("Options", "More options...")} activeOpacity={0.7}>
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
              icon={<Ionicons name="person-outline" size={20} color={BLUE} />} 
              label="Edit Profile" 
              onPress={() => setCurrentView('edit-profile')} 
            />
            <View style={styles.separatorLine} />
            <ProfileMenuItem 
              icon={<Ionicons name="car-outline" size={20} color={BLUE} />} 
              label="Ride History" 
              badgeCount={3} // TODO: Bind with dynamic completed ride count from API
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
      </View>
    </SafeAreaView>
  );
}

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
    paddingTop: 16,
    paddingBottom: 44,
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
    marginTop: 8,
  },
  avatarWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
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
  studentName: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 2, letterSpacing: -0.2 },
  studentIdText: { fontSize: 13, color: '#E0F2FE', fontWeight: '700', marginBottom: 2 },
  studentEmailText: { fontSize: 12, color: '#E0F2FE', fontWeight: '500' },

  bodyContent: {
    paddingHorizontal: 20,
    marginTop: -22,
  },
  menuCardGroup: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
});