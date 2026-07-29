// StudentHome.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

import ProfileScreen from './ProfileScreen'; 
import RideBooking from './RideBooking'; 
import AlertScreen from './AlertScreen';
import HelpSupportScreen from './HelpSupportScreen';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const LIME = '#B6E84A';
const MUTED = '#8A8FA3';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const PILL_BG = '#F1F5F9';
const TAB_ACTIVE_BG = '#EEF2FF';
const BORDER = '#E2E8F0';
const GREEN_PILL = '#DCFCE7';
const GREEN_TEXT = '#16a34a';

// TODO: Replace with dynamic data fetched from backend API
const INITIAL_RIDES = [
  { 
    id: '1', 
    name: 'Daniel Miller', 
    rating: '4.9', 
    totalRides: '2,400+ rides', 
    place: 'Engineering Bldg', 
    seats: '3 seats', 
    eta: '3 mins away', 
    vehicleModel: 'White Toyota Camry', 
    vehicleType: 'Premium Campus Fleet',
    licensePlate: 'X-12-24',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    timeColor: GREEN_PILL,
    timeTextColor: GREEN_TEXT,
  },
  { 
    id: '2', 
    name: 'Sarah Chen', 
    rating: '4.8', 
    totalRides: '1,150+ rides', 
    place: 'Library North', 
    seats: '2 seats', 
    eta: '5 mins away', 
    vehicleModel: 'Silver Honda Civic', 
    vehicleType: 'Standard Campus Ride',
    licensePlate: 'C-88-91',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    timeColor: PILL_BG,
    timeTextColor: MUTED,
  },
  { 
    id: '3', 
    name: 'Marcus Thorne', 
    rating: '4.95', 
    totalRides: '3,100+ rides', 
    place: 'Science Complex', 
    seats: '4 seats', 
    eta: '6 mins away', 
    vehicleModel: 'Blue Hyundai Elantra', 
    vehicleType: 'Express Campus Fleet',
    licensePlate: 'H-45-10',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    timeColor: PILL_BG,
    timeTextColor: MUTED,
  },
  { 
    id: '4', 
    name: 'Jessica Taylor', 
    rating: '4.7', 
    totalRides: '900+ rides', 
    place: 'Student Union', 
    seats: '3 seats', 
    eta: '8 mins away', 
    vehicleModel: 'Black Nissan Sentra', 
    vehicleType: 'Standard Campus Ride',
    licensePlate: 'T-99-12',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    timeColor: PILL_BG,
    timeTextColor: MUTED,
  },
];

const MAP_URI = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200';

