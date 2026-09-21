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
import { useAuth } from '../../context/AuthContext';

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

export default function ProfileScreen({ onLogout, onNavigate }) {
  const { user: authUser } = useAuth();
  const [currentView, setCurrentView] = useState('main'); // 'main', 'edit-profile', 'ride-history', 'settings'

  const profile = {
    name: authUser?.fullName || 'Campus Passenger',
    email: authUser?.email || 'passenger@university.edu',
    phoneNumber: authUser?.phoneNumber || '',
    avatarUri: authUser?.avatarUri || authUser?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  };

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
        onBack={() => setCurrentView('main')} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        
        {/* Top Vibrant Blue Header Section */}
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

          {/* Avatar & Passenger Credentials */}
          <View style={styles.profileIdentityArea}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
            </View>
            <Text style={styles.passengerName}>{profile.name}</Text>
            <Text style={styles.passengerEmailText}>{profile.email}</Text>
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
              icon={<Ionicons name="settings-outline" size={20} color={BLUE} />} 
              label="Settings" 
              onPress={() => setCurrentView('settings')} 
            />
            <View style={styles.separatorLine} />
            <ProfileMenuItem 
              icon={<Ionicons name="shield-checkmark-outline" size={20} color={BLUE} />} 
              label="Privacy & Security" 
              onPress={() => Alert.alert("Privacy", "CampusRide keeps your location and trip details securely scoped.")} 
            />
          </View>

          {/* Group 3: Logout Action Button */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
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
      <View style={styles.menuIconContainer}>
        {icon}
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      
      {badgeCount !== undefined && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      )}

      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
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
  scrollContainer: { flexGrow: 1 },

  headerBanner: {
    backgroundColor: NAVY,
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerBackButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  headerMoreButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  profileIdentityArea: { alignItems: 'center' },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: { width: '100%', height: '100%' },
  passengerName: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 2, letterSpacing: -0.2 },
  passengerEmailText: { fontSize: 13, color: '#E0F2FE', fontWeight: '500' },

  bodyContent: { paddingHorizontal: 20, marginTop: 18 },

  menuCardGroup: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PILL_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: TEXT },
  badgeContainer: {
    backgroundColor: BLUE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  separatorLine: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 50 },

  logoutButton: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
    shadowColor: '#EF4444',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: '#EF4444' },

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
