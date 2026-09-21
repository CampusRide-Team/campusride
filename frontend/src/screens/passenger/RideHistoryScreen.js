// RideHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api/axios';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#6B7280';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const TAB_ACTIVE_BG = '#EEF2FF';
const BORDER = '#E2E8F0';

export default function RideHistoryScreen({ onNavigate }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/history');
      if (response.data?.success && Array.isArray(response.data.data)) {
        setRides(response.data.data);
      }
    } catch (err) {
      // Safe fallback
    } finally {
      setLoading(false);
    }
  };

  const completedRidesCount = rides.filter(r => r.status === 'completed').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>Ride History</Text>
        <TouchableOpacity style={styles.filterButton} onPress={fetchHistory} activeOpacity={0.7}>
          <Feather name="refresh-cw" size={18} color={NAVY} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Total Rides Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <MaterialCommunityIcons name="car-multiple" size={22} color={BLUE} />
          </View>
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.summaryLabel}>Completed Rides</Text>
            <Text style={styles.summaryCount}>{completedRidesCount}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={NAVY} style={{ marginTop: 24 }} />
        ) : rides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={44} color={MUTED} />
            <Text style={styles.emptyTitle}>No Past Rides</Text>
            <Text style={styles.emptySub}>Your ride bookings and completed trips will appear here.</Text>
          </View>
        ) : (
          rides.map((item) => {
            const dateStr = item.createdAt 
              ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
              : 'Recent';
            const pickupName = item.pickup?.name || item.pickupLocation || 'Campus Pickup';
            const destName = item.dropoff?.name || item.dropoffLocation || item.destination || 'Campus Dropoff';
            const statusFormatted = item.status ? item.status.replace(/_/g, ' ') : 'Completed';
            const isCompleted = item.status === 'completed';

            return (
              <View key={item._id || item.id} style={styles.rideCard}>
                
                {/* Top Row: Date, Status, Type */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardDate}>{dateStr}</Text>
                  <View style={styles.cardTopRight}>
                    <Text style={[styles.completedText, !isCompleted && { color: BLUE }]}>
                      {statusFormatted}
                    </Text>
                    <Text style={[styles.rideTypeText, item.rideMode === 'solo' ? { color: '#9333EA' } : { color: BLUE }]}>
                      {item.rideMode?.toUpperCase() || 'SHARED'}
                    </Text>
                  </View>
                </View>

                {/* Route Timeline */}
                <View style={styles.routeContainer}>
                  <View style={styles.routeRow}>
                    <View style={[styles.dotIndicator, { backgroundColor: BLUE }]} />
                    <Text style={styles.routeText}>{pickupName}</Text>
                  </View>

                  <View style={styles.routeLine} />

                  <View style={styles.routeRow}>
                    <View style={[styles.dotIndicator, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.routeText}>{destName}</Text>
                  </View>
                </View>

                {/* Bottom Row: Ride ID */}
                <View style={styles.cardBottomRow}>
                  <Text style={styles.rideIdText}>Booking: #{String(item._id || item.id).substring(0, 8)}</Text>
                  {item.driverId && (
                    <Text style={styles.driverNameText}>
                      Driver: {item.driverId.fullName || 'Assigned'}
                    </Text>
                  )}
                </View>

              </View>
            );
          })
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Unified Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home-outline" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={BLUE} />} label="Rides" active={true} onPress={() => {}} />
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => onNavigate('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={MUTED} />} label="Profile" onPress={() => onNavigate('profile')} />
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

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginTop: 12 },
  emptySub: { fontSize: 13, color: MUTED, textAlign: 'center', marginTop: 6 },

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
  completedText: { fontSize: 12, fontWeight: '700', color: '#166534', textTransform: 'capitalize' },
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
  driverNameText: { fontSize: 12, fontWeight: '700', color: NAVY },

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
