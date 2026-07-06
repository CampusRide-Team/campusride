import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

const DriverNavigation = ({ onBack, onArrive, onCancelNoPenalty, onChangeTab, passenger }) => {
  const [hasArrived, setHasArrived] = useState(false)
  const [tripStarted, setTripStarted] = useState(false)
  const [secondsWaiting, setSecondsWaiting] = useState(0)

  // TODO: BACKEND INTEGRATION — Initialize native geolocation watchers and stream driver coordinates via WebSockets
  // Endpoint/Protocol: wss://your-backend-url/api/v1/telemetry/driver
  useEffect(() => {
    console.log('Driver GPS location tracking stream initialized.')
    return () => {
      console.log('Driver GPS location stream torn down.')
    }
  }, [])

  // Live countdown tracker clock that triggers only when driver confirms arrival
  useEffect(() => {
    let interval = null
    if (hasArrived && !tripStarted) {
      interval = setInterval(() => {
        setSecondsWaiting((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [hasArrived, tripStarted])

  // Helper utility function to parse numerical seconds into standard MM:SS digital string layout
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentPassenger = passenger || {
    id: 'req_lucy',
    name: 'Lucy Amankwa',
    rating: '4.9',
    pickup: 'Law Department',
    destination: 'Engineering Block C',
    avatarEmoji: '👩‍🎓',
  }

  // Determine if the driver has waited past the 5-minute penalty-free limit threshold (300 seconds)
  const isCancellationEligible = secondsWaiting >= 300

  // DYNAMIC COORDINATE SETUP BASES
  const driverCoords = { latitude: 5.6506, longitude: -0.1915 } 
  let activeTargetCoords = { latitude: 5.6545, longitude: -0.1873 } 

  // Dynamically re-route coordinates based on current phase state
  if (!tripStarted) {
    if (currentPassenger.id === 'req_kwame') {
      activeTargetCoords = { latitude: 5.6582, longitude: -0.1889 } 
    } else if (currentPassenger.id === 'req_aisha') {
      activeTargetCoords = { latitude: 5.6455, longitude: -0.1842 } 
    }
  } else {
    if (currentPassenger.id === 'req_kwame') {
      activeTargetCoords = { latitude: 5.6621, longitude: -0.1925 } 
    } else if (currentPassenger.id === 'req_aisha') {
      activeTargetCoords = { latitude: 5.6492, longitude: -0.1898 } 
    } else {
      activeTargetCoords = { latitude: 5.6595, longitude: -0.1852 } 
    }
  }

  const navigationRegion = {
    latitude: (driverCoords.latitude + activeTargetCoords.latitude) / 2,
    longitude: (driverCoords.longitude + activeTargetCoords.longitude) / 2,
    latitudeDelta: Math.abs(driverCoords.latitude - activeTargetCoords.latitude) * 2 || 0.012,
    longitudeDelta: Math.abs(driverCoords.longitude - activeTargetCoords.longitude) * 2 || 0.010,
  }

  // TODO: BACKEND INTEGRATION — Replace math midpoint fallback with real coordinates array from Google Directions API fetch
  // Endpoint: GET https://maps.googleapis.com/maps/api/directions/json
  const routePathCoordinates = [
    driverCoords,
    { 
      latitude: (driverCoords.latitude + activeTargetCoords.latitude) / 2 + 0.0005, 
      longitude: (driverCoords.longitude + activeTargetCoords.longitude) / 2 - 0.0005 
    },
    activeTargetCoords,
  ]

  const handlePrimaryAction = () => {
    if (!hasArrived) {
      // TODO: BACKEND INTEGRATION — PUT HTTP request to update ride state to 'ARRIVED' and trigger passenger push notification
      // Endpoint: PUT /api/v1/rides/${currentPassenger.id}/arrived
      setHasArrived(true)
    } else if (!tripStarted) {
      // TODO: BACKEND INTEGRATION — PUT HTTP request to update ride state to 'IN_TRANSIT' and stop waiting timer
      // Endpoint: PUT /api/v1/rides/${currentPassenger.id}/start
      setTripStarted(true)
    } else {
      // TODO: BACKEND INTEGRATION — PUT HTTP request to clear active ride record, store transaction logs, and process payment
      // Endpoint: PUT /api/v1/rides/${currentPassenger.id}/complete
      if (onArrive) onArrive()
    }
  }

  const handleCancelRide = () => {
    console.log('Cancellation workflow triggered.')
    // TODO: BACKEND INTEGRATION — POST HTTP request to clear active ride status with late passenger penalty exemption flags
    // Endpoint: POST /api/v1/rides/${currentPassenger.id}/cancel-no-penalty
    if (onCancelNoPenalty) {
      onCancelNoPenalty()
    } else if (onBack) {
      onBack() 
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Top Header Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.headerButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>
          {tripStarted ? 'In Transit to Drop-off' : hasArrived ? 'At Pickup Point' : 'Navigating to Pickup'}
        </Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.headerButton}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      {/* Map Viewport Canvas */}
      <View style={styles.mapViewportContainer}>
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
          style={StyleSheet.absoluteFillObject}
          region={navigationRegion}
          showsCompass={false}
        >
          <Polyline
            coordinates={routePathCoordinates}
            strokeColor={tripStarted ? '#A3E635' : '#1E3A8A'} 
            strokeWidth={4}
            lineDashPattern={[6, 6]} 
          />

          <Marker coordinate={driverCoords}>
            <View style={styles.driverLocatorCircle}>
              <MaterialCommunityIcons name="navigation" size={16} color="#FFFFFF" style={styles.driverNavIcon} />
            </View>
          </Marker>

          <Marker coordinate={activeTargetCoords}>
            <View style={styles.pickupMarkerContainer}>
              <View style={[styles.pickupLabelBadge, tripStarted && styles.dropoffBadgeVariant]}>
                <Text style={styles.pickupLabelText}>
                  {tripStarted ? 'DROP-OFF' : 'PICKUP'}
                </Text>
              </View>
              <View style={[styles.pickupPinNode, tripStarted && styles.dropoffPinVariant]}>
                <View style={styles.pickupPinInnerNode} />
              </View>
            </View>
          </Marker>
        </MapView>

        <View style={styles.floatingControlsStack}>
          <TouchableOpacity style={styles.mapUtilityButton} activeOpacity={0.8}>
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#1E2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapUtilityButton} activeOpacity={0.8}>
            <MaterialCommunityIcons name="layers-outline" size={20} color="#1E2937" />
          </TouchableOpacity>
        </View>

        {/* Bottom Ride Information Sheet */}
        <View style={styles.passengerSheet}>
          <View style={styles.profileMasterRow}>
            <View style={styles.avatarContainerMock}>
              <Text style={styles.avatarEmojiMock}>{currentPassenger.avatarEmoji}</Text>
              <View style={styles.ratingBadgeContainer}>
                <Text style={styles.ratingTextValue}>★ {currentPassenger.rating}</Text>
              </View>
            </View>

            <View style={styles.identityTextBlock}>
              <Text style={styles.passengerNameText}>{currentPassenger.name}</Text>
              <View style={styles.subLocationRow}>
                {/* 🌟 FIXED: Validated icon family string parameter */}
                <MaterialCommunityIcons name="routes" size={14} color="#64748B" />
                <Text style={styles.subLocationLabel} numberOfLines={1}>
                  {tripStarted ? currentPassenger.destination : currentPassenger.pickup}
                </Text>
              </View>
            </View>

            <View style={styles.communicationButtonsGroup}>
              {/* TODO: BACKEND INTEGRATION — Hook local string parameter dynamically into the device dialer interface */}
              <TouchableOpacity 
                style={styles.commsCircleButton} 
                activeOpacity={0.7}
                onPress={() => console.log('Native dialer initiated.')}
              >
                <MaterialCommunityIcons name="phone" size={18} color="#1E2937" />
              </TouchableOpacity>

              {/* TODO: BACKEND INTEGRATION — Route to dedicated internal workspace messages stack channel */}
              <TouchableOpacity 
                style={styles.commsCircleButton} 
                activeOpacity={0.7}
                onPress={() => console.log('Internal messaging portal opened.')}
              >
                <MaterialCommunityIcons name="message-text" size={18} color="#1E2937" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Conditional Layout Notification Banners */}
          {tripStarted ? (
            <View style={styles.transitTrackingBanner}>
              <MaterialCommunityIcons name="rocket-launch" size={16} color="#1E3A8A" />
              <Text style={styles.transitTextContent}>
                Driving to destination point. Follow road safety margins.
              </Text>
            </View>
          ) : hasArrived ? (
            <View style={[styles.timerTrackingBanner, isCancellationEligible && styles.timerAlertBannerVariant]}>
              <MaterialCommunityIcons 
                name={isCancellationEligible ? "alert-circle" : "clock-outline"} 
                size={16} 
                color={isCancellationEligible ? "#EF4444" : "#1E3A8A"} 
              />
              <Text style={[styles.timerTrackingLabel, isCancellationEligible && styles.timerAlertLabelVariant]}>
                {isCancellationEligible ? (
                  <Text>Passenger late. <Text style={styles.boldText}>Penalty-free cancellation active.</Text></Text>
                ) : (
                  <Text>Waiting for passenger: <Text style={styles.timerCountdownValue}>{formatTime(secondsWaiting)}</Text></Text>
                )}
              </Text>
            </View>
          ) : (
            <View style={styles.instructionNoteBanner}>
              <MaterialCommunityIcons name="information" size={16} color="#1E3A8A" />
              <Text style={styles.instructionTextContent}>
                "Wait at the North entrance circular drive. Look for the blue backpack."
              </Text>
            </View>
          )}

          {/* Conditional Action Button Stack */}
          <View style={styles.actionButtonsStack}>
            {hasArrived && !tripStarted && isCancellationEligible && (
              <TouchableOpacity 
                style={styles.cancelRideButton} 
                activeOpacity={0.85} 
                onPress={handleCancelRide}
              >
                <Text style={styles.cancelButtonText}>Cancel Ride (No Penalty)</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[
                styles.primaryActionButton, 
                hasArrived && styles.startTripButtonVariant,
                tripStarted && styles.endTripButtonVariant
              ]} 
              activeOpacity={0.85} 
              onPress={handlePrimaryAction}
            >
              <Text style={styles.primaryButtonText}>
                {tripStarted ? 'End Trip  🏁' : hasArrived ? 'Start Trip  ➔' : 'Arrived at Pickup  ✓'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Base System Tab Nav Bar Component */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity style={styles.tabItem} onPress={() => onChangeTab?.('home')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="home-outline" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelInactive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onChangeTab?.('trips')} activeOpacity={0.7}>
          <View style={[styles.tabIconBackground, styles.activeTabIconBackground]}>
            <MaterialCommunityIcons name="car-multiple" size={24} color="#1E3A8A" />
          </View>
          <Text style={styles.tabLabelActive}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onChangeTab?.('profile')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="account-circle-outline" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelInactive}>Profile</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.3,
  },
  mapViewportContainer: {
    flex: 1,
    position: 'relative',
  },
  floatingControlsStack: {
    position: 'absolute',
    right: 16,
    top: '25%',
    gap: 12,
  },
  mapUtilityButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  driverLocatorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  driverNavIcon: {
    transform: [{ rotate: '45deg' }],
  },
  pickupMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupLabelBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: -2,
    zIndex: 10,
  },
  dropoffBadgeVariant: {
    backgroundColor: '#A3E635',
  },
  pickupLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pickupPinNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dropoffPinVariant: {
    backgroundColor: '#A3E635',
  },
  pickupPinInnerNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  passengerSheet: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileMasterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainerMock: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  avatarEmojiMock: {
    fontSize: 44,
  },
  ratingBadgeContainer: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: '#A3E635',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  ratingTextValue: {
    color: '#1E3A8A',
    fontSize: 9,
    fontWeight: '800',
  },
  identityTextBlock: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  passengerNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E2937',
    marginBottom: 4,
  },
  subLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subLocationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    width: width * 0.34,
  },
  communicationButtonsGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  commsCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionNoteBanner: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionTextContent: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 16,
  },
  timerTrackingBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  timerAlertBannerVariant: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  timerTrackingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  timerAlertLabelVariant: {
    color: '#EF4444',
  },
  timerCountdownValue: {
    fontWeight: '800',
    color: '#1E3A8A',
  },
  transitTrackingBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  transitTextContent: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  boldText: {
    fontWeight: '800',
  },
  actionButtonsStack: {
    flexDirection: 'column',
    gap: 12,
  },
  primaryActionButton: {
    backgroundColor: '#1E3A8A',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelRideButton: {
    backgroundColor: '#EF4444',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTripButtonVariant: {
    backgroundColor: '#A3E635',
  },
  endTripButtonVariant: {
    backgroundColor: '#EF4444',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 74,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tabItem: {
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
  tabLabelActive: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  tabLabelInactive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
})

export default DriverNavigation