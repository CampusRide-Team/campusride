// HelpSupportScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#6B7280';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const BORDER = '#E2E8F0';

const FAQS = [
  {
    id: '1',
    question: 'How to request a ride',
    answer: 'You can enter your destination in the Zone Hub, broadcast your request to active campus drivers, or select a specific driver from the nearby live map list.',
  },
  {
    id: '2',
    question: 'How shared rides work',
    answer: 'Shared rides allow you to commute along similar campus routes with fellow passengers, offering eco-friendly transit and split pacing across zones.',
  },
  {
    id: '3',
    question: 'How to contact a driver',
    answer: 'Once a driver is assigned to your request, you can instantly tap the call or chat button directly from the tracking screen.',
  },
  {
    id: '4',
    question: 'How scheduled rides work',
    answer: 'You can schedule rides in advance. The system locks in your pickup time and automatically dispatches to nearby zone drivers as your departure time approaches.',
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Quick Help Card Banner */}
        <View style={styles.supportBanner}>
          <View style={styles.supportIconWrap}>
            <Ionicons name="headset" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.supportTitle}>Campus Support Team</Text>
            <Text style={styles.supportSub}>Need immediate assistance with a ride or safety issue?</Text>
          </View>
        </View>

        {/* Contact Actions Grid */}
        <View style={styles.contactRow}>
          <TouchableOpacity 
            style={styles.contactBtn} 
            activeOpacity={0.8}
            onPress={() => Alert.alert("Campus Security", "Dialing University Security Dispatch...")}
          >
            <Ionicons name="call" size={18} color={BLUE} />
            <Text style={styles.contactBtnText}>Call Dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactBtn} 
            activeOpacity={0.8}
            onPress={() => Alert.alert("Support Ticket", "Opening support ticket request...")}
          >
            <Ionicons name="mail" size={18} color={BLUE} />
            <Text style={styles.contactBtnText}>Email Support</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs Section */}
        <Text style={styles.sectionHeader}>FREQUENTLY ASKED QUESTIONS</Text>
        
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={18} color={MUTED} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help topics..."
            placeholderTextColor={MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.faqList}>
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <TouchableOpacity 
                key={faq.id} 
                style={styles.faqCard}
                onPress={() => toggleExpand(faq.id)}
                activeOpacity={0.85}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color={NAVY} 
                  />
                </View>

                {isExpanded && (
                  <View style={styles.faqAnswerWrap}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
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
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: NAVY },

  scrollContainer: { padding: 20 },

  supportBanner: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
  },
  supportIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: { fontSize: 15, fontWeight: '800', color: TEXT },
  supportSub: { fontSize: 12, color: MUTED, marginTop: 2, lineHeight: 16 },

  contactRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
  },
  contactBtnText: { fontSize: 13, fontWeight: '700', color: NAVY },

  sectionHeader: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.5, marginBottom: 12 },

  searchBarWrap: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 13, color: TEXT },

  faqList: { gap: 10 },
  faqCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  faqQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestionText: { fontSize: 14, fontWeight: '700', color: TEXT, flex: 1, paddingRight: 8 },
  faqAnswerWrap: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  faqAnswerText: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
});
