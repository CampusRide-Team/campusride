// HelpSupportScreen.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar, // <-- Added missing import that caused the crash
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

const BLUE = '#2F6BFF'; 
const TEXT = '#0F1733';
const MUTED = '#8A8FA3';
const BG = '#F6F7FA';
const RED = '#E53935';
const TAB_ACTIVE_BG = '#E8EEFF';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  { q: 'How to request a ride', a: 'Open the Home screen, tap the search bar, choose your destination, then confirm pickup to request a ride.' },
  { q: 'How shared rides work', a: 'Shared rides match you with other students heading the same way. You split the cost and may have brief detours for pickups.' },
  { q: 'How to contact a driver', a: 'After a driver accepts, tap their card on the ride screen to call or message them directly in-app.' },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faqCard}>
      <TouchableOpacity
        style={styles.faqHeader}
        activeOpacity={0.7}
        onPress={() => {
          LayoutAnimation.easeInEaseOut();
          setOpen(o => !o);
        }}
      >
        <Text style={styles.faqQ}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={MUTED} />
      </TouchableOpacity>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </View>
  );
}

function TabItem({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>{icon}</View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HelpSupportScreen({ onNavigate }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => onNavigate('profile')}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>Find answers to common questions</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.search}>
          <Feather name="search" size={18} color={MUTED} />
          <TextInput
            placeholder="How can we help?"
            placeholderTextColor={MUTED}
            style={styles.searchInput}
          />
        </View>

        {/* FAQs */}
        <View style={{ marginTop: 18, gap: 12 }}>
          {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </View>

        {/* CTA Support Button Actions */}
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.8}
          onPress={() => Linking.openURL('mailto:support@campusride.app')}
        >
          <Text style={styles.ctaText}>Contact Support</Text>
        </TouchableOpacity>

        <Text style={styles.emergency} onPress={() => Linking.openURL('tel:911')}>
          Emergency Contact: 911
        </Text>
        <Text style={styles.emergencySub}>For immediate safety concerns</Text>
      </ScrollView>

      {/* Footer Navigation Bar */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={MUTED} />} label="Rides" onPress={() => onNavigate('history')} />
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => onNavigate('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={MUTED} />} label="Profile" onPress={() => onNavigate('profile')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#ECEEF3',
    backgroundColor: '#fff',
  },
  back: { position: 'absolute', left: 16, top: 12, padding: 6, zIndex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: TEXT },
  subtitle: { fontSize: 13, color: MUTED, marginTop: 2 },

  scrollContainer: { paddingHorizontal: 20, paddingBottom: 110 },

  search: {
    marginTop: 24, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: '#ECEEF3',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: TEXT },

  faqCard: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 18,
    paddingVertical: 16, borderColor: '#ECEEF3', borderWidth: 1,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { fontSize: 16, fontWeight: '600', color: TEXT },
  faqA: { marginTop: 10, fontSize: 14, color: '#3A4055', lineHeight: 20 },

  cta: {
    marginTop: 36, backgroundColor: BLUE, borderRadius: 14,
    height: 54, alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  emergency: { marginTop: 24, textAlign: 'center', color: RED, fontWeight: '700', fontSize: 15 },
  emergencySub: { textAlign: 'center', color: MUTED, marginTop: 4, fontSize: 13 },

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