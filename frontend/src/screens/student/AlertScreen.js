// AlertScreen.js
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
    unread: true,
  },
  {
    id: '2',
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
        <TabItem icon={<Feather name="user" size={22} color={MUTED} />} label="Profile" onPress={() => onNavigate('profile')} />
      </View>
    </SafeAreaView>
  );
}

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
  tabBar: { 
    position: 'absolute', left: 0, right: 0, bottom: 0, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    paddingTop: 8, 
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
});