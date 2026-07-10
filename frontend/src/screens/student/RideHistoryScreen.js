import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
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
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => onNavigate('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={MUTED} />} label="Profile" onPress={() => onNavigate('profile')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  scroller: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF0F4' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  balanceBlock: { width: 40 },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 },
  card: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
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
});