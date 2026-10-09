import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { fonts, radii, spacing } from '../../theme';
import { CRIcon } from '../../components/common';
import { SUPPORT_CONFIG } from '../../config/appConfig';

const DRIVER_FAQS = [
  {
    id: '1',
    category: 'Dispatch',
    question: 'How do I accept a ride request?',
    answer:
      'When a passenger requests a ride nearby, an incoming dispatch offer card will appear on your Requests screen with route details. Tap "Accept Ride" before the timer expires to start pickup navigation.',
  },
  {
    id: '2',
    category: 'Shared Trips',
    question: 'How do multi-stop Shared rides work?',
    answer:
      'On active Shared rides, the campus pool system may offer additional passengers along your existing route. Accepting them automatically updates your active navigation timeline with optimal pickup and dropoff stop order.',
  },
  {
    id: '3',
    category: 'Cancellation',
    question: 'What is the penalty-free cancellation policy?',
    answer:
      'After you arrive at the designated pickup point, a 5-minute countdown clock begins. If the passenger fails to appear within 5 minutes, a "Cancel Ride (No Penalty)" action unlocks to protect your driver rating score.',
  },
  {
    id: '4',
    category: 'Navigation',
    question: 'How do I report a closed gate or campus road blockage?',
    answer:
      'If a campus gate (e.g. Okponglo, Botanical Gardens, Commonwealth bypass) is temporarily locked or restricted, use the Contact Support buttons below to notify transit operations.',
  },
  {
    id: '5',
    category: 'Trips',
    question: 'Where can I review completed trips?',
    answer:
      'Completed and cancelled campus trips are recorded in Ride History with their route and status.',
  },
];

export default function DriverSupport({ onBack, onChangeTab }) {
  const { theme, isDark } = useTheme();
  const { colors } = theme;

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const toggleAccordion = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDialSupport = async () => {
    if (!SUPPORT_CONFIG?.phone) {
      Alert.alert('Notice', 'Direct phone dispatch is not configured in this environment.');
      return;
    }
    const url = `tel:${SUPPORT_CONFIG.phone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Notice', `Please call dispatch at: ${SUPPORT_CONFIG.phone}`);
      }
    } catch {
      Alert.alert('Notice', `Please call dispatch at: ${SUPPORT_CONFIG.phone}`);
    }
  };

  const handleWhatsAppSupport = async () => {
    if (!SUPPORT_CONFIG?.whatsapp) {
      Alert.alert('Notice', 'WhatsApp support is not configured in this environment.');
      return;
    }
    const cleanPhone = SUPPORT_CONFIG.whatsapp.replace(/[+\s-]/g, '');
    const encodedMsg = encodeURIComponent(SUPPORT_CONFIG.message || 'Hello CampusRide Driver Support, I need assistance.');
    const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
    const webUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      Alert.alert('Support Notice', `Please message dispatch at: ${SUPPORT_CONFIG.whatsapp}`);
    }
  };

  const filteredFaqs = DRIVER_FAQS.filter((faq) => {
    const q = searchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q) ||
      faq.category.toLowerCase().includes(q)
    );
  });

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
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={[styles.backButton, { backgroundColor: colors.surface.elevated }]}
          >
            <CRIcon name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Support Overview Card */}
        <View style={[styles.overviewCard, { backgroundColor: colors.surface.base, borderColor: colors.border.subtle }]}>
          <View style={[styles.overviewIconWrap, { backgroundColor: colors.brand.primaryTint }]}>
            <CRIcon name="headset-outline" size={22} color={colors.brand.primary} />
          </View>
          <View style={styles.overviewTextCol}>
            <Text style={[styles.overviewTitle, { color: colors.text.primary }]}>
              Driver Help Desk
            </Text>
            <Text style={[styles.overviewSubtitle, { color: colors.text.secondary }]}>
              Fast assistance for active trips, campus routing & account inquiries.
            </Text>
          </View>
        </View>

        {/* Quick Contact Buttons Row */}
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: colors.surface.base, borderColor: colors.border.subtle }]}
            onPress={handleWhatsAppSupport}
            activeOpacity={0.75}
          >
            <View style={[styles.contactIconWrap, { backgroundColor: colors.semantic.successTint }]}>
              <CRIcon name="logo-whatsapp" size={20} color={colors.semantic.success} />
            </View>
            <Text style={[styles.contactLabel, { color: colors.text.primary }]}>WhatsApp Chat</Text>
            <Text style={[styles.contactSub, { color: colors.text.secondary }]}>Instant dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: colors.surface.base, borderColor: colors.border.subtle }]}
            onPress={handleDialSupport}
            activeOpacity={0.75}
          >
            <View style={[styles.contactIconWrap, { backgroundColor: colors.brand.primaryTint }]}>
              <CRIcon name="call-outline" size={20} color={colors.brand.primary} />
            </View>
            <Text style={[styles.contactLabel, { color: colors.text.primary }]}>Direct Call</Text>
            <Text style={[styles.contactSub, { color: colors.text.secondary }]}>Voice support</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Search Bar */}
        <Text style={[styles.sectionHeading, { color: colors.text.secondary }]}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.surface.base, borderColor: colors.border.subtle }]}>
          <CRIcon name="search-outline" size={18} color={colors.text.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search driver topics & FAQs..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <CRIcon name="close-circle" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* FAQ Accordion List */}
        <View style={styles.faqList}>
          {filteredFaqs.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={[styles.noResultsText, { color: colors.text.secondary }]}>
                No matching answers found for "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isExpanded = expandedId === faq.id;
              const isLast = index === filteredFaqs.length - 1;

              return (
                <View
                  key={faq.id}
                  style={[
                    styles.faqCard,
                    { backgroundColor: colors.surface.base, borderColor: colors.border.subtle },
                    !isLast && { marginBottom: spacing.xs + 2 },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleAccordion(faq.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.faqQuestion, { color: colors.text.primary }]}>
                      {faq.question}
                    </Text>
                    <CRIcon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.text.muted}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.faqBody, { borderTopColor: colors.border.divider }]}>
                      <Text style={[styles.faqAnswer, { color: colors.text.secondary }]}>
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  overviewIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewTextCol: {
    flex: 1,
  },
  overviewTitle: {
    fontFamily: fonts.bold,
    fontSize: 15.5,
    marginBottom: 2,
  },
  overviewSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 17,
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  contactCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs + 2,
  },
  contactLabel: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    marginBottom: 1,
  },
  contactSub: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  sectionHeading: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    marginBottom: spacing.xs + 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    height: '100%',
  },
  faqList: {
    marginBottom: spacing.lg,
  },
  faqCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.sm,
  },
  faqQuestion: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    flex: 1,
    lineHeight: 19,
  },
  faqBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
  },
  faqAnswer: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  noResults: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: 'center',
  },
});
