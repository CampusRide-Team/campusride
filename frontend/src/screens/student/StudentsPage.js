// studentpage.js
import React, { useState } from 'react'; 
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

import ProfileScreen from './ProfileScreen'; 
import RideHistoryScreen from './RideHistoryScreen'; 
import AlertScreen from './AlertScreen';
import HelpSupportScreen from './HelpSupportScreen';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const LIME = '#B6E84A';
const MUTED = '#8A8FA3';
const TEXT = '#0F1733';
const CARD_BG = '#EFF1F4';
const PILL_BG = '#E6E8F5';
const TAB_ACTIVE_BG = '#E8EEFF';

const RIDES = [
  { id: '1', name: 'Alex Chen', place: 'Engineering Bldg', seats: 4, eta: '3 min' },
  { id: '2', name: 'Marcus Thorne', place: 'Student Union', seats: 4, eta: '6 min' },
];

const MAP_URI = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200';

export default function HomeScreen({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home');

  // Unified Centralized Navigation Routing Engine
  if (activeTab === 'profile') {
    return (
      <ProfileScreen 
        onLogout={onLogout} 
        onNavigate={(tab) => setActiveTab(tab)} 
      />
    );
  }

  if (activeTab === 'history') {
    return (
      <RideHistoryScreen 
        onNavigate={(tab) => setActiveTab(tab)} 
      />
    );
  }

  if (activeTab === 'alerts') {
    return (
      <AlertScreen 
        onNavigate={(tab) => setActiveTab(tab)} 
      />
    );
  }

  if (activeTab === 'support') {
    return (
      <HelpSupportScreen 
        onNavigate={(tab) => setActiveTab(tab)} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* App Header Area */}
      <View style={styles.header}>
        <Text style={styles.brand}>CampusRide</Text>
        <TouchableOpacity 
          style={styles.avatarRing} 
          onPress={() => setActiveTab('profile')} 
          activeOpacity={0.7}
        >
          <Feather name="user" size={22} color={NAVY} />
        </TouchableOpacity>
      </View>

      {/* Main Content Scroll Body */}
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <ImageBackground source={{ uri: MAP_URI }} style={styles.map}>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="location-outline" size={22} color={NAVY} />
              <TextInput placeholder="Where are you going?" placeholderTextColor="#6B7280" style={styles.searchInput} />
              <Feather name="sliders" size={20} color={NAVY} />
            </View>
          </View>

          <MapPin top={120} left={90} count={3} />
          <MapPin top={360} left={60} count={2} />
          <MapPin top={280} left={260} count={1} />

          <View style={[styles.userDotOuter, { top: 240, left: 170 }]}>
            <View style={styles.userDotInner} />
          </View>

          <TouchableOpacity style={styles.fab}>
            <Feather name="plus" size={26} color="#fff" />
          </TouchableOpacity>
        </ImageBackground>

        {/* Bottom Drawer Overlay Sheet */}
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Nearby Available Rides</Text>
              <Text style={styles.sheetSubtitle}>Find a match on your route</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {RIDES.map((r) => (
            <View key={r.id} style={styles.rideCard}>
              <View style={styles.rideAvatarWrap}>
                <Feather name="user" size={24} color={NAVY} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.rideName}>{r.name}</Text>
                <Text style={styles.rideMeta}>{`${r.place}  •  ${r.seats} seats`}</Text>
              </View>
              <View style={styles.etaPill}>
                <Text style={styles.etaText}>{r.eta}</Text>
              </View>
              <View style={styles.seatsBadge}>
                <Ionicons name="person" size={16} color={NAVY} />
                <Text style={styles.seatsText}>{r.seats}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Unified App Footer Tab Bar Navigation Controls */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home" size={22} color={BLUE} />} label="Home" active={true} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={MUTED} />} label="Rides" onPress={() => setActiveTab('history')} />
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => setActiveTab('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={MUTED} />} label="Profile" onPress={() => setActiveTab('profile')} />
      </View>
    </SafeAreaView>
  );
}

function MapPin({ top, left, count }) {
  return (
    <View style={[styles.pinWrap, { top, left }]}>
      <View style={styles.pin}><MaterialCommunityIcons name="car" size={18} color="#fff" /></View>
      <View style={styles.pinBadge}><Text style={styles.pinBadgeText}>{count}</Text></View>
    </View>
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
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff' },
  brand: { fontSize: 22, fontWeight: '800', color: NAVY },
  avatarRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#EEF0F4', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  map: { width: '100%', height: 520, position: 'relative' },
  searchContainer: { width: '100%', position: 'absolute', top: 14, zIndex: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF0F4', marginHorizontal: 16, paddingHorizontal: 16, height: 54, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#111827' },
  pinWrap: { position: 'absolute', width: 44, height: 52 },
  pin: { width: 36, height: 44, backgroundColor: NAVY, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pinBadge: { position: 'absolute', right: -6, top: -6, backgroundColor: LIME, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  pinBadgeText: { color: NAVY, fontWeight: '700', fontSize: 11 },
  userDotOuter: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(59,130,246,0.25)', alignItems: 'center', justifyContent: 'center' },
  userDotInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2563EB', borderWidth: 2, borderColor: '#fff' },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#7B82B8', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  sheet: { backgroundColor: '#fff', marginTop: -20, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 18 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: NAVY },
  sheetSubtitle: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  seeAll: { color: NAVY, fontWeight: '600', fontSize: 15 },
  rideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderRadius: 18, padding: 12, marginBottom: 14 },
  rideAvatarWrap: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  rideName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  rideMeta: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  etaPill: { backgroundColor: PILL_BG, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 10 },
  etaText: { color: NAVY, fontWeight: '600', fontSize: 12 },
  seatsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: LIME, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  seatsText: { color: NAVY, fontWeight: '700', marginLeft: 4 },
  tabBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingTop: 8, 
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 }, elevation: 8,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 16 },
  tabIconWrapActive: { backgroundColor: TAB_ACTIVE_BG },
  tabLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
  tabLabelActive: { color: TEXT, fontWeight: '600' },
});