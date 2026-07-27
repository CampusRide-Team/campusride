// AlertScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

// Mock Notification Data for CampusRide (Strictly No Payment, Bonus, or Promo)
const INITIAL_ALERTS = [
  {
    id: '1',
    type: 'ride',
    title: 'Scheduled Ride Reminder',
    message: 'Your upcoming ride to Science Complex Block B is scheduled for tomorrow at 8:30 AM.',
    time: '10 mins ago',
    unread: true,
  },
  {
    id: '2',
    type: 'system',
    title: 'Driver Rating Saved',
    message: 'Thank you for rating Marcus Chen (★ 4.9). Your feedback helps maintain our safe campus community.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: '3',
    type: 'security',
    title: 'Safety Check Verified',
    message: 'Your student account status is fully verified for priority campus gate entry.',
    time: '3 days ago',
    unread: false,
  },
];

export default function AlertScreen({ onNavigate }) {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((item) => ({ ...item, unread: false })));
    Alert.alert("All Read", "All notifications marked as read.");
  };

  const clearAlert = (id) => {
    setAlerts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Notifications & Alerts</Text>
        </View>
        <TouchableOpacity style={styles.markReadBtn} activeOpacity={0.8} onPress={markAllAsRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
        
        {alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={32} color={MUTED} />
            </View>
            <Text style={styles.emptyTitle}>No New Alerts</Text>
            <Text style={styles.emptySub}>You are all caught up on your campus updates and ride notices.</Text>
          </View>
        ) : (
          alerts.map((item) => (
            <View key={item.id} style={[styles.alertCard, item.unread && styles.alertCardUnread]}>
              <View style={styles.alertIconWrap}>
                <Ionicons 
                  name={
                    item.type === 'ride' ? 'car-sport' :
                    item.type === 'security' ? 'shield-checkmark' : 'information-circle'
                  } 
                  size={20} 
                  color={BLUE} 
                />
              </View>

              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={styles.alertRowTop}>
                  <Text style={styles.alertTitle}>{item.title}</Text>
                  {item.unread && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.alertMessage}>{item.message}</Text>
                <Text style={styles.alertTime}>{item.time}</Text>
              </View>

              <TouchableOpacity 
                style={styles.dismissBtn} 
                onPress={() => clearAlert(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color={MUTED} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Unified Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home-outline" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={MUTED} />} label="Rides" onPress={() => onNavigate('rides')} />
        <TabItem icon={<Ionicons name="notifications" size={22} color={BLUE} />} label="Alerts" active={true} onPress={() => {}} />
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
  brandTitle: { fontSize: 18, fontWeight: '800', color: NAVY },
  markReadBtn: { backgroundColor: PILL_BG, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  markReadText: { fontSize: 12, fontWeight: '700', color: BLUE },

  scrollContainer: { padding: 16, paddingTop: 16, paddingBottom: 110 },

  alertCard: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOpacity: 0.02, elevation: 1 },
  alertCardUnread: { backgroundColor: '#F8FAFF', borderColor: '#C7D2FE' },
  alertIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: TAB_ACTIVE_BG, alignItems: 'center', justifyContent: 'center' },
  alertRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertTitle: { fontSize: 15, fontWeight: '800', color: TEXT },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BLUE },
  alertMessage: { fontSize: 13, color: MUTED, marginTop: 4, lineHeight: 18, fontWeight: '500' },
  alertTime: { fontSize: 11, color: '#9CA3AF', marginTop: 8, fontWeight: '600' },
  dismissBtn: { padding: 4, marginLeft: 8 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: PILL_BG, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: NAVY, marginBottom: 6 },
  emptySub: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },

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