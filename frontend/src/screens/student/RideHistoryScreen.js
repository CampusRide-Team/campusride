<<<<<<< HEAD
import React from 'react';
import {
  SafeAreaView,
=======
// RideHistoryScreen.js
import React, { useState } from 'react';
import {
>>>>>>> dev
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
<<<<<<< HEAD
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

const TEXT = '#0F1733';
const MUTED = '#8A8FA3';
const SCREEN_BG = '#F6F7FA';
const CARD_BG = '#FFFFFF';
const BLUE = '#2F6BFF';
const PURPLE = '#A855F7';
const RED_PIN = '#FF3B30';
const TAB_ACTIVE_BG = '#E8EEFF';

const RIDES = [
  { id: '1', when: 'Today, 2:30 PM', status: 'Completed', visibility: 'Shared', from: 'Student Center', to: 'Engineering Building', rideId: '#CR2024001', rating: '4.8' },
  { id: '2', when: 'Yesterday, 6:45 PM', status: 'Completed', visibility: 'Private', from: 'Library', to: 'Downtown Campus', rideId: '#CR2024000', rating: '5.0' },
  { id: '3', when: 'Dec 15, 11:20 AM', status: 'Completed', visibility: 'Shared', from: 'Dormitory A', to: 'Sports Complex', rideId: '#CR2023999', rating: '4.9' },
  { id: '4', when: 'Dec 14, 3:15 PM', status: 'Completed', visibility: 'Shared', from: 'Medical Center', to: 'Student Center', rideId: '#CR2023998', rating: '4.7' },
];

const RideCard = ({ ride }) => (
  <View style={styles.card}>
    <View style={styles.cardTopRow}>
      <Text style={styles.when}>{`${ride.when}`}</Text>
      <View style={styles.statusBadge}>
        <Text style={styles.statusCompleted}>{`${ride.status}`}</Text>
      </View>
      <Text style={[styles.visibility, { color: ride.visibility === 'Shared' ? BLUE : PURPLE }]}>{`${ride.visibility}`}</Text>
    </View>

    <View style={styles.locationRow}>
      <View style={styles.dotOrigin} />
      <Text style={styles.locationText}>{`${ride.from}`}</Text>
    </View>
    <View style={styles.routeLine} />
    <View style={styles.locationRow}>
      <Ionicons name="location-sharp" size={16} color={RED_PIN} style={styles.pinSpacing} />
      <Text style={styles.locationText}>{`${ride.to}`}</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.cardBottomRow}>
      <Text style={styles.rideId}>{`Ride ID: ${ride.rideId}`}</Text>
      <View style={styles.ratingRow}>
        <Text style={styles.rating}>{`${ride.rating}`}</Text>
        <Ionicons name="star" size={14} color="#FFB100" style={styles.starMargin} />
      </View>
    </View>
  </View>
);

const TabItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
      {icon}
    </View>
    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{`${label}`}</Text>
  </TouchableOpacity>
);

export default function RideHistoryScreen({ onNavigate }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('home')} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride History</Text>
        <View style={styles.balanceBlock} /> 
      </View>

      <ScrollView style={styles.scroller} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {RIDES.map((item) => (
          <RideCard key={item.id} ride={item} />
        ))}
      </ScrollView>

      {/* Fixed Tab Bar Actions */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={BLUE} />} label="Rides" active={true} />
=======
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#6B7280';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const TAB_ACTIVE_BG = '#EEF2FF';
const BORDER = '#E2E8F0';
const PILL_BG = '#F1F5F9';

const INITIAL_HISTORY = [
  {
    id: '1',
    date: 'Today, 2:30 PM',
    status: 'Completed',
    type: 'Shared',
    pickup: 'Student Center',
    destination: 'Engineering Building',
    rideId: '#CR2024001',
    rating: '4.8',
  },
  {
    id: '2',
    date: 'Yesterday, 6:45 PM',
    status: 'Completed',
    type: 'Private',
    pickup: 'Library',
    destination: 'Downtown Campus',
    rideId: '#CR2024000',
    rating: '5.0',
  },
  {
    id: '3',
    date: 'Dec 15, 11:20 AM',
    status: 'Completed',
    type: 'Shared',
    pickup: 'Dormitory A',
    destination: 'Sports Complex',
    rideId: '#CR2023999',
    rating: '4.9',
  },
  {
    id: '4',
    date: 'Dec 14, 3:15 PM',
    status: 'Completed',
    type: 'Shared',
    pickup: 'Medical Center',
    destination: 'Student Center',
    rideId: '#CR2023998',
    rating: '4.7',
  },
];

