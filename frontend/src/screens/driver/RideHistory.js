import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

const RideHistory = ({ onBack, onNavigate, onChangeTab }) => {

  // TODO: BACKEND INTEGRATION — Switch static mock array into a managed database state variable setup
  // const [historyData, setHistoryData] = useState([])
  // const [isLoading, setIsLoading] = useState(true)

  // TODO: BACKEND INTEGRATION — Pull real-time completed travel ledgers on screen frame focus mounting
  // useEffect(() => {
  //   const fetchRideHistory = async () => {
  //     try {
  //       const token = await AsyncStorage.getItem('token')
  //       const response = await fetch('https://your-api-url/api/v1/drivers/me/trips?status=COMPLETED', {
  //         headers: { 'Authorization': `Bearer ${token}` }
  //       })
  //       const json = await response.json()
  //       setHistoryData(json.data)
  //     } catch (err) { console.error("Error fetching trip archives:", err) }
  //     finally { setIsLoading(false) }
  //   }
  //   fetchRideHistory()
  // }, [])

  const mockHistoryData = [
    {
      id: 'CR2026001',
      date: 'Today, 2:30 PM',
      status: 'Completed',
      type: 'Shared',
      pickup: 'Student Center',
      destination: 'Engineering Building',
    },
    {
      id: 'CR2026000',
      date: 'Yesterday, 6:45 PM',
      status: 'Completed',
      type: 'Private',
      pickup: 'Library',
      destination: 'Downtown Campus',
    },
    {
      id: 'CR2025999',
      date: 'Jun 15, 11:20 AM',
      status: 'Completed',
      type: 'Shared',
      pickup: 'Dormitory A',
      destination: 'Sports Complex',
    },
    {
      id: 'CR2025998',
      date: 'Jun 14, 3:15 PM',
      status: 'Completed',
      type: 'Shared',
      pickup: 'Medical Center',
      destination: 'Student Center',
    },
    {
      id: 'CR2025997',
      date: 'Jun 13, 8:30 AM',
      status: 'Completed',
      type: 'Private',
      pickup: 'Parking Lot C',
      destination: 'Business School',
    },
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Top Bar Navbar Section */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.topBarButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Ride History</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.topBarButton}>
          <MaterialCommunityIcons name="filter-variant" size={24} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      {/* History List Content Cards Module Layer */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {mockHistoryData.map((ride) => (
          <View key={ride.id} style={styles.historyCard}>

            {/* Metadata Header Meta Row */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.headerLeftMeta}>
                <Text style={styles.dateText}>{ride.date}</Text>
                <Text style={styles.statusText}>{ride.status}</Text>
              </View>

              <View style={[
                styles.typeTagCapsule,
                ride.type === 'Shared' ? styles.sharedBackground : styles.privateBackground
              ]}>
                <Text style={styles.typeTagText}>
                  {ride.type?.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Vertical Routing Visual Stack */}
            <View style={styles.routeContainer}>
              <View style={styles.timelineIndicatorsColumn}>
                <MaterialCommunityIcons name="circle" size={10} color="#1E3A8A" />
                <View style={styles.verticalLinkConnector} />
                <MaterialCommunityIcons name="map-marker" size={14} color="#A3E635" />
              </View>

              <View style={styles.routeLabelsColumn}>
                <Text style={styles.locationText} numberOfLines={1}>{ride.pickup}</Text>
                <Text style={styles.locationText} numberOfLines={1}>{ride.destination}</Text>
              </View>
            </View>

            {/* Footer Row Block Module */}
            <View style={styles.cardFooterRow}>
              <Text style={styles.rideIdLabel}>Ride ID: #{ride.id}</Text>
            </View>

          </View>
        ))}
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
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
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
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  typeTagCapsule: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  sharedBackground: {
    backgroundColor: '#A3E635',
    borderColor: '#1E3A8A',
  },
  privateBackground: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
    paddingLeft: 2,
  },
  timelineIndicatorsColumn: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 16,
    marginRight: 14,
    paddingVertical: 4,
  },
  verticalLinkConnector: {
    flex: 1,
    width: 2,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  routeLabelsColumn: {
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E2937',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rideIdLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.3,
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

export default RideHistory