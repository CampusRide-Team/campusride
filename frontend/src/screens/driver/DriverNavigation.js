import React, { useEffect } from 'react'
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

const { width } = Dimensions.get('window')

const DriverNavigation = ({ onBack, onArrive, onChangeTab, passenger }) => {
  
  // TODO: Initialize native geolocation watchers and stream driver coordinates via WebSockets
  useEffect(() => {
    console.log('Driver GPS location tracking stream initialized.')

    return () => {
      console.log('Driver GPS location stream torn down.')
    }
  }, [])

  // 1. Setup fallback coordinate properties to prevent layout breakages
  const currentPassenger = passenger || {
    id: 'req_lucy',
    name: 'Lucy Amankwa',
    rating: '4.9',
    pickup: 'Law Department',
    avatarEmoji: '👩‍🎓',
  }

  // 2. Dynamic coordinates mapping based on the chosen passenger's unique campus location
  const driverCoords = { latitude: 5.6506, longitude: -0.1915 } // Static driver origin layout node
  let pickupCoords = { latitude: 5.6545, longitude: -0.1873 }  // Default Law Department coordinates

  if (currentPassenger.id === 'req_kwame') {
    pickupCoords = { latitude: 5.6582, longitude: -0.1889 }   // Balme Library coordinates
  } else if (currentPassenger.id === 'req_aisha') {
    pickupCoords = { latitude: 5.6455, longitude: -0.1842 }   // Dorms A coordinates
  }

  // 3. Re-calculate navigation bounding viewport region dynamically to focus on the target pickup spot
  const navigationRegion = {
    latitude: (driverCoords.latitude + pickupCoords.latitude) / 2,
    longitude: (driverCoords.longitude + pickupCoords.longitude) / 2,
    latitudeDelta: Math.abs(driverCoords.latitude - pickupCoords.latitude) * 2 || 0.012,
    longitudeDelta: Math.abs(driverCoords.longitude - pickupCoords.longitude) * 2 || 0.010,
  }

  // 4. Generate custom path steps dynamically so lines match the selected student marker
  const routePathCoordinates = [
    driverCoords,
    { 
      latitude: (driverCoords.latitude + pickupCoords.latitude) / 2 + 0.0005, 
      longitude: (driverCoords.longitude + pickupCoords.longitude) / 2 - 0.0005 
    },
    pickupCoords,
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* 1. TOP HEADER NAVIGATION BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.headerButton}>
          <Text style={styles.headerIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Navigating to Pickup</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.headerButton}>
          <Text style={styles.headerIconText}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* 2. MAP VIEWPORT CANVAS */}
      <View style={styles.mapViewportContainer}>
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
          style={StyleSheet.absoluteFillObject}
          region={navigationRegion}
          showsCompass={false}
        >
          {/* Dotted Polyline now recalculates dynamically using routePathCoordinates! */}
          <Polyline
            coordinates={routePathCoordinates}
            strokeColor="#2563EB"
            strokeWidth={4}
            lineDashPattern={[6, 6]} 
          />

          {/* Driver Marker Pin */}
          <Marker coordinate={driverCoords}>
            <View style={styles.driverLocatorCircle}>
              <Text style={styles.driverArrowIcon}>➔</Text>
            </View>
          </Marker>

          {/* Pickup Marker now moves positions cleanly based on pickupCoords! */}
          <Marker coordinate={pickupCoords}>
            <View style={styles.pickupMarkerContainer}>
              <View style={styles.pickupLabelBadge}>
                <Text style={styles.pickupLabelText}>PICKUP</Text>
              </View>
              <View style={styles.pickupPinNode}>
                <View style={styles.pickupPinInnerNode} />
              </View>
            </View>
          </Marker>
        </MapView>

        <View style={styles.floatingControlsStack}>
          <TouchableOpacity style={styles.mapUtilityButton} activeOpacity={0.8}>
            <Text style={styles.utilityIconEmoji}>🎯</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapUtilityButton} activeOpacity={0.8}>
            <Text style={styles.utilityIconEmoji}>🥞</Text>
          </TouchableOpacity>
        </View>

        {/* 3. BOTTOM RIDE INFORMATION BOTTOM SHEET SLIDER */}
        <View style={styles.passengerPassengerSheet}>
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
                <Text style={styles.locationArrowIcon}>➦</Text>
                <Text style={styles.subLocationLabel} numberOfLines={1}>{currentPassenger.pickup}</Text>
              </View>
            </View>

            <View style={styles.communicationButtonsGroup}>
              {/* TODO: Integrate React Native Linking to trigger system phone dialer */}
              <TouchableOpacity 
                style={styles.commsCircleButton} 
                activeOpacity={0.7}
                onPress={() => console.log('Native dialer initiated.')}
              >
                <Text style={styles.commsIconEmoji}>📞</Text>
              </TouchableOpacity>

              {/* TODO: Push messaging room layout context route here */}
              <TouchableOpacity 
                style={styles.commsCircleButton} 
                activeOpacity={0.7}
                onPress={() => console.log('Internal messaging portal opened.')}
              >
                <Text style={styles.commsIconEmoji}>💬</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.instructionNoteBanner}>
            <Text style={styles.infoIconDecorator}>ⓘ</Text>
            <Text style={styles.instructionTextContent}>
              "Wait at the North entrance circular drive. Look for the blue backpack."
            </Text>
          </View>

          <TouchableOpacity style={styles.arrivedButton} activeOpacity={0.85} onPress={onArrive}>
            <Text style={styles.arrivedButtonText}>Arrived at Pickup  ✓</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. BASE SYSTEM DECORATOR NAVIGATION APP TABS BAR */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity style={styles.tabItem} onPress={() => onChangeTab && onChangeTab('home')} activeOpacity={0.7}>
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

export default DriverNavigation

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D1EAEB', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#E4EFF2',
    borderWidth: 1,
    borderColor: '#CBE0E5',
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 8,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  mapViewportContainer: {
    flex: 1,
    position: 'relative',
    marginTop: 8,
  },
  floatingControlsStack: {
    position: 'absolute',
    right: 16,
    top: '35%',
    gap: 12,
  },
  mapUtilityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  utilityIconEmoji: {
    fontSize: 18,
  },
  driverLocatorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  driverArrowIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    transform: [{ rotate: '-45deg' }], 
  },
  pickupMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupLabelBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: -2,
    zIndex: 10,
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
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pickupPinInnerNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  passengerPassengerSheet: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
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
    backgroundColor: '#84CC16',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ratingTextValue: {
    color: '#FFFFFF',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  subLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationArrowIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  subLocationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    width: width * 0.34,
  },
  communicationButtonsGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  commsCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commsIconEmoji: {
    fontSize: 16,
  },
  instructionNoteBanner: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoIconDecorator: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 1,
  },
  instructionTextContent: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 16,
  },
  arrivedButton: {
    backgroundColor: '#2A437E',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A437E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  arrivedButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
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