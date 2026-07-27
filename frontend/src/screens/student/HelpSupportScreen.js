// HelpSupportScreen.js
import React, { useState } from 'react';
import {
<<<<<<< HEAD
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
=======
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
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

const FAQS = [
  {
    id: '1',
    question: 'How to request a ride',
    answer: 'You can enter your destination in the zone hub, broadcast your request to active student drivers, or select a specific driver from the live map list.',
  },
  {
    id: '2',
    question: 'How shared rides work',
    answer: 'Shared rides allow you to commute along similar campus routes with fellow students, offering eco-friendly transit and split pacing across zones.',
  },
  {
    id: '3',
    question: 'How to contact a driver',
    answer: 'Once a driver accepts your broadcast or request, you can instantly tap the call or chat icon directly from the tracking screen.',
  },
  {
    id: '4',
    question: 'How scheduled rides work',
    answer: 'You can schedule trips ahead of time. The system will send you a pre-commute reminder 20 minutes prior before auto-dispatching to nearby zone drivers.',
  },
];

export default function HelpSupportScreen({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredFaqs = FAQS.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
        
        <Text style={styles.headerSubtitle}>Find answers to common questions</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="How can we help?"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* FAQ Accordion List */}
        <View style={styles.faqContainer}>
          {filteredFaqs.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View key={item.id} style={styles.faqCard}>
                <TouchableOpacity 
                  style={styles.faqHeaderRow} 
                  activeOpacity={0.8}
                  onPress={() => toggleExpand(item.id)}
                >
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color={MUTED} 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Contact Support CTA */}
        <TouchableOpacity 
          style={styles.contactButton} 
          activeOpacity={0.85}
          onPress={() => Alert.alert("Support Dispatch", "Connecting you to campus support chat...")}
        >
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>

        {/* Emergency Notice */}
        <View style={styles.emergencyContainer}>
          <TouchableOpacity onPress={() => Alert.alert("Emergency", "Dialing 911...")} activeOpacity={0.8}>
            <Text style={styles.emergencyText}>Emergency Contact: <Text style={styles.emergencyNumber}>911</Text></Text>
          </TouchableOpacity>
          <Text style={styles.emergencySub}>For immediate safety concerns</Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Unified Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home-outline" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={MUTED} />} label="Rides" onPress={() => onNavigate('rides')} />
>>>>>>> dev
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => onNavigate('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={MUTED} />} label="Profile" onPress={() => onNavigate('profile')} />
      </View>
    </SafeAreaView>
  );
}

<<<<<<< HEAD
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

  scrollContainer: { padding: 20, paddingTop: 20 },
  headerSubtitle: { fontSize: 14, color: MUTED, fontWeight: '600', marginBottom: 20, textAlign: 'center' },

  searchBar: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    elevation: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '700', color: TEXT },

  faqContainer: { gap: 12, marginBottom: 30 },
  faqCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    elevation: 1,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  faqQuestion: { fontSize: 15, fontWeight: '700', color: TEXT },
  faqBody: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
    backgroundColor: '#FAFAFB',
  },
  faqAnswer: { fontSize: 13, color: MUTED, lineHeight: 18, fontWeight: '500' },

  contactButton: {
    backgroundColor: BLUE,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  contactButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  emergencyContainer: { alignItems: 'center', marginBottom: 20 },
  emergencyText: { fontSize: 13, fontWeight: '700', color: MUTED },
  emergencyNumber: { color: '#EF4444', fontWeight: '800' },
  emergencySub: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '600' },
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