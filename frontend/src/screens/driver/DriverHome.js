import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Dimensions,
  Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context' 
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')

const DriverHome = ({ onLogout, onViewRequests, onChangeTab }) => {
  const [isOnline, setIsOnline] = useState(true)

  const toggleOnlineStatus = () => setIsOnline((prev) => !prev)

  const ugCampusRegion = {
    latitude: 5.6506,       
    longitude: -0.1873,     
    latitudeDelta: 0.015,   
    longitudeDelta: 0.012,
  }

  const mockPassengerRequests = [
    { id: 'req_1', latitude: 5.6542, longitude: -0.1915, label: 'Balme Library' },
    { id: 'req_2', latitude: 5.6481, longitude: -0.1812, label: 'Night Market' },
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* 1. TOP HEADER APP BAR */}
      <View style={styles.header}>
        <Text style={styles.logoText}>CampusRide</Text>
        <View style={styles.headerRight}>
          <Text style={styles.driverName}>Alex</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => onChangeTab('profile')} style={styles.avatarContainer}>
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>👨‍✈️</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="bell-outline" size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. DYNAMIC GO ONLINE SWITCH CARD */}
      <View style={styles.toggleCardContainer}>
        <View style={styles.toggleCard}>
          <View>
            <Text style={styles.toggleCardTitle}>
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Text>
            <Text style={styles.toggleCardSubtitle}>
              {isOnline ? 'Ready to accept ride requests' : 'Stay offline to pause requests'}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#CBD5E1', true: '#84CC16' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#CBD5E1"
            onValueChange={toggleOnlineStatus}
            value={isOnline}
          />
        </View>
      </View>

      {/* 3. LIVE MAP VIEWPORT AREA */}
      <View style={styles.mapViewportContainer}>
        {/* 💡 TODO: BACKEND INTEGRATION — Initialize background polling or server sent events (SSE) to update surrounding active student coordinates */}
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
          style={StyleSheet.absoluteFillObject}
          initialRegion={ugCampusRegion}
          showsCompass={false}
          showsPointsOfInterest={true}
        >
          {isOnline && (
            <>
              {/* 💡 TODO: BACKEND INTEGRATION — Switch static driver marker coordinates with live geolocation device tracking state */}
              <Marker coordinate={{ latitude: 5.6506, longitude: -0.1873 }}>
                <View style={styles.driverPulseOuter}>
                  <View style={styles.driverPulseInner} />
                </View>
              </Marker>

              {mockPassengerRequests.map((request) => (
                <Marker 
                  key={request.id} 
                  coordinate={{ latitude: request.latitude, longitude: request.longitude }}
                  title={request.label}
                >
                  <View style={styles.passengerPin}>
                    <MaterialCommunityIcons name="account" size={14} color="#FFFFFF" />
                  </View>
                </Marker>
              ))}
            </>
          )}
        </MapView>

        {/* Map Overlay Status Badge */}
        <View style={[styles.mapStatusBadge, { backgroundColor: isOnline ? '#DCFCE7' : '#F1F5F9' }]}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22C55E' : '#64748B' }]} />
          <Text style={[styles.mapStatusBadgeText, { color: isOnline ? '#166534' : '#334155' }]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>

        {/* 4. FLOATING CONTEXT SUMMARY STATUS DRAWER */}
        <View style={styles.floatingStatusDrawer}>
          <View style={styles.drawerHeaderRow}>
            <View style={styles.drawerTextBlock}>
              <Text style={styles.drawerMainStatusTitle}>
                {isOnline ? 'You are online' : 'You are offline'}
              </Text>
              <Text style={styles.drawerSubStatusTitle}>
                {isOnline ? '⚡ 3 requests nearby' : 'Toggle online status to start tracking'}
              </Text>
            </View>
            <View style={styles.drawerIconSquare}>
              <MaterialCommunityIcons name="routes" size={22} color="#1E3A8A" />
            </View>
          </View>

          {/* 💡 TODO: BACKEND INTEGRATION — Pull analytics aggregate history payloads to replace static driving matrices */}
          {/* Endpoint target: GET /api/drivers/analytics-summary */}
          <Text style={styles.metricsTextLine}>
            Trips today: <Text style={styles.metricsBoldValue}>5</Text> • Total trips: <Text style={styles.metricsBoldValue}>42</Text>
          </Text>

          <TouchableOpacity 
            style={[styles.actionButton, !isOnline && styles.disabledActionButton]} 
            activeOpacity={0.85}
            disabled={!isOnline}
            onPress={onViewRequests}
          >
            <Text style={styles.actionButtonText}>View Active Requests</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. APP BASE SYSTEM TAB NAV BAR COMPONENT */}
      <View style={styles.tabBarContainer}>
        {/* Home Tab */}
        <TouchableOpacity style={styles.tabItem} onPress={() => onChangeTab('home')} activeOpacity={0.7}>
          <View style={[styles.tabIconBackground, styles.activeTabIconBackground]}>
            <MaterialCommunityIcons name="home" size={24} color="#1E3A8A" />
          </View>
          <Text style={[styles.tabLabelText, styles.activeTabLabelText]}>Home</Text>
        </TouchableOpacity>

        {/* Trips Tab */}
        <TouchableOpacity style={styles.tabItem} onPress={() => onChangeTab('trips')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="car-multiple" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelText}>Trips</Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity style={styles.tabItem} onPress={() => onChangeTab('profile')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="account-circle-outline" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelText}>Profile</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

export default DriverHome

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 18,
  },
  notificationBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCardContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  toggleCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  toggleCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  mapViewportContainer: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  mapStatusBadge: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mapStatusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  passengerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  driverPulseOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  driverPulseInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  floatingStatusDrawer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  drawerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  drawerTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  drawerMainStatusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  drawerSubStatusTitle: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  drawerIconSquare: {
    width: 44,
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsTextLine: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 20,
  },
  metricsBoldValue: {
    color: '#475569',
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: '#1E3A8A',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledActionButton: {
    backgroundColor: '#CBD5E1',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabIconBackground: {
    backgroundColor: '#EFF6FF',
  },
  tabLabelText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  activeTabLabelText: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
})