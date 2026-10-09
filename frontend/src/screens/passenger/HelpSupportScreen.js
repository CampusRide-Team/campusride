import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { appConfig } from '../../config/appConfig';
import { triggerCampusSecurityCall } from '../../config/safetyConfig';

const FAQS = [
  {
    id: '1',
    category: 'Rides',
    question: 'How do I request a ride on campus?',
    answer:
      'Enter your destination or select a campus point of interest (e.g. Balme Library, Pent, Night Market). Choose Solo or Shared mode, review the road route, and confirm your request to nearby drivers.',
  },
  {
    id: '2',
    category: 'Rides',
    question: 'How do shared rides work?',
    answer:
      'Shared rides match you with fellow campus commuters traveling along the same route or zone. Drop-offs are automatically paced to ensure minimal detour while offering discounted student rates.',
  },
  {
    id: '3',
    category: 'Rides',
    question: 'How do scheduled rides work?',
    answer:
      'You can schedule a pickup in advance for early morning lectures or scheduled departures. The system assigns a nearby driver before your designated pickup time.',
  },
  {
    id: '4',
    category: 'Safety',
    question: 'How do Trusted Contacts and SOS work?',
    answer:
      'You can add up to 5 Trusted Contacts in the Safety tab. When you trigger the Emergency SOS button, SMS notifications containing your live ride location are automatically dispatched to your contacts and logged with dispatchers.',
  },
  {
    id: '5',
    category: 'Support',
    question: 'What should I do if I leave an item behind in a vehicle?',
    answer:
      'Open the Activity tab to review your completed trip details and timestamp. Driver phone information is kept private post-ride to protect passenger and driver privacy. If needed, consult campus security or transit dispatch.',
  },
  {
    id: '6',
    category: 'Campus',
    question: 'What areas does CampusRide cover?',
    answer:
      'CampusRide operates across all University of Ghana zones including Main Campus, Legon Hall, Akuafo, Commonwealth, Mensah Sarbah, Volta, Diaspora (TF/Pent/Evandy/Bani), UG Medical Centre, and immediate campus perimeter gates.',
  },
];

export default function HelpSupportScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { colors } = theme;

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredFaqs = FAQS.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEmailSupport = () => {
    if (!appConfig.supportEmail) {
      Alert.alert(
        'Support Channel Notice',
        'Direct email support is not currently configured in this environment. Please consult the campus FAQs below or visit the Safety Center for security assistance.'
      );
      return;
    }

    const subject = encodeURIComponent('CampusRide Support Inquiry');
    const body = encodeURIComponent(
      'Hello CampusRide Support,\n\nI need assistance with:\n'
    );
    const mailUrl = `mailto:${appConfig.supportEmail}?subject=${subject}&body=${body}`;

    Linking.openURL(mailUrl).catch(() => {
      Alert.alert(
        'Email Support',
        `Please reach out to our team at:\n\n${appConfig.supportEmail}`
      );
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.brand.baseBackground }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.brand.baseBackground}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.subtle }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface.base, borderColor: colors.border.subtle }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Help & Support
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Support Overview Banner */}
        <View
          style={[
            styles.bannerCard,
            {
              backgroundColor: colors.surface.base,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <View
            style={[
              styles.bannerIconWrap,
              { backgroundColor: colors.brand.primaryTint },
            ]}
          >
            <Ionicons name="headset" size={22} color={colors.brand.primary} />
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={[styles.bannerTitle, { color: colors.text.primary }]}>
              Campus Support Desk
            </Text>
            <Text style={[styles.bannerSub, { color: colors.text.secondary }]}>
              Need assistance with campus rides or transit questions?
            </Text>
          </View>
        </View>

        {/* Support Action Buttons */}
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={[
              styles.contactBtn,
              {
                backgroundColor: colors.surface.base,
                borderColor: colors.border.subtle,
              },
            ]}
            onPress={handleEmailSupport}
            activeOpacity={0.7}
          >
            <Ionicons name="mail-outline" size={18} color={colors.brand.primary} />
            <Text style={[styles.contactBtnText, { color: colors.text.primary }]}>
              Email Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.contactBtn,
              {
                backgroundColor: colors.surface.base,
                borderColor: colors.border.subtle,
              },
            ]}
            onPress={() => navigation.navigate('SafetyTab')}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-outline" size={18} color={colors.brand.primary} />
            <Text style={[styles.contactBtnText, { color: colors.text.primary }]}>
              Safety Center
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dedicated Campus Security Notice (Clearly Labeled) */}
        <View
          style={[
            styles.securityCard,
            {
              backgroundColor: colors.surface.elevated,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <View style={styles.securityHeaderRow}>
            <Ionicons name="warning-outline" size={18} color={colors.semantic.warning} />
            <Text style={[styles.securityTitle, { color: colors.text.primary }]}>
              Immediate Safety & Security
            </Text>
          </View>
          <Text style={[styles.securitySub, { color: colors.text.secondary }]}>
            For urgent safety concerns or emergencies on campus, contact University Security dispatch directly.
          </Text>
          <TouchableOpacity
            style={[
              styles.securityCallBtn,
              {
                backgroundColor: colors.surface.base,
                borderColor: colors.border.subtle,
              },
            ]}
            onPress={triggerCampusSecurityCall}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={16} color={colors.semantic.danger} />
            <Text style={[styles.securityCallText, { color: colors.text.primary }]}>
              Call Campus Security
            </Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Search */}
        <Text style={[styles.sectionLabel, { color: colors.text.muted }]}>
          FREQUENTLY ASKED QUESTIONS
        </Text>

        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: colors.surface.base,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.text.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search campus help topics..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.text.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* FAQ Accordion List */}
        <View style={styles.faqList}>
          {filteredFaqs.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.surface.base,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                No matching topics found for "{searchQuery}".
              </Text>
            </View>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={[
                    styles.faqCard,
                    {
                      backgroundColor: colors.surface.base,
                      borderColor: colors.border.subtle,
                    },
                  ]}
                  onPress={() => toggleExpand(faq.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.faqHeaderRow}>
                    <Text style={[styles.faqQuestion, { color: colors.text.primary }]}>
                      {faq.question}
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.text.muted}
                    />
                  </View>
                  {isExpanded && (
                    <View
                      style={[
                        styles.faqAnswerWrap,
                        { borderTopColor: colors.border.divider },
                      ]}
                    >
                      <Text style={[styles.faqAnswer, { color: colors.text.secondary }]}>
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  bannerSub: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  securityCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  securityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  securitySub: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 12,
  },
  securityCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  securityCallText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    paddingRight: 8,
  },
  faqAnswerWrap: {
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