export default function RideHistoryScreen({ onNavigate }) {
  const [rides] = useState(INITIAL_HISTORY);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>Ride History</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "Opening history filter options...")} activeOpacity={0.7}>
          <Feather name="filter" size={20} color={NAVY} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Total Rides Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <MaterialCommunityIcons name="car-multiple" size={22} color={BLUE} />
          </View>
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.summaryLabel}>Total Rides</Text>
            <Text style={styles.summaryCount}>24</Text>
          </View>
        </View>

        {/* Ride History Cards List */}
        {rides.map((item) => (
          <View key={item.id} style={styles.rideCard}>
            
            {/* Top Row: Date, Status, Type */}
            <View style={styles.cardTopRow}>
              <Text style={styles.cardDate}>{item.date}</Text>
              <View style={styles.cardTopRight}>
                <Text style={styles.completedText}>{item.status}</Text>
                <Text style={[styles.rideTypeText, item.type === 'Private' ? { color: '#9333EA' } : { color: BLUE }]}>
                  {item.type}
                </Text>
              </View>
            </View>

            {/* Route Timeline */}
            <View style={styles.routeContainer}>
              <View style={styles.routeRow}>
                <View style={[styles.dotIndicator, { backgroundColor: BLUE }]} />
                <Text style={styles.routeText}>{item.pickup}</Text>
              </View>

              <View style={styles.routeLine} />

              <View style={styles.routeRow}>
                <View style={[styles.dotIndicator, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.routeText}>{item.destination}</Text>
              </View>
            </View>

            {/* Bottom Row: Ride ID & Rating */}
            <View style={styles.cardBottomRow}>
              <Text style={styles.rideIdText}>Ride ID: {item.rideId}</Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{item.rating} ★</Text>
              </View>
            </View>

          </View>
        ))}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Unified Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home-outline" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={BLUE} />} label="Rides" active={true} onPress={() => {}} />
>>>>>>> dev
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => onNavigate('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={MUTED} />} label="Profile" onPress={() => onNavigate('profile')} />
      </View>
    </SafeAreaView>
  );
}

<<<<<<< HEAD
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  scroller: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF0F4' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  balanceBlock: { width: 40 },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 },
  card: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifycontent: 'space-between', marginBottom: 14 },
  when: { fontSize: 14, color: MUTED, fontWeight: '500', flex: 1 },
  statusBadge: { backgroundColor: '#E6F6F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  statusCompleted: { fontSize: 12, color: '#22A06B', fontWeight: '700' },
  visibility: { fontSize: 13, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  dotOrigin: { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE, marginHorizontal: 3 },
  pinSpacing: { marginRight: -2 },
  locationText: { fontSize: 15, color: TEXT, fontWeight: '500', marginLeft: 10 },
  routeLine: { width: 2, height: 12, backgroundColor: '#E2E8F0', marginLeft: 7, marginVertical: 2 },
  divider: { height: 1, backgroundColor: '#F1F2F6', marginVertical: 14 },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rideId: { fontSize: 13, color: MUTED, fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  rating: { fontSize: 13, color: TEXT, fontWeight: '700' },
  starMargin: { marginLeft: 4 },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', flexDirection: 'row', paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 22 : 10, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: -4 }, elevation: 8 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 16 },
  tabIconWrapActive: { backgroundColor: TAB_ACTIVE_BG },
  tabLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
  tabLabelActive: { color: TEXT, fontWeight: '600' },
=======
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
  filterButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scrollContainer: { padding: 16, paddingTop: 16, paddingBottom: 110 },

  summaryCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TAB_ACTIVE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: MUTED },
  summaryCount: { fontSize: 22, fontWeight: '800', color: NAVY, marginTop: 1 },

  rideCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardDate: { fontSize: 13, fontWeight: '700', color: MUTED },
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  completedText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  rideTypeText: { fontSize: 12, fontWeight: '800' },

  routeContainer: { marginBottom: 14, paddingLeft: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dotIndicator: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, height: 14, backgroundColor: BORDER, marginLeft: 4, marginVertical: 2 },
  routeText: { fontSize: 15, fontWeight: '700', color: TEXT },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
  },
  rideIdText: { fontSize: 12, fontWeight: '600', color: MUTED },
  ratingBadge: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, fontWeight: '800', color: NAVY },

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