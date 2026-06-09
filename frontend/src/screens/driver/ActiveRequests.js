import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

const { width } = Dimensions.get('window')

const ActiveRequests = ({ onBack, onChangeTab, onAcceptRide }) => {
  // TODO: Fetch available campus requests dynamically from endpoints once server is active
  const [allRequests, setAllRequests] = useState([
    {
      id: 'req_lucy',
      name: 'Lucy Amankwa',
      rating: '4.9',
      type: 'Student',
      pickup: 'Law Department',
      destination: 'Engineering Block C',
      distance: '2.5 km',
      arrival: '3 mins',
      avatarEmoji: '👩‍🎓',
    },
    {
      id: 'req_kwame',
      name: 'Kwame Mensah',
      rating: '4.7',
      type: 'Student',
      pickup: 'Balme Library',
      destination: 'Gym / Sports Stadium',
      distance: '1.2 km',
      arrival: '5 mins',
      avatarEmoji: '👨‍🎓',
    },
    {
      id: 'req_aisha',
      name: 'Aisha Osei',
      rating: '4.8',
      type: 'Guest',
      pickup: 'Dorms A / Volta',
      destination: 'Bush Canteen Cafe',
      distance: '0.8 km',
      arrival: '2 mins',
      avatarEmoji: '👩‍💼',
    },
  ])

  const [selectedId, setSelectedId] = useState('req_lucy')

  const currentSpotlightRequest = allRequests.find((req) => req.id === selectedId) || allRequests[0]
  const lowerQueueRequests = allRequests.filter((req) => req.id !== selectedId)

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* 1. HEADER APP BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <Text style={styles.backArrowIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>Active Requests</Text>
        </View>
        <View style={styles.badgeNearby}>
          <Text style={styles.badgeNearbyText}>{allRequests.length} Nearby</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 2. PRIMARY SPOTLIGHT REQUEST DETAIL CARD */}
        <View style={styles.mainCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarMock}>
              <Text style={styles.avatarEmoji}>{currentSpotlightRequest.avatarEmoji}</Text>
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.passengerName}>{currentSpotlightRequest.name}</Text>
              <Text style={styles.passengerMeta}>
                ⭐ {currentSpotlightRequest.rating} • {currentSpotlightRequest.type}
              </Text>
            </View>
          </View>

          <View style={styles.routeTimelineContainer}>
            <View style={styles.timelineIndicatorsColumn}>
              <View style={[styles.timelineDot, styles.blueDot]} />
              <View style={styles.timelineLineConnector} />
              <View style={[styles.timelineDot, styles.greenDot]} />
            </View>
            
            <View style={styles.routeAddressesColumn}>
              <View style={styles.addressBlock}>
                <Text style={styles.addressLabelText}>PICKUP</Text>
                <Text style={styles.addressMainText}>{currentSpotlightRequest.pickup}</Text>
              </View>
              <View style={styles.addressBlock}>
                <Text style={styles.addressLabelText}>DESTINATION</Text>
                <Text style={styles.addressMainText}>{currentSpotlightRequest.destination}</Text>
              </View>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValue}>{currentSpotlightRequest.distance}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Arrival</Text>
              <Text style={styles.metricValue}>{currentSpotlightRequest.arrival}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.acceptButton} 
            activeOpacity={0.85}
            onPress={() => onAcceptRide(currentSpotlightRequest)}
          >
            <Text style={styles.acceptButtonText}>Accept Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.declineButton} activeOpacity={0.85} onPress={onBack}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>

        {/* 3. HORIZONTAL EXTRA DISPATCH QUEUE SECTION */}
        <View style={styles.otherSectionHeader}>
          <Text style={styles.otherSectionTitle}>Other Available Requests</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAllActionText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.horizontalScrollLayout}
        >
          {lowerQueueRequests.map((item) => (
            <View key={item.id} style={styles.horizontalMiniCard}>
              <View style={styles.miniCardRouteContainer}>
                <View style={styles.miniRouteLineRow}>
                  <Text style={styles.miniMapIcon}>📍</Text>
                  <Text style={styles.miniMapPlaceText} numberOfLines={1}>{item.pickup}</Text>
                </View>
                <View style={styles.miniRouteLineRow}>
                  <Text style={styles.miniMapIcon}>🏁</Text>
                  <Text style={styles.miniMapPlaceText} numberOfLines={1}>{item.destination}</Text>
                </View>
              </View>
              
              <View style={styles.miniCardFooterRow}>
                <Text style={styles.miniCardDistanceText}>{item.distance}</Text>
                <TouchableOpacity 
                  style={styles.miniCardViewButton} 
                  activeOpacity={0.8}
                  onPress={() => setSelectedId(item.id)}
                >
                  <Text style={styles.miniCardViewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

      </ScrollView>

      {/* 4. BASE SYSTEM TAB NAV BAR COMPONENT */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity style={styles.tabItem} onPress={() => onChangeTab('home')} activeOpacity={0.7}>
          <Text style={styles.tabIconInactive}>🏠</Text>
          <Text style={styles.tabLabelInactive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onChangeTab('trips')} activeOpacity={0.7}>
          <View style={styles.activeTabIconBackground}>
            <Text style={styles.tabIconActive}>🔀</Text>
          </View>
          <Text style={styles.tabLabelActive}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => console.log('Profile')} activeOpacity={0.7}>
          <Text style={styles.tabIconInactive}>👤</Text>
          <Text style={styles.tabLabelInactive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default ActiveRequests

const styles = StyleSheet.create({
  // Global View Layout Canvas
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // 1. App Bar Header Layout
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  backArrowIcon: {
    fontSize: 24,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 24,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  badgeNearby: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  badgeNearbyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },

  // 2. Primary Spotlight Card Structure
  mainCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarMock: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  profileTextContainer: {
    marginLeft: 14,
  },
  passengerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  passengerMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Timeline Routing Vector Indicator
  routeTimelineContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineIndicatorsColumn: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  blueDot: {
    backgroundColor: '#3B82F6',
  },
  greenDot: {
    backgroundColor: '#84CC16',
  },
  timelineLineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  routeAddressesColumn: {
    flex: 1,
    marginLeft: 14,
    gap: 16,
  },
  addressBlock: {
    justifyContent: 'center',
  },
  addressLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressMainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Spotlight Metrics Row
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },

  // Primary Action Controls
  acceptButton: {
    backgroundColor: '#84CC16',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#84CC16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  declineButton: {
    backgroundColor: '#E5E7EB',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '700',
  },

  // 3. Horizontal Bottom Queue Section
  otherSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  otherSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  viewAllActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  horizontalScrollLayout: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  horizontalMiniCard: {
    backgroundColor: '#D1D5DB',
    width: width * 0.46,
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-between',
    height: 124,
  },
  miniCardRouteContainer: {
    gap: 6,
  },
  miniRouteLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniMapIcon: {
    fontSize: 12,
  },
  miniMapPlaceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  miniCardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  miniCardDistanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  miniCardViewButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
  },
  miniCardViewButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },

  // 4. Base Tab Menu Layout Configuration
  tabBarContainer: {
    flexDirection: 'row',
    height: 74,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabIconBackground: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 2,
  },
  tabIconActive: {
    fontSize: 18,
  },
  tabLabelActive: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  tabIconInactive: {
    fontSize: 18,
    opacity: 0.4,
  },
  tabLabelInactive: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
})