// PassengersPage.js
import React, { useState } from 'react'; 
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';

import ProfileScreen from './ProfileScreen'; 
import RideHistoryScreen from './RideHistoryScreen'; 
import AlertScreen from './AlertScreen';
import HelpSupportScreen from './HelpSupportScreen';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#8A8FA3';
const TEXT = '#0F1733';
const CARD_BG = '#EFF1F4';
const TAB_ACTIVE_BG = '#E8EEFF';

const RIDES = [
  { id: '1', name: 'Alex Chen', place: 'Engineering Bldg', seats: 4, eta: '3 min' },
  { id: '2', name: 'Marcus Thorne', place: 'Balme Library', seats: 4, eta: '6 min' },
];

export default function PassengersPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home');

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CampusRide</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>AVAILABLE RIDES</Text>
        {RIDES.map(ride => (
          <View key={ride.id} style={styles.card}>
            <Text style={styles.name}>{ride.name}</Text>
            <Text style={styles.sub}>{ride.place} • {ride.seats} seats • {ride.eta}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 20, fontWeight: '800', color: NAVY },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: MUTED, marginBottom: 12 },
  card: { backgroundColor: CARD_BG, padding: 16, borderRadius: 14, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '700', color: TEXT },
  sub: { fontSize: 13, color: MUTED, marginTop: 4 },
});