export default function StudentHome({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [rides] = useState(INITIAL_RIDES);

  const [step, setStep] = useState('list');
  const [selectedRide, setSelectedRide] = useState(null);
  
  const [pickupLocation, setPickupLocation] = useState('Current Location');
  const [destination, setDestination] = useState('');
  const [rideType, setRideType] = useState('shared');

  const [countdown, setCountdown] = useState(30);

  // TODO: Implement actual WebSocket or backend timeout synchronization
  useEffect(() => {
    let timer;
    if (step === 'waiting-countdown' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && step === 'waiting-countdown') {
      Alert.alert(
        "Request Expired",
        `${selectedRide?.name || 'Driver'} did not respond in time. Please choose another driver.`,
        [{ text: "OK", onPress: () => { setStep('list'); setSelectedRide(null); setCountdown(30); } }]
      );
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (activeTab === 'profile') {
    return <ProfileScreen onLogout={onLogout} onNavigate={(tab) => setActiveTab(tab)} />;
  }
  if (activeTab === 'history' || activeTab === 'rides') {
    return <RideBooking onNavigate={(tab) => setActiveTab(tab)} />;
  }
  if (activeTab === 'alerts') {
    return <AlertScreen onNavigate={(tab) => setActiveTab(tab)} />;
  }
  if (activeTab === 'support') {
    return <HelpSupportScreen onNavigate={(tab) => setActiveTab(tab)} />;
  }

  const handleConfirmRideRequest = () => {
    if (!destination.trim()) {
      setDestination(selectedRide?.place || 'Engineering Bldg');
    }
    // TODO: Dispatch ride request API payload
    setStep('waiting-countdown');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* App Header Area - Left: Brand, Right: User Profile */}
      <View style={styles.header}>
        {step !== 'list' ? (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (step === 'details') setStep('list');
              else if (step === 'request-form') setStep('details');
              else if (step === 'waiting-countdown') { setStep('request-form'); setCountdown(30); }
            }} 
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={TEXT} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.brand}>CampusRide</Text>
        )}

        <Text style={styles.headerTitleCenter}>
          {step === 'details' && 'Driver Details'}
          {step === 'request-form' && 'Request a Ride'}
          {step === 'waiting-countdown' && 'Waiting for Driver'}
        </Text>

        <TouchableOpacity 
          style={styles.avatarRing} 
          onPress={() => setActiveTab('profile')} 
          activeOpacity={0.7}
        >
          {/* TODO: Replace with user profile image URI from auth context if available */}
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' }} 
            style={styles.avatarImg} 
          />
        </TouchableOpacity>
      </View>

      {/* Main Content Body */}
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Map / Hero Section */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 37.4419,
              longitude: -122.1430,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsCompass={false}
            showsMyLocationButton={false}
          >
            {/* TODO: Load live driver coordinates via socket connection */}
            <Marker coordinate={{ latitude: 37.4520, longitude: -122.1250 }}>
              <View style={styles.fleetBubble}>
                <FontAwesome5 name="car" size={12} color="#FFFFFF" />
                <Text style={styles.fleetBubbleText}>2</Text>
              </View>
            </Marker>

            <Marker coordinate={{ latitude: 37.4310, longitude: -122.1600 }}>
              <View style={styles.fleetBubble}>
                <FontAwesome5 name="car" size={12} color="#FFFFFF" />
                <Text style={styles.fleetBubbleText}>3</Text>
              </View>
            </Marker>
          </MapView>

          {/* Floating Search Bar Overlay (Only shown on list step) */}
          {step === 'list' && (
            <View style={styles.searchBarContainer}>
              <Ionicons name="location-outline" size={20} color={BLUE} style={styles.searchPinIcon} />
              <TextInput 
                placeholder="Where are you going?" 
                placeholderTextColor={MUTED} 
                style={styles.searchTextPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity 
                style={styles.filterIconWrap}
                activeOpacity={0.7}
                onPress={() => Alert.alert("Filters", "Filter options coming soon.")}
              >
                <Feather name="sliders" size={16} color={NAVY} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Sheet / Ride List Container (No Bottom Shadow) */}
        {step === 'list' && (
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandleBar} />

            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Nearby Available Rides</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => Alert.alert("See All", "Displaying all active campus drivers.")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rideListScroll}>
              {rides.map((r) => (
                <TouchableOpacity 
                  key={r.id} 
                  style={styles.rideCard} 
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedRide(r);
                    setStep('details');
                  }}
                >
                  <Image source={{ uri: r.avatar }} style={styles.driverAvatar} />
                  
                  <View style={styles.rideCardInfo}>
                    <View style={styles.driverRow}>
                      <Text style={styles.driverName}>{r.name}</Text>
                      <View style={[styles.timeBadge, { backgroundColor: r.timeColor }]}>
                        <Text style={[styles.timeBadgeText, { color: r.timeTextColor }]}>
                          {r.eta}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.rideMetaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={13} color={MUTED} />
                        <Text style={styles.metaText}>{r.seats}</Text>
                      </View>
                      <Text style={styles.metaDot}>•</Text>
                      <View style={styles.metaItem}>
                        <FontAwesome5 name="university" size={11} color={MUTED} style={{ marginRight: 2 }} />
                        <Text style={styles.metaText}>{r.place}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Details Step */}
        {step === 'details' && selectedRide && (
          <View style={styles.sheetStandalone}>
            <View style={styles.detailTopRow}>
              <View>
                <Text style={styles.estimatedArrivalLabel}>ESTIMATED ARRIVAL</Text>
                <Text style={styles.estimatedArrivalTime}>{selectedRide.eta}</Text>
              </View>
              <View style={styles.seatsBadgeLarge}>
                <Ionicons name="person" size={14} color={NAVY} />
                <Text style={styles.seatsBadgeTextLarge}>{selectedRide.seats} available</Text>
              </View>
            </View>

            <View style={styles.driverProfileRow}>
              <View style={styles.driverAvatarContainer}>
                <Image source={{ uri: selectedRide.avatar }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                <View style={styles.verifiedDot} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.driverNameText}>{selectedRide.name}</Text>
                <Text style={styles.driverMetaText}>
                  ★ {selectedRide.rating}  •  {selectedRide.totalRides}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.iconCircleBtn} 
                onPress={() => Alert.alert("Call Driver", `Calling ${selectedRide.name}...`)}
              >
                <Ionicons name="call-outline" size={20} color={NAVY} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconCircleBtn, { marginLeft: 10 }]} 
                onPress={() => Alert.alert("Chat", `Opening message thread with ${selectedRide.name}`)}
              >
                <Ionicons name="chatbubble-outline" size={20} color={NAVY} />
              </TouchableOpacity>
            </View>

            <View style={styles.vehicleCardBox}>
              <View style={styles.carIconWrap}>
                <MaterialCommunityIcons name="car" size={24} color={NAVY} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.vehicleModelText}>{selectedRide.vehicleModel}</Text>
                <Text style={styles.vehicleTypeText}>{selectedRide.vehicleType}</Text>
              </View>
              <View style={styles.licensePlatePill}>
                <Text style={styles.licensePlateText}>{selectedRide.licensePlate}</Text>
              </View>
            </View>

            <View style={styles.driverPerksBox}>
              <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
              <Text style={styles.driverPerksText}>Verified Campus Student Driver • Instant Matching</Text>
            </View>

            <TouchableOpacity 
              style={styles.requestRideBtn} 
              activeOpacity={0.85}
              onPress={() => {
                setDestination(selectedRide.place);
                setStep('request-form');
              }}
            >
              <Text style={styles.requestRideBtnText}>Request Ride</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Request Form Step */}
        {step === 'request-form' && (
          <View style={styles.formContainer}>
            <View style={styles.locationCard}>
              <View style={styles.locRow}>
                <View style={styles.originDot} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.locLabel}>PICKUP</Text>
                  <TextInput
                    style={styles.locInputInline}
                    value={pickupLocation}
                    onChangeText={setPickupLocation}
                    placeholder="Current Location"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              
              <View style={styles.connectingLine} />

              <View style={styles.locRow}>
                <Ionicons name="flag" size={16} color={NAVY} style={{ marginLeft: -2 }} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.locLabel}>DESTINATION</Text>
                  <TextInput
                    style={styles.locInputInline}
                    value={destination}
                    onChangeText={setDestination}
                    placeholder="Enter destination building"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            <View style={styles.mapCardMini}>
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 16 }}>
                <View style={styles.mapPinIndicator} />
                <View style={styles.mapPillLeft}>
                  <Ionicons name="time-outline" size={14} color={NAVY} />
                  <Text style={styles.mapPillText}>{selectedRide?.eta || '3 mins away'}</Text>
                </View>
                <View style={styles.mapPillRight}>
                  <Ionicons name="location-outline" size={14} color={NAVY} />
                  <Text style={styles.mapPillText}>2.4 miles</Text>
                </View>
              </ImageBackground>
            </View>

            <Text style={styles.sectionTitle}>SELECT RIDE TYPE</Text>

            <TouchableOpacity 
              style={[styles.rideTypeCard, rideType === 'shared' && styles.rideTypeCardActive]} 
              activeOpacity={0.85}
              onPress={() => setRideType('shared')}
            >
              <View style={styles.rideTypeIconWrap}>
                <Ionicons name="people" size={22} color={BLUE} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.rideTypeName}>Shared Ride</Text>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>POPULAR</Text>
                  </View>
                </View>
                <Text style={styles.rideTypeDesc}>Eco-friendly transit with fellow students</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.rideTypeCard, rideType === 'private' && styles.rideTypeCardActive]} 
              activeOpacity={0.85}
              onPress={() => setRideType('private')}
            >
              <View style={styles.rideTypeIconWrap}>
                <Ionicons name="person" size={22} color={BLUE} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.rideTypeName}>Private Ride</Text>
                <Text style={styles.rideTypeDesc}>Direct route for focused travel</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.zonePill}>
              <Ionicons name="car-sport" size={16} color={NAVY} />
              <Text style={styles.zonePillText}>{selectedRide?.seats || '3 seats'} available with {selectedRide?.name}</Text>
            </View>

            <TouchableOpacity 
              style={styles.confirmRideBtn} 
              activeOpacity={0.85}
              onPress={handleConfirmRideRequest}
            >
              <Text style={styles.confirmRideBtnText}>CONFIRM RIDE</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Waiting Countdown Step */}
        {step === 'waiting-countdown' && (
          <View style={styles.waitingContainer}>
            <View style={styles.mapCardMiniFull}>
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 16 }}>
                <View style={styles.mapPinIndicator} />
              </ImageBackground>
            </View>

            <View style={styles.radarCard}>
              <View style={styles.timerRing}>
                <Text style={styles.timerText}>{countdown}s</Text>
              </View>
              <Text style={styles.waitingTitle}>Waiting for {selectedRide?.name || 'Driver'}...</Text>
              <Text style={styles.waitingSub}>
                Reviewing your request for a {rideType} ride to {destination}.
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.cancelRequestBtn} 
              activeOpacity={0.85}
              onPress={() => {
                setStep('list');
                setSelectedRide(null);
                setCountdown(30);
              }}
            >
              <Text style={styles.cancelRequestBtnText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Unified Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home" size={22} color={BLUE} />} label="Home" active={true} onPress={() => setActiveTab('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={MUTED} />} label="Rides" onPress={() => setActiveTab('history')} />
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => setActiveTab('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={MUTED} />} label="Profile" onPress={() => setActiveTab('profile')} />
      </View>
    </SafeAreaView>
  );
}

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
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    zIndex: 20,
  },
  brand: { fontSize: 22, fontWeight: '900', color: NAVY, letterSpacing: -0.3 },
  headerTitleCenter: { fontSize: 17, fontWeight: '700', color: TEXT },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: '#FFFFFF', 
    overflow: 'hidden', 
    backgroundColor: '#fff',
    elevation: 3,
  },
  avatarImg: { width: '100%', height: '100%' },

  mapContainer: {
    height: 400,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  fleetBubble: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fleetBubbleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  searchBarContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  searchPinIcon: { marginRight: 10 },
  searchTextPlaceholder: { flex: 1, fontSize: 15, color: TEXT, fontWeight: '500' },
  filterIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PILL_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomSheet: {
    backgroundColor: CARD_BG,
    marginTop: -24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    elevation: 0,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: TEXT },
  seeAllText: { fontSize: 13, fontWeight: '700', color: BLUE, backgroundColor: TAB_ACTIVE_BG, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },

  rideListScroll: { gap: 12 },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    shadowOpacity: 0,
    elevation: 0,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  rideCardInfo: { flex: 1, marginLeft: 14 },
  driverRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  driverName: { fontSize: 16, fontWeight: '800', color: TEXT },
  timeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  timeBadgeText: { fontSize: 11, fontWeight: '800' },

  rideMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, fontWeight: '600', color: MUTED },
  metaDot: { color: MUTED, fontSize: 12 },

  sheetStandalone: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  detailTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  estimatedArrivalLabel: { fontSize: 12, fontWeight: '700', color: MUTED, letterSpacing: 0.5 },
  estimatedArrivalTime: { fontSize: 24, fontWeight: '800', color: NAVY, marginTop: 2 },
  seatsBadgeLarge: { flexDirection: 'row', alignItems: 'center', backgroundColor: LIME, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  seatsBadgeTextLarge: { color: NAVY, fontWeight: '700', marginLeft: 6, fontSize: 13 },
  driverProfileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  driverAvatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E6EFFF', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  verifiedDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff' },
  driverNameText: { fontSize: 18, fontWeight: '800', color: TEXT },
  driverMetaText: { fontSize: 13, color: MUTED, marginTop: 3, fontWeight: '600' },
  iconCircleBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  vehicleCardBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  carIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  vehicleModelText: { fontSize: 15, fontWeight: '700', color: TEXT },
  vehicleTypeText: { fontSize: 13, color: MUTED, marginTop: 2 },
  licensePlatePill: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  licensePlateText: { fontSize: 12, fontWeight: '700', color: TEXT, letterSpacing: 0.5 },
  driverPerksBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginBottom: 20, gap: 8, borderWidth: 1, borderColor: '#DCFCE7' },
  driverPerksText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  requestRideBtn: { backgroundColor: NAVY, borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  requestRideBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  formContainer: { padding: 16 },
  locationCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  originDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE, marginLeft: 3 },
  connectingLine: { width: 2, height: 20, backgroundColor: '#E2E8F0', marginLeft: 7, marginVertical: 4 },
  locLabel: { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 0.5 },
  locInputInline: { fontSize: 15, fontWeight: '700', color: TEXT, marginTop: 2, height: 30, padding: 0 },
  mapCardMini: { height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: BORDER },
  mapCardMiniFull: { height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  mapImage: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  mapPinIndicator: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff' },
  mapPillLeft: { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapPillRight: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapPillText: { fontSize: 12, fontWeight: '700', color: NAVY },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: MUTED, letterSpacing: 0.8, marginBottom: 12 },
  rideTypeCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: BORDER, marginBottom: 12 },
  rideTypeCardActive: { borderColor: BLUE, backgroundColor: '#F8FAFC' },
  rideTypeIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: TAB_ACTIVE_BG, alignItems: 'center', justifyContent: 'center' },
  rideTypeName: { fontSize: 16, fontWeight: '700', color: TEXT },
  rideTypeDesc: { fontSize: 13, color: MUTED, marginTop: 2 },
  popularBadge: { backgroundColor: LIME, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  popularBadgeText: { fontSize: 10, fontWeight: '800', color: NAVY },
  zonePill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF', paddingVertical: 12, borderRadius: 14, gap: 8, marginTop: 6, marginBottom: 20 },
  zonePillText: { fontSize: 13, fontWeight: '700', color: NAVY },
  confirmRideBtn: { backgroundColor: NAVY, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, elevation: 4 },
  confirmRideBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  waitingContainer: { padding: 16, alignItems: 'center' },
  radarCard: { backgroundColor: CARD_BG, borderRadius: 20, padding: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: BORDER, marginVertical: 16 },
  timerRing: { width: 90, height: 90, borderRadius: 45, backgroundColor: TAB_ACTIVE_BG, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 3, borderColor: BLUE },
  timerText: { fontSize: 24, fontWeight: '800', color: NAVY },
  waitingTitle: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 6 },
  waitingSub: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },
  cancelRequestBtn: { backgroundColor: '#EF4444', height: 56, borderRadius: 16, width: '100%', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, elevation: 4 },
  cancelRequestBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  tabBar: { 
    position: 'absolute', left: 0, right: 0, bottom: 0, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    paddingTop: 8, 
    paddingBottom: Platform.OS === 'ios' ? 24 : 12, 
    borderTopLeftRadius: 24, borderTopRightRadius: 24, 
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 10 
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 16 },
  tabIconWrapActive: { backgroundColor: TAB_ACTIVE_BG },
  tabLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
  tabLabelActive: { color: NAVY, fontWeight: '700' },
});