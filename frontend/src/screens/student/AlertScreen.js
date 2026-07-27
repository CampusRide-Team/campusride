// AlertScreen.js
<<<<<<< HEAD
import React from 'react';
import {
  SafeAreaView,
=======
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
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
  FontAwesome5,
} from '@expo/vector-icons';

const TEXT = '#0F1733';
const MUTED = '#8A8FA3';
const SCREEN_BG = '#F6F7FA';
const CARD_BG = '#FFFFFF';
const BORDER = '#ECEEF3';
const BLUE = '#2F6BFF';
const TAB_ACTIVE_BG = '#E8EEFF';

const GREEN_BG = '#D6F2E1';
const GREEN = '#22A06B';
const BLUE_BG = '#DCE8FF';
const PURPLE_BG = '#EADCFF';
const PURPLE = '#8B3DFF';
const ORANGE_BG = '#FFE3C9';
const ORANGE = '#F08A2B';
const RED_BG = '#FBD9D9';
const RED = '#E53935';
const YELLOW_BG = '#FFE98A';
const YELLOW = '#C99400';
const DOT = '#1A3DD8';

const NOTIFS = [
  {
    id: '1',
    icon: <Feather name="check" size={22} color={GREEN} />,
    iconBg: GREEN_BG,
    title: 'Driver accepted your ride',
    body: 'Sarah will pick you up in 5 minutes at the main gate',
    time: '2 minutes ago',
=======
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
>>>>>>> dev
    unread: true,
  },
  {
    id: '2',
<<<<<<< HEAD
    icon: <MaterialCommunityIcons name="car" size={22} color={BLUE} />,
    iconBg: BLUE_BG,
    title: 'Ride completed',
    body: 'Thank you for riding with Mike. Rate your experience',
    time: '1 hour ago',
  },
  {
    id: '3',
    icon: <Feather name="gift" size={22} color={PURPLE} />,
    iconBg: PURPLE_BG,
    title: 'Special offer just for you!',
    body: 'Get 20% off your next 3 rides. Use code CAMPUS20',
    time: '3 hours ago',
  },
  {
    id: '4',
    icon: <Ionicons name="notifications" size={22} color={ORANGE} />,
    iconBg: ORANGE_BG,
    title: 'System update',
    body: 'New features added! Check out our improved ride matching',
    time: 'Yesterday',
  },
  {
    id: '5',
    icon: <Feather name="alert-circle" size={22} color={RED} />,
    iconBg: RED_BG,
    title: 'Ride cancelled',
    body: 'Your ride to downtown has been cancelled by the driver',
    time: '2 days ago',
  },
  {
    id: '6',
    icon: <FontAwesome5 name="star" size={20} color={YELLOW} solid />,
    iconBg: YELLOW_BG,
    title: 'Rate your driver',
    body: 'How was your ride with Alex? Your feedback helps improve our service',
    time: '3 days ago',
  },
];

const NotifCard = ({ n }) => (
  <View style={styles.card}>
    <View style={[styles.iconWrap, { backgroundColor: n.iconBg }]}>{n.icon}</View>
    <View style={{ flex: 1 }}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{`${n.title}`}</Text>
        {n.unread && <View style={styles.dot} />}
      </View>
      <Text style={styles.body}>{`${n.body}`}</Text>
      <Text style={styles.time}>{`${n.time}`}</Text>
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

export default function AlertScreen({ onNavigate }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => onNavigate('home')}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Feather name="more-vertical" size={22} color={TEXT} />
        </TouchableOpacity>
      </View>

      {/* Main List Scroll Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {NOTIFS.map((n) => (
          <NotifCard key={n.id} n={n} />
        ))}
      </ScrollView>

      {/* Uniform App Footer Tab Bar */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={MUTED} />} label="Rides" onPress={() => onNavigate('history')} />
        <TabItem icon={<Ionicons name="notifications" size={22} color={BLUE} />} label="Alerts" active={true} />
=======
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
>>>>>>> dev
        <TabItem icon={<Feather name="user" size={22} color={MUTED} />} label="Profile" onPress={() => onNavigate('profile')} />
      </View>
    </SafeAreaView>
  );
}

<<<<<<< HEAD
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  header: {
    height: 56,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT },

  list: { padding: 16, paddingBottom: 110, gap: 14 },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: '700', color: TEXT, flex: 1, paddingRight: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: DOT },
  body: { fontSize: 14, color: '#3A4055', marginTop: 4, lineHeight: 20 },
  time: { fontSize: 13, color: MUTED, marginTop: 8 },

  // Exact Match Footer Style Engine
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

>>>>>>> dev
  tabBar: { 
    position: 'absolute', left: 0, right: 0, bottom: 0, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    paddingTop: 8, 
<<<<<<< HEAD
    paddingBottom: Platform.OS === 'ios' ? 22 : 10, 
    borderTopLeftRadius: 20, borderTopRightRadius: 20, 
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, 
    shadowOffset: { width: 0, height: -4 }, elevation: 8 
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 16 },
  tabIconWrapActive: { backgroundColor: TAB_ACTIVE_BG },
  tabLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
  tabLabelActive: { color: TEXT, fontWeight: '600' },
=======
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