import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

const DriverSupport = ({ onBack, onChangeTab }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIndex, setExpandedIndex] = useState(null)

  const toggleAccordion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  // Driver-focused campus operational FAQ dataset
  const driverFaqs = [
    {
      question: 'How do I accept a ride request?',
      answer: 'When a student places a request, it will appear on your "Active Requests" dashboard. Review the pickup point, destination, and whether it is a Private or Shared ride, then tap "Accept Ride" to initialize navigation tracking.',
    },
    {
      question: 'How do multi-stop Shared rides work?',
      answer: 'If you are on an active Shared trip, the system pool can dynamically send you additional passenger requests along your route. Accepting them updates your live navigation timeline map with optimized multi-stop waypoints.',
    },
    {
      question: 'What is the penalty-free cancellation policy?',
      answer: 'Once you arrive at the designated campus pickup spot, a 5-minute countdown clock begins. If the student fails to arrive within 5 minutes (300 seconds), a "Cancel Ride (No Penalty)" option unlocks to preserve your driver rating score.',
    },
    {
      question: 'How do I report a vehicle or map location issue?',
      answer: 'If a campus route or gate is temporarily locked or under maintenance, use the "Contact Support" module below to alert the housing and transit registry desk to update the routing grid matrix parameters.',
    },
  ]

  // Filter questions dynamically based on search box entry parameters
  const filteredFaqs = driverFaqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Top Bar Navbar Section */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.topBarButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Help & Support</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Subtitle intro layout header section */}
        <Text style={styles.subTitleText}>Find answers to common questions</Text>

        {/* Search Input Box Container */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="How can we help?"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Interactive Accordion FAQ Area Block */}
        <View style={styles.faqStack}>
          {filteredFaqs.map((faq, index) => {
            const isExpanded = expandedIndex === index
            return (
              <View key={index} style={styles.accordionWrapper}>
                <TouchableOpacity
                  style={[styles.accordionHeader, isExpanded && styles.accordionHeaderExpanded]}
                  activeOpacity={0.85}
                  onPress={() => toggleAccordion(index)}
                >
                  <Text style={styles.questionText}>{faq.question}</Text>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* Integrated Contact Action Trigger */}
        <TouchableOpacity 
          style={styles.contactButton} 
          activeOpacity={0.85}
          onPress={() => console.log('Internal support ticket desk routine fired.')}
        >
          {/* TODO: BACKEND INTEGRATION — Hook up Linking module to dial campus security dispatch desk or open internal email modal */}
          <Text style={styles.contactButtonText}>Contact Support Desk</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Persistent App Footer Bottom Nav Tabs Menu */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => onChangeTab && onChangeTab('home')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="home-outline" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => onChangeTab && onChangeTab('trips')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="car-multiple" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.navLabel}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => onBack && onBack()} activeOpacity={0.7}>
          <View style={[styles.tabIconBackground, styles.activeTabIconBackground]}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#1E3A8A" />
          </View>
          <Text style={styles.navLabelActive}>Profile</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topBarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  topBarSpacer: {
    width: 40,
  },
  subTitleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E2937',
    fontWeight: '500',
  },
  faqStack: {
    gap: 12,
    marginBottom: 24,
  },
  accordionWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
  },
  accordionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E2937',
    flex: 1,
    paddingRight: 12,
  },
  accordionBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
  },
  answerText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
  contactButton: {
    backgroundColor: '#1E3A8A',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: 74,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBackground: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabIconBackground: {
    backgroundColor: '#F1F5F9',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navLabelActive: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '700',
  },
})

export default DriverSupport