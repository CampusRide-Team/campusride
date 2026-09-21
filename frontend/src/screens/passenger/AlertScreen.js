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
    message: 'Thank you for rating your campus driver. Your feedback helps maintain our safe campus community.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: '3',
    type: 'security',
    title: 'Safety Check Verified',
    message: 'Your passenger account status is fully verified for priority campus gate transit.',
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

  const getAlertIcon = (type) => {
    switch (type) {
      case 'ride':
        return <Ionicons name="car-outline" size={20} color={BLUE} />;
      case 'system':
        return <Ionicons name="star-outline" size={20} color="#F59E0B" />;
      case 'security':
        return <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />;
      default:
        return <Ionicons name="notifications-outline" size={20} color={BLUE} />;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>Notifications</Text>
        <TouchableOpacity style={styles.markReadButton} onPress={markAllAsRead} activeOpacity={0.7}>
          <Ionicons name="checkmark-done" size={20} color={BLUE} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Notification Cards List */}
        {alerts.map((item) => (
          <View key={item.id} style={[styles.alertCard, item.unread && styles.unreadCard]}>
            
            {/* Left Category Icon */}
            <View style={[styles.iconWrap, item.unread && styles.unreadIconWrap]}>
              {getAlertIcon(item.type)}
            </View>

            {/* Notification Body Content */}
            <View style={styles.alertContent}>
              <View style={styles.topMetaRow}>
                <Text style={styles.alertTitle}>{item.title}</Text>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>

              <Text style={styles.messageText}>{item.message}</Text>
            </View>

            {/* Unread Accent Indicator Dot */}
            {item.unread && <View style={styles.unreadDot} />}

          </View>
        ))}

        <View style={{ height: 110 }} />
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
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: 18, fontWeight: '800', color: NAVY },
  markReadButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scrollContainer: { padding: 16, paddingTop: 16, paddingBottom: 110 },

  alertCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DBEAFE',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PILL_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  unreadIconWrap: {
    backgroundColor: TAB_ACTIVE_BG,
  },
  alertContent: { flex: 1 },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  timeText: { fontSize: 11, fontWeight: '600', color: MUTED },
  messageText: { fontSize: 13, color: '#4B5563', lineHeight: 18 },

  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
  },

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
