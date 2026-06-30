// ProfileScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

const BLUE = '#2F6BFF';
const TEXT = '#0F1733';
const MUTED = '#8A8FA3';
const RED = '#FF3B30';
const ICON_BG_BLUE = '#E6EFFF';
const ICON_BG_GRAY = '#EEF0F4';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F4F5F7';
const TAB_ACTIVE_BG = '#E8EEFF';

const Row = ({ icon, iconBg = ICON_BG_BLUE, label, badge, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
      {icon}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{String(badge)}</Text>
        </View>
      ) : null}
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
    <Feather name="chevron-right" size={22} color="#C2C6D0" />
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const TabItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
      {icon}
    </View>
    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

export default function ProfileScreen({ onLogout, onNavigate }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header Background Accent */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => onNavigate('home')} style={styles.navTouchArea}>
              <Feather name="arrow-left" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.navTouchArea}>
              <Feather name="more-vertical" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarWrap}>
            <FontAwesome5 name="user-alt" size={54} color={BLUE} />
          </View>
          
          <Text style={styles.name}>Sarah Mitchell</Text>
          <Text style={styles.sub}>Student ID: STU-2024-1547</Text>
          <Text style={styles.sub}>sarah.mitchell@university.edu</Text>
        </View>

        {/* Menu Cards */}
        <View style={styles.cardShifted}>
          <Row icon={<MaterialCommunityIcons name="history" size={22} color={BLUE} />} label="Edit Profile" />
          <Divider />
          <Row 
            icon={<Ionicons name="notifications" size={20} color={BLUE} />} 
            label="Ride History" 
            badge={3} 
            onPress={() => onNavigate('history')} 
          />
          <Divider />
          <Row 
            icon={<Feather name="help-circle" size={22} color={BLUE} />} 
            label="Help & Support" 
            onPress={() => onNavigate('support')} 
          />
        </View>

        <View style={styles.card}>
          <Row icon={<Ionicons name="settings-sharp" size={20} color="#3A3F52" />} iconBg={ICON_BG_GRAY} label="Settings" />
          <Divider />
          <Row icon={<MaterialCommunityIcons name="shield" size={22} color="#3A3F52" />} iconBg={ICON_BG_GRAY} label="Privacy Policy" />
          <Divider />
          <Row icon={<Ionicons name="document-text" size={20} color="#3A3F52" />} iconBg={ICON_BG_GRAY} label="Terms of Service" />
        </View>

        <TouchableOpacity style={styles.logout} onPress={onLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={22} color={RED} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Synchronized Shared System Bottom Tab Navigation Bar */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={MUTED} />} label="Rides" onPress={() => onNavigate('history')} />
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => onNavigate('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={BLUE} />} label="Profile" active={true} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  scrollContent: { paddingBottom: 120 },
  header: { backgroundColor: BLUE, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 56, alignItems: 'center', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  headerTop: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyStyle: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navTouchArea: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  avatarWrap: { width: 116, height: 116, borderRadius: 58, borderWidth: 4, borderColor: '#fff', marginTop: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 12 },
  sub: { color: '#D8E3FF', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: CARD_BG, marginHorizontal: 16, marginTop: 16, borderRadius: 16, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardShifted: { backgroundColor: CARD_BG, marginHorizontal: 16, marginTop: -40, borderRadius: 16, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowLabel: { flex: 1, fontSize: 16, color: TEXT, fontWeight: '500' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: RED, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#EFF1F4', marginLeft: 70 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingVertical: 12 },
  logoutText: { color: RED, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', flexDirection: 'row', paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 22 : 10, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: -4 }, elevation: 8 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 16 },
  tabIconWrapActive: { backgroundColor: TAB_ACTIVE_BG },
  tabLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
  tabLabelActive: { color: TEXT, fontWeight: '600' },
});