// PassengerHome.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../../api/axios';
import { getPersistentSocket } from '../../api/socketHelper';
import { useAuth } from '../../context/AuthContext';

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

export default function PassengerHome({ onLogout }) {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [rides, setRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  
  const [step, setStep] = useState('list');
  const [selectedRide, setSelectedRide] = useState(null);
  
  const [currentLocation, setCurrentLocation] = useState({ latitude: 5.6037, longitude: -0.1870 });
  const [pickupLocation, setPickupLocation] = useState('Detecting current location...');
  const [isLocating, setIsLocating] = useState(true);
  
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [rideType, setRideType] = useState('shared');
  const [poiSuggestions, setPoiSuggestions] = useState([]);

  const [countdown, setCountdown] = useState(30);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState(null);

  const mapRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    initializePassengerLocation();
    fetchUserData();

    let isMounted = true;

    async function setupSocket() {
      const socket = await getPersistentSocket();
      if (!isMounted) return;
      socketRef.current = socket;

      const handleRideAssigned = (data) => {
        console.log("🎉 Ride Assigned event received:", data);
        Alert.alert("Driver Assigned!", `Driver ${data.driver?.fullName || 'Assigned'} has accepted your request.`);
        setStep('list');
        setSelectedRide(null);
        setCountdown(30);
        setActiveBookingId(data.bookingId);
      };

      const handleDriverLocation = (updatedDriver) => {
        if (!isMounted) return;
        setRides((prevRides) => {
          const driverId = updatedDriver._id || updatedDriver.driverId || updatedDriver.id;
          
          if (updatedDriver.isOnline === false) {
            return prevRides.filter(r => (r._id || r.driverId || r.id) !== driverId);
          }

          const index = prevRides.findIndex(r => (r._id || r.driverId || r.id) === driverId);
          if (index !== -1) {
            const updated = [...prevRides];
            updated[index] = { ...updated[index], ...updatedDriver };
            return updated;
          }
          return [...prevRides, updatedDriver];
        });
      };

      const handleDriverOffline = ({ driverId }) => {
        if (!isMounted) return;
        setRides((prevRides) => prevRides.filter(r => (r._id || r.driverId || r.id) !== driverId));
      };

      const handleRouteUpdated = (data) => {
        if (!isMounted) return;
        console.log("📍 Sanitized Route Updated in PassengerHome:", data);
      };

      socket.on('ride:assigned', handleRideAssigned);
      socket.on('rideAccepted', handleRideAssigned);
      socket.on('trip:route-updated', handleRouteUpdated);
      socket.on('driverLocationUpdate', handleDriverLocation);
      socket.on('driverWentOffline', handleDriverOffline);

      return () => {
        socket.off('ride:assigned', handleRideAssigned);
        socket.off('rideAccepted', handleRideAssigned);
        socket.off('trip:route-updated', handleRouteUpdated);
        socket.off('driverLocationUpdate', handleDriverLocation);
        socket.off('driverWentOffline', handleDriverOffline);
      };
    }

    let socketCleanup = null;
    setupSocket().then(cleanup => {
      socketCleanup = cleanup;
    });

    return () => {
      isMounted = false;
      if (socketCleanup) socketCleanup();
    };
  }, []);

  const initializePassengerLocation = async () => {
    try {
      setIsLocating(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setIsLocating(false);
        setPickupLocation('Campus Central (Permission Denied)');
        fetchNearbyDrivers(5.6037, -0.1870);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(coords);
      
      let reverseGeocode = await Location.reverseGeocodeAsync(coords);
      if (reverseGeocode && reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const formattedAddress = [place.name, place.street, place.district, place.city]
          .filter(Boolean)
          .join(', ');
        setPickupLocation(formattedAddress || 'Current GPS Location');
      } else {
        setPickupLocation('Current GPS Location');
      }

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }, 1000);
      }

      fetchNearbyDrivers(coords.latitude, coords.longitude);
    } catch (error) {
      console.error("Error obtaining GPS position:", error);
      setPickupLocation('Campus Central Area');
      fetchNearbyDrivers(5.6037, -0.1870);
    } finally {
      setIsLocating(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/profile');
      if (response.data?.success && response.data.data?.user) {
        setUserProfile(response.data.data.user);
      } else if (authUser) {
        setUserProfile(authUser);
      }
    } catch (err) {
      if (authUser) setUserProfile(authUser);
    }
  };

  const fetchNearbyDrivers = async (lat, lng) => {
    try {
      setLoadingRides(true);
      const response = await api.get(`/drivers/active-locations?lat=${lat}&lng=${lng}`);
      if (response.data?.success && Array.isArray(response.data.data)) {
        setRides(response.data.data);
      } else {
        setRides([]);
      }
    } catch (err) {
      setRides([]);
    } finally {
      setLoadingRides(false);
    }
  };

  const handleDestinationChange = async (text) => {
    setDestination(text);
    if (text.trim().length > 1) {
      try {
        const response = await api.get(`/pois/search?query=${encodeURIComponent(text.trim())}&limit=5`);
        if (response.data?.success && Array.isArray(response.data.data)) {
          setPoiSuggestions(response.data.data);
        }
      } catch (e) {
        // Safe swallow
      }
    } else {
      setPoiSuggestions([]);
    }
  };

  const selectPoiDestination = (poi) => {
    setDestination(poi.name);
    if (poi.coordinates?.coordinates) {
      setDestinationCoords(poi.coordinates.coordinates);
    }
    setPoiSuggestions([]);
  };

  useEffect(() => {
    let timer;
    if (step === 'waiting-countdown' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && step === 'waiting-countdown') {
      Alert.alert(
        "Request Expired",
        `${selectedRide?.fullName || selectedRide?.name || 'Driver'} did not respond in time. Please select another driver or broadcast to zone.`,
        [{ text: "OK", onPress: () => { setStep('list'); setSelectedRide(null); setCountdown(30); } }]
      );
    }
    return () => clearInterval(timer);
  }, [step, countdown, selectedRide]);

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

  const handleConfirmSpecificDriverRequest = async () => {
    if (!destination.trim()) {
      return Alert.alert("Missing Destination", "Please enter a campus building or destination.");
    }

    setIsSubmittingBooking(true);
    try {
      let freshLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const freshCoords = {
        latitude: freshLocation.coords.latitude,
        longitude: freshLocation.coords.longitude,
      };
      setCurrentLocation(freshCoords);

      const pickupCoordsArray = [freshCoords.longitude, freshCoords.latitude];
      const dropoffCoordsArray = destinationCoords || [-0.1852, 5.6595];

      const payload = {
        pickup: {
          name: pickupLocation,
          coordinates: pickupCoordsArray
        },
        dropoff: {
          name: destination,
          coordinates: dropoffCoordsArray
        },
        rideMode: rideType === 'shared' ? 'shared' : 'solo',
        notes: selectedRide ? `Preferred Driver: ${selectedRide.fullName || selectedRide.name}` : ''
      };

      const response = await api.post('/bookings', payload);

      setIsSubmittingBooking(false);
      if (response.data?.success) {
        setActiveBookingId(response.data.data?._id);
        setCountdown(30);
        setStep('waiting-countdown');
      }
    } catch (err) {
      setIsSubmittingBooking(false);
      Alert.alert("Booking Failed", err.response?.data?.error?.message || err.message || "Could not connect to server.");
    }
  };

  const filteredRides = rides.filter((item) => {
    const name = item.fullName || item.name || '';
    const loc = item.currentLocationName || item.zone || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           loc.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

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
          {step === 'request-form' && 'Request Specific Driver'}
          {step === 'waiting-countdown' && 'Waiting for Driver Response'}
        </Text>

        <TouchableOpacity 
          style={styles.avatarRing} 
          onPress={() => setActiveTab('profile')} 
          activeOpacity={0.7}
        >
          <Image 
            source={{ uri: userProfile?.avatarUri || userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' }} 
            style={styles.avatarImg} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsCompass={false}
            showsMyLocationButton={false}
            showsUserLocation={true}
          >
            {rides.map((driver) => {
              const lat = driver.lat || driver.currentLatitude || driver.currentLocation?.coordinates?.[1];
              const lng = driver.lng || driver.currentLongitude || driver.currentLocation?.coordinates?.[0];

              if (!lat || !lng) return null;

              return (
                <Marker 
                  key={driver._id || driver.driverId || driver.id} 
                  coordinate={{ latitude: Number(lat), longitude: Number(lng) }}
                  onPress={() => {
                    setSelectedRide(driver);
                    setStep('details');
                  }}
                >
                  <View style={styles.carMarkerWrap}>
                    <FontAwesome5 name="car" size={14} color="#FFFFFF" />
                  </View>
                </Marker>
              );
            })}
          </MapView>

          <View style={styles.gpsPill}>
            <Ionicons name="location" size={14} color={BLUE} />
            <Text style={styles.gpsPillText} numberOfLines={1}>
              {isLocating ? 'Detecting Campus GPS...' : pickupLocation}
            </Text>
          </View>
        </View>

        {step === 'list' && (
          <View style={styles.contentPad}>
            
            <View style={styles.searchBarWrap}>
              <Ionicons name="search" size={18} color={MUTED} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search drivers or campus zones..."
                placeholderTextColor={MUTED}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity 
              style={styles.broadcastBanner}
              activeOpacity={0.85}
              onPress={() => setActiveTab('rides')}
            >
              <View style={styles.broadcastIconWrap}>
                <MaterialCommunityIcons name="broadcast" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.broadcastTitle}>Zone Hub: Instant Broadcast</Text>
                <Text style={styles.broadcastSub}>Broadcast ride to all online campus drivers</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BLUE} />
            </TouchableOpacity>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>ONLINE CAMPUS DRIVERS</Text>
              <Text style={styles.driverCountBadge}>{filteredRides.length} available</Text>
            </View>

            {loadingRides ? (
              <ActivityIndicator size="small" color={NAVY} style={{ marginTop: 24 }} />
            ) : filteredRides.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="car-outline" size={40} color={MUTED} />
                <Text style={styles.emptyTitle}>No Drivers Nearby</Text>
                <Text style={styles.emptySub}>
                  No active drivers online near your location right now. Check the Rides tab to broadcast a request to all zones.
                </Text>
              </View>
            ) : (
              filteredRides.map((driver) => (
                <TouchableOpacity 
                  key={driver._id || driver.driverId || driver.id} 
                  style={styles.driverCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedRide(driver);
                    setStep('details');
                  }}
                >
                  <View style={styles.driverAvatar}>
                    <FontAwesome5 name="user-alt" size={18} color={BLUE} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.driverName}>{driver.fullName || driver.name || 'Campus Driver'}</Text>
                    <Text style={styles.driverMeta}>
                      ★ {driver.ratingAverage || driver.rating || '5.0'} • {driver.vehicleModel || driver.vehicle?.model || 'Campus Fleet'} ({driver.vehicleLicensePlate || driver.vehicle?.licensePlate || 'N/A'})
                    </Text>
                    <Text style={styles.driverLocationSub}>
                      📍 {driver.currentLocationName || driver.zone || 'Campus Vicinity'}
                    </Text>
                  </View>
                  <View style={styles.etaBox}>
                    <Text style={styles.etaText}>{driver.eta || '3 min'}</Text>
                    <Text style={styles.seatsText}>{driver.availableSeats || 4} seats</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {step === 'details' && selectedRide && (
          <View style={styles.contentPad}>
            <View style={styles.detailsCard}>
              <View style={styles.detailsHeaderRow}>
                <View style={styles.largeDriverAvatar}>
                  <FontAwesome5 name="user-alt" size={32} color={BLUE} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.detailsName}>{selectedRide.fullName || selectedRide.name || 'Campus Driver'}</Text>
                  <Text style={styles.detailsMeta}>★ {selectedRide.ratingAverage || selectedRide.rating || '5.0'} Rating</Text>
                  <Text style={styles.detailsVehicle}>
                    {selectedRide.vehicleModel || selectedRide.vehicle?.model || 'Campus Sedan'} • {selectedRide.vehicleLicensePlate || selectedRide.vehicle?.licensePlate || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.specGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Estimated ETA</Text>
                  <Text style={styles.specVal}>{selectedRide.eta || '3-5 mins'}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Available Capacity</Text>
                  <Text style={styles.specVal}>{selectedRide.availableSeats || 4} Seats</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.primaryBtn} 
                activeOpacity={0.85}
                onPress={() => setStep('request-form')}
              >
                <Text style={styles.primaryBtnText}>REQUEST THIS DRIVER</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'request-form' && selectedRide && (
          <View style={styles.contentPad}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Book Ride with {selectedRide.fullName || selectedRide.name}</Text>
              
              <Text style={styles.fieldLabel}>PICKUP LOCATION</Text>
              <View style={styles.locationInputBox}>
                <Ionicons name="location" size={18} color={BLUE} />
                <Text style={styles.locationFixedText} numberOfLines={1}>{pickupLocation}</Text>
              </View>

              <Text style={styles.fieldLabel}>DESTINATION (CAMPUS POI / BUILDING)</Text>
              <View style={styles.inputBox}>
                <Ionicons name="flag" size={18} color={NAVY} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Balme Library, Pentagon Hostel..."
                  placeholderTextColor={MUTED}
                  value={destination}
                  onChangeText={handleDestinationChange}
                />
              </View>

              {poiSuggestions.length > 0 && (
                <View style={styles.poiSuggestionBox}>
                  {poiSuggestions.map((poi) => (
                    <TouchableOpacity
                      key={poi._id}
                      style={styles.poiRow}
                      onPress={() => selectPoiDestination(poi)}
                    >
                      <Ionicons name="business" size={16} color={BLUE} style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.poiNameText}>{poi.name}</Text>
                        <Text style={styles.poiZoneText}>{poi.campusZone} Zone • {poi.category}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.fieldLabel}>RIDE TYPE</Text>
              <View style={styles.rideTypeRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, rideType === 'shared' && styles.typeBtnActive]}
                  onPress={() => setRideType('shared')}
                >
                  <Ionicons name="people" size={18} color={rideType === 'shared' ? BLUE : MUTED} />
                  <Text style={[styles.typeBtnText, rideType === 'shared' && styles.typeBtnTextActive]}>Shared Ride</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, rideType === 'solo' && styles.typeBtnActive]}
                  onPress={() => setRideType('solo')}
                >
                  <Ionicons name="person" size={18} color={rideType === 'solo' ? BLUE : MUTED} />
                  <Text style={[styles.typeBtnText, rideType === 'solo' && styles.typeBtnTextActive]}>Solo Ride</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.primaryBtn, isSubmittingBooking && { opacity: 0.7 }]} 
                activeOpacity={0.85}
                onPress={handleConfirmSpecificDriverRequest}
                disabled={isSubmittingBooking}
              >
                {isSubmittingBooking ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>CONFIRM & DISPATCH</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'waiting-countdown' && (
          <View style={styles.contentPad}>
            <View style={styles.countdownCard}>
              <View style={styles.countdownRing}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.countdownSecondsLabel}>sec</Text>
              </View>
              <Text style={styles.countdownTitle}>Waiting for Driver Confirmation</Text>
              <Text style={styles.countdownSub}>
                Your request has been dispatched directly to {selectedRide?.fullName || selectedRide?.name}.
              </Text>
              
              <ActivityIndicator size="small" color={BLUE} style={{ marginVertical: 16 }} />

              <TouchableOpacity 
                style={styles.cancelBtn} 
                activeOpacity={0.85}
                onPress={async () => {
                  if (activeBookingId) {
                    try {
                      await api.post(`/bookings/${activeBookingId}/cancel`, { reason: 'Passenger cancelled waiting' });
                    } catch (e) {}
                  }
                  setStep('list');
                  setSelectedRide(null);
                  setCountdown(30);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Unified Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home" size={22} color={NAVY} />} label="Home" active={true} onPress={() => {}} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={MUTED} />} label="Rides" onPress={() => setActiveTab('rides')} />
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
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  brand: { fontSize: 20, fontWeight: '800', color: NAVY, letterSpacing: -0.5 },
  headerTitleCenter: { fontSize: 16, fontWeight: '700', color: TEXT },
  backButton: { padding: 4 },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: BLUE,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },

  mapContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  map: { width: '100%', height: '100%' },
  carMarkerWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gpsPill: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 3,
  },
  gpsPillText: { fontSize: 13, fontWeight: '600', color: TEXT, marginLeft: 8, flex: 1 },

  contentPad: { padding: 16 },
  searchBarWrap: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT },

  broadcastBanner: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  broadcastIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  broadcastSub: { fontSize: 12, color: MUTED, marginTop: 2 },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: MUTED, letterSpacing: 0.5 },
  driverCountBadge: { fontSize: 12, fontWeight: '700', color: BLUE },

  driverCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: TAB_ACTIVE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: { fontSize: 15, fontWeight: '700', color: TEXT },
  driverMeta: { fontSize: 12, color: MUTED, marginTop: 2 },
  driverLocationSub: { fontSize: 11, color: BLUE, marginTop: 4, fontWeight: '500' },
  etaBox: { alignItems: 'flex-end' },
  etaText: { fontSize: 14, fontWeight: '800', color: NAVY },
  seatsText: { fontSize: 11, color: MUTED, marginTop: 2 },

  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginTop: 12 },
  emptySub: { fontSize: 13, color: MUTED, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  detailsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
  },
  detailsHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  largeDriverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TAB_ACTIVE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsName: { fontSize: 18, fontWeight: '800', color: TEXT },
  detailsMeta: { fontSize: 13, color: '#F59E0B', fontWeight: '700', marginTop: 2 },
  detailsVehicle: { fontSize: 13, color: MUTED, marginTop: 2 },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 18 },
  specGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  specItem: { alignItems: 'center' },
  specLabel: { fontSize: 12, color: MUTED, fontWeight: '600' },
  specVal: { fontSize: 16, fontWeight: '800', color: NAVY, marginTop: 4 },

  formCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
  },
  formTitle: { fontSize: 17, fontWeight: '800', color: TEXT, marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.5, marginBottom: 6 },
  locationInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PILL_BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
  },
  locationFixedText: { fontSize: 13, color: TEXT, fontWeight: '600', marginLeft: 8, flex: 1 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  textInput: { flex: 1, fontSize: 14, color: TEXT },
  poiSuggestionBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    marginTop: -10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  poiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  poiNameText: { fontSize: 13, fontWeight: '700', color: TEXT },
  poiZoneText: { fontSize: 11, color: MUTED, marginTop: 1 },

  rideTypeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PILL_BG,
    gap: 8,
  },
  typeBtnActive: {
    borderColor: BLUE,
    backgroundColor: TAB_ACTIVE_BG,
  },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: MUTED },
  typeBtnTextActive: { color: BLUE, fontWeight: '700' },

  primaryBtn: {
    backgroundColor: NAVY,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },

  countdownCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    alignItems: 'center',
  },
  countdownRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  countdownNumber: { fontSize: 32, fontWeight: '900', color: NAVY },
  countdownSecondsLabel: { fontSize: 11, fontWeight: '700', color: MUTED, marginTop: -4 },
  countdownTitle: { fontSize: 17, fontWeight: '800', color: TEXT, textAlign: 'center' },
  countdownSub: { fontSize: 13, color: MUTED, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },

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
