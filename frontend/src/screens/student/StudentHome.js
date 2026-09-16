// StudentHome.js
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import api from '../../api/axios';

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

const SOCKET_SERVER_URL = 'https://c5m62bwc-5000.uks1.devtunnels.ms';
const API_BASE_URL = `${SOCKET_SERVER_URL}/api/v1`;

export default function StudentHome({ onLogout }) {
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
  const [rideType, setRideType] = useState('shared');

  const [countdown, setCountdown] = useState(30);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const mapRef = useRef(null);
  const socketRef = useRef(null);

  const getStoredToken = async () => {
    let rawToken = await AsyncStorage.getItem('token') || 
                   await AsyncStorage.getItem('user_token') || 
                   await AsyncStorage.getItem('passenger_token') || 
                   await AsyncStorage.getItem('auth_token');
                   
    if (!rawToken) return null;
    
    let cleanToken = rawToken.replace(/^["']|["']$/g, '').trim();
    if (cleanToken.toLowerCase().startsWith('bearer ')) {
      cleanToken = cleanToken.substring(7).trim();
    }
    return cleanToken;
  };

  useEffect(() => {
    initializePassengerLocation();
    fetchUserData();

    async function setupSocket() {
      const token = await getStoredToken();
      const cleanToken = token ? token.replace(/^["']|["']$/g, '').trim().replace(/^Bearer\s+/i, '') : null;

      socketRef.current = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        autoConnect: true,
        auth: {
          token: cleanToken ? `Bearer ${cleanToken}` : ''
        }
      });
      
      socketRef.current.on('connect', () => {
        console.log('[CampusRide Telemetry] Connected:', socketRef.current.id);
      });

      socketRef.current.onAny((eventName, acceptedRide) => {
        if (eventName.startsWith('rideAccepted_')) {
          console.log("🎉 Ride Accepted by driver event received:", acceptedRide);
          Alert.alert("Ride Accepted!", "Your driver has accepted your request. Heading to pickup!");
          setStep('list');
          setSelectedRide(null);
          setCountdown(30);
        }
      });

      socketRef.current.on('driverLocationUpdate', (updatedDriver) => {
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
      });

      socketRef.current.on('driverWentOffline', ({ driverId }) => {
        setRides((prevRides) => prevRides.filter(r => (r._id || r.driverId || r.id) !== driverId));
      });
    }

    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // 🔑 Dynamic Global & Passenger-Specific Acceptance/Decline Listeners
  useEffect(() => {
    if (!socketRef.current) return;

    const handleRideAccepted = (acceptedRide) => {
      console.log("🎉 Ride Accepted by driver event received:", acceptedRide);
      if (step === 'waiting-countdown') {
        Alert.alert("Ride Accepted!", "Your driver has accepted your request. Heading to pickup!");
        setStep('list');
        setSelectedRide(null);
        setCountdown(30);
      }
    };

    const handleRideDeclined = () => {
      if (step === 'waiting-countdown') {
        Alert.alert("Request Declined", "The driver is unable to accept your ride at this moment. Please choose another driver.");
        setStep('list');
        setSelectedRide(null);
        setCountdown(30);
      }
    };

    socketRef.current.on('rideAccepted', handleRideAccepted);

    if (userProfile?._id) {
      const specificAcceptEvent = `rideAccepted_${userProfile._id}`;
      const specificDeclineEvent = `rideDeclined_${userProfile._id}`;
      
      socketRef.current.on(specificAcceptEvent, handleRideAccepted);
      socketRef.current.on(specificDeclineEvent, handleRideDeclined);

      return () => {
        socketRef.current.off('rideAccepted', handleRideAccepted);
        socketRef.current.off(specificAcceptEvent, handleRideAccepted);
        socketRef.current.off(specificDeclineEvent, handleRideDeclined);
      };
    }

    return () => {
      socketRef.current.off('rideAccepted', handleRideAccepted);
    };
  }, [userProfile, step]);

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
      const token = await getStoredToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const result = await response.json();
      if (response.ok && result.data?.user) {
        setUserProfile(result.data.user);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const fetchNearbyDrivers = async (lat, lng) => {
    try {
      setLoadingRides(true);
      const token = await getStoredToken();
      
      const response = await fetch(`${API_BASE_URL}/drivers/active-locations?lat=${lat}&lng=${lng}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });
      
      const result = await response.json();
      if (response.ok && Array.isArray(result.data)) {
        setRides(result.data);
      } else {
        setRides([]);
      }
    } catch (err) {
      console.error("Error fetching geo-filtered drivers:", err);
      setRides([]);
    } finally {
      setLoadingRides(false);
    }
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
        `${selectedRide?.fullName || selectedRide?.name || 'Driver'} did not respond in time. Please select another driver.`,
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
    if (!selectedRide) {
      return Alert.alert("No Driver Selected", "Please select a specific driver from the nearby list.");
    }

    setIsSubmittingBooking(true);
    try {
      // 🔑 CRITICAL: Force a fresh live GPS fix right when sending request
      let freshLocation = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });

      const freshCoords = {
        latitude: freshLocation.coords.latitude,
        longitude: freshLocation.coords.longitude,
      };

      setCurrentLocation(freshCoords);

      let freshAddress = pickupLocation;
      try {
        let reverseGeocode = await Location.reverseGeocodeAsync(freshCoords);
        if (reverseGeocode && reverseGeocode.length > 0) {
          const place = reverseGeocode[0];
          freshAddress = [place.name, place.street, place.district, place.city]
            .filter(Boolean)
            .join(', ');
        }
      } catch (geoErr) {
        console.log("Reverse geocode skip:", geoErr.message);
      }

      // MongoDB GeoJSON coordinate array [longitude, latitude]
      const pickupCoordsArray = [freshCoords.longitude, freshCoords.latitude];
      const dropoffCoordsArray = [-0.1852, 5.6595]; 

      const payload = {
        driverId: selectedRide._id || selectedRide.driverId || selectedRide.id,
        pickupLocation: freshAddress || pickupLocation,
        dropoffLocation: destination,  
        destination,                   
        rideMode: rideType,
        pickupCoordinates: pickupCoordsArray,   // 🔑 Sends freshly captured GPS lng, lat
        dropoffCoordinates: dropoffCoordsArray, 
      };

      console.log("Dispatching ride request payload with fresh GPS coordinates:", payload);

      const response = await api.post('/rides/request', payload);

      console.log("Ride request success response:", response.data);

      setIsSubmittingBooking(false);
      setCountdown(30);
      setStep('waiting-countdown');
    } catch (err) {
      console.error("Ride Request Error Details:", err.response?.data || err.message);
      setIsSubmittingBooking(false);
      Alert.alert("Request Failed", err.response?.data?.error?.message || err.message || "Could not connect to server.");
    }
  };

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
                  coordinate={{ latitude: lat, longitude: lng }}
                  onPress={() => {
                    setSelectedRide(driver);
                    setStep('details');
                  }}
                >
                  <View style={styles.fleetBubble}>
                    <FontAwesome5 name="car" size={12} color="#FFFFFF" />
                    <Text style={styles.fleetBubbleText}>Nearby</Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>

          {step === 'list' && (
            <View style={styles.searchBarContainer}>
              <Ionicons name="location-outline" size={20} color={BLUE} style={styles.searchPinIcon} />
              <TextInput 
                placeholder="Where are you going? (e.g. Main Gate)" 
                placeholderTextColor={MUTED} 
                style={styles.searchTextPlaceholder}
                value={destination}
                onChangeText={setDestination}
                onSubmitEditing={() => {
                  if (destination.trim()) {
                    setActiveTab('history');
                  } else {
                    Alert.alert("Enter Destination", "Please type your campus destination first.");
                  }
                }}
                returnKeyType="search"
              />
              <TouchableOpacity 
                style={styles.filterIconWrap}
                activeOpacity={0.7}
                onPress={() => {
                  if (destination.trim()) {
                    setActiveTab('history');
                  } else {
                    Alert.alert("Enter Destination", "Please type your campus destination first.");
                  }
                }}
              >
                <Ionicons name="arrow-forward" size={16} color={NAVY} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {step === 'list' && (
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandleBar} />

            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.sheetTitle}>Nearby Available Rides</Text>
                <View style={styles.locationSubtitleRow}>
                  <Ionicons name="navigate" size={12} color={BLUE} />
                  <Text style={styles.locationSubtitleText} numberOfLines={1}>
                    {isLocating ? "Detecting GPS location..." : pickupLocation}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.refreshGpsBtn}
                activeOpacity={0.7} 
                onPress={initializePassengerLocation}
              >
                <Ionicons name="reload" size={13} color={BLUE} />
                <Text style={styles.seeAllText}>Locate</Text>
              </TouchableOpacity>
            </View>

            {loadingRides || isLocating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={NAVY} />
                <Text style={styles.loadingText}>Scanning campus sectors near you...</Text>
              </View>
            ) : rides.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="car-off" size={40} color={MUTED} />
                <Text style={styles.emptyTitle}>No Rides Nearby</Text>
                <Text style={styles.emptySub}>
                  No active student drivers online near your location right now. Check the Rides tab to explore active drivers or broadcast a request.
                </Text>
                <TouchableOpacity 
                  style={styles.goToRidesTabBtn}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab('history')}
                >
                  <Text style={styles.goToRidesTabBtnText}>Go to Rides Screen</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.rideListScroll}>
                {rides
                  .filter(r => {
                    const name = r.fullName || r.name || '';
                    const vehicle = r.vehicleModel || '';
                    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           vehicle.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .map((r) => (
                    <TouchableOpacity 
                      key={r._id || r.driverId || r.id} 
                      style={styles.rideCard} 
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedRide(r);
                        setStep('details');
                      }}
                    >
                      <Image 
                        source={{ uri: r.avatarUri || r.avatarUrl || r.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' }} 
                        style={styles.driverAvatar} 
                      />
                      
                      <View style={styles.rideCardInfo}>
                        <View style={styles.driverRow}>
                          <Text style={styles.driverName}>{r.fullName || r.name}</Text>
                          <View style={[styles.timeBadge, { backgroundColor: GREEN_PILL }]}>
                            <Text style={[styles.timeBadgeText, { color: GREEN_TEXT }]}>
                              {r.eta || 'Nearby'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.rideMetaRow}>
                          <View style={styles.metaItem}>
                            <Ionicons name="car-outline" size={13} color={MUTED} />
                            <Text style={styles.metaText}>{r.vehicleModel || 'Campus Vehicle'}</Text>
                          </View>
                          <Text style={styles.metaDot}>•</Text>
                          <View style={styles.metaItem}>
                            <Ionicons name="shield-checkmark" size={13} color="#22C55E" />
                            <Text style={styles.metaText}>Verified</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>
        )}

        {step === 'details' && selectedRide && (
          <View style={styles.sheetStandalone}>
            <View style={styles.detailTopRow}>
              <View>
                <Text style={styles.estimatedArrivalLabel}>STATUS</Text>
                <Text style={styles.estimatedArrivalTime}>{selectedRide.eta || 'Ready on Campus'}</Text>
              </View>
              <View style={styles.seatsBadgeLarge}>
                <Ionicons name="shield-checkmark" size={14} color={NAVY} />
                <Text style={styles.seatsBadgeTextLarge}>Verified Driver</Text>
              </View>
            </View>

            <View style={styles.driverProfileRow}>
              <View style={styles.driverAvatarContainer}>
                <Image 
                  source={{ uri: selectedRide.avatarUri || selectedRide.avatarUrl || selectedRide.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' }} 
                  style={{ width: 60, height: 60, borderRadius: 30 }} 
                />
                <View style={styles.verifiedDot} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.driverNameText}>{selectedRide.fullName || selectedRide.name}</Text>
                <Text style={styles.driverMetaText}>
                  Phone: {selectedRide.phoneNumber || 'Encrypted'}
                </Text>
              </View>
            </View>

            <View style={styles.vehicleCardBox}>
              <View style={styles.carIconWrap}>
                <MaterialCommunityIcons name="car" size={24} color={NAVY} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.vehicleModelText}>{selectedRide.vehicleModel || 'Campus Vehicle'}</Text>
                <Text style={styles.vehicleTypeText}>{selectedRide.vehicleType || 'Standard Fleet'}</Text>
              </View>
              <View style={styles.licensePlatePill}>
                <Text style={styles.licensePlateText}>{selectedRide.vehicleLicensePlate || 'N/A'}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.requestRideBtn} 
              activeOpacity={0.85}
              onPress={() => setStep('request-form')}
            >
              <Text style={styles.requestRideBtnText}>Request Ride from {selectedRide.fullName || selectedRide.name}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'request-form' && (
          <View style={styles.formContainer}>
            <View style={styles.locationCard}>
              <View style={styles.locRow}>
                <View style={styles.originDot} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.locLabel}>PICKUP LOCATION</Text>
                  <TextInput
                    style={styles.locInputInline}
                    value={pickupLocation}
                    onChangeText={setPickupLocation}
                    placeholder="Current GPS Location"
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
                    placeholder="Enter campus building or landmark"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
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
                <Text style={styles.rideTypeDesc}>Split transit with fellow campus riders</Text>
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
                <Text style={styles.rideTypeDesc}>Direct uninterrupted transit</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.confirmRideBtn, isSubmittingBooking && { opacity: 0.7 }]} 
              activeOpacity={0.85}
              onPress={handleConfirmSpecificDriverRequest}
              disabled={isSubmittingBooking}
            >
              {isSubmittingBooking ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmRideBtnText}>SEND REQUEST TO {selectedRide?.fullName?.toUpperCase() || 'DRIVER'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'waiting-countdown' && (
          <View style={styles.waitingContainer}>
            <View style={styles.radarCard}>
              <View style={styles.timerRing}>
                <Text style={styles.timerText}>{countdown}s</Text>
              </View>
              <Text style={styles.waitingTitle}>Waiting for {selectedRide?.fullName || selectedRide?.name} to Accept...</Text>
              <Text style={styles.waitingSub}>
                Your request for a {rideType} ride to {destination} is pending driver confirmation.
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
  safe: { 
    flex: 1, 
    backgroundColor: SCREEN_BG 
  },
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
  brand: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: NAVY, 
    letterSpacing: -0.3 
  },
  headerTitleCenter: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: TEXT 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
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
  avatarImg: { 
    width: '100%', 
    height: '100%' 
  },
  mapContainer: { 
    height: 380, 
    position: 'relative' 
  },
  map: { 
    ...StyleSheet.absoluteFillObject 
  },
  fleetBubble: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    fontWeight: '800' 
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
  searchPinIcon: { 
    marginRight: 10 
  },
  searchTextPlaceholder: { 
    flex: 1, 
    fontSize: 15, 
    color: TEXT, 
    fontWeight: '500' 
  },
  filterIconWrap: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: PILL_BG, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  bottomSheet: {
    backgroundColor: CARD_BG,
    marginTop: -24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sheetHandleBar: { 
    width: 40, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: '#CBD5E1', 
    alignSelf: 'center', 
    marginBottom: 16 
  },
  sheetHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 16 
  },
  sheetTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: TEXT 
  },
  locationSubtitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginTop: 2 
  },
  locationSubtitleText: { 
    fontSize: 12, 
    color: MUTED, 
    fontWeight: '600', 
    maxWidth: 220 
  },
  refreshGpsBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: TAB_ACTIVE_BG, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 14 
  },
  seeAllText: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: BLUE 
  },
  loadingContainer: { 
    paddingVertical: 30, 
    alignItems: 'center', 
    gap: 10 
  },
  loadingText: { 
    fontSize: 13, 
    color: MUTED, 
    fontWeight: '600', 
    textAlign: 'center', 
    paddingHorizontal: 20 
  },
  emptyContainer: { 
    paddingVertical: 36, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: TEXT, 
    marginTop: 8 
  },
  emptySub: { 
    fontSize: 13, 
    color: MUTED, 
    textAlign: 'center', 
    marginTop: 4, 
    paddingHorizontal: 20, 
    lineHeight: 18 
  },
  goToRidesTabBtn: {
    marginTop: 14,
    backgroundColor: TAB_ACTIVE_BG,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  goToRidesTabBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: BLUE,
  },
  rideListScroll: { 
    gap: 12 
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  driverAvatar: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: '#E2E8F0' 
  },
  rideCardInfo: { 
    flex: 1, 
    marginLeft: 14 
  },
  driverRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 4 
  },
  driverName: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: TEXT 
  },
  timeBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 8 
  },
  timeBadgeText: { 
    fontSize: 11, 
    fontWeight: '800' 
  },
  rideMetaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  metaItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  metaText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: MUTED 
  },
  metaDot: { 
    color: MUTED, 
    fontSize: 12 
  },
  sheetStandalone: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28 
  },
  detailTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 18 
  },
  estimatedArrivalLabel: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: MUTED, 
    letterSpacing: 0.5 
  },
  estimatedArrivalTime: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: NAVY, 
    marginTop: 2 
  },
  seatsBadgeLarge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: LIME, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12 
  },
  seatsBadgeTextLarge: { 
    color: NAVY, 
    fontWeight: '700', 
    marginLeft: 6, 
    fontSize: 13 
  },
  driverProfileRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  driverAvatarContainer: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#E6EFFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative', 
    overflow: 'hidden' 
  },
  verifiedDot: { 
    position: 'absolute', 
    bottom: 2, 
    right: 2, 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: '#22C55E', 
    borderWidth: 2, 
    borderColor: '#fff' 
  },
  driverNameText: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: TEXT 
  },
  driverMetaText: { 
    fontSize: 13, 
    color: MUTED, 
    marginTop: 3, 
    fontWeight: '600' 
  },
  vehicleCardBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  carIconWrap: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#E2E8F0', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  vehicleModelText: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: TEXT 
  },
  vehicleTypeText: { 
    fontSize: 13, 
    color: MUTED, 
    marginTop: 2 
  },
  licensePlatePill: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#CBD5E1' 
  },
  licensePlateText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: TEXT, 
    letterSpacing: 0.5 
  },
  requestRideBtn: { 
    backgroundColor: NAVY, 
    borderRadius: 16, 
    height: 56, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 6, 
    elevation: 3 
  },
  requestRideBtnText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '800' 
  },
  formContainer: { 
    padding: 16 
  },
  locationCard: { 
    backgroundColor: CARD_BG, 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: BORDER, 
    marginBottom: 16 
  },
  locRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  originDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: BLUE, 
    marginLeft: 3 
  },
  connectingLine: { 
    width: 2, 
    height: 20, 
    backgroundColor: '#E2E8F0', 
    marginLeft: 7, 
    marginVertical: 4 
  },
  locLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: MUTED, 
    letterSpacing: 0.5 
  },
  locInputInline: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: TEXT, 
    marginTop: 2, 
    height: 30, 
    padding: 0 
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: MUTED, 
    letterSpacing: 0.8, 
    marginBottom: 12 
  },
  rideTypeCard: { 
    backgroundColor: CARD_BG, 
    borderRadius: 16, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: BORDER, 
    marginBottom: 12 
  },
  rideTypeCardActive: { 
    borderColor: BLUE, 
    backgroundColor: '#F8FAFC' 
  },
  rideTypeIconWrap: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: TAB_ACTIVE_BG, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  rideTypeName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: TEXT 
  },
  rideTypeDesc: { 
    fontSize: 13, 
    color: MUTED, 
    marginTop: 2 
  },
  popularBadge: { 
    backgroundColor: LIME, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6 
  },
  popularBadgeText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: NAVY 
  },
  confirmRideBtn: { 
    backgroundColor: NAVY, 
    height: 56, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 12, 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    elevation: 4 
  },
  confirmRideBtnText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '800', 
    letterSpacing: 0.5 
  },
  waitingContainer: { 
    padding: 16, 
    alignItems: 'center' 
  },
  radarCard: { 
    backgroundColor: CARD_BG, 
    borderRadius: 20, 
    padding: 24, 
    width: '100%', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: BORDER, 
    marginVertical: 16 
  },
  timerRing: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: TAB_ACTIVE_BG, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16, 
    borderWidth: 3, 
    borderColor: BLUE 
  },
  timerText: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: NAVY 
  },
  waitingTitle: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: TEXT, 
    marginBottom: 6, 
    textAlign: 'center' 
  },
  waitingSub: { 
    fontSize: 13, 
    color: MUTED, 
    textAlign: 'center', 
    lineHeight: 18 
  },
  cancelRequestBtn: { 
    backgroundColor: '#EF4444', 
    height: 56, 
    borderRadius: 16, 
    width: '100%', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    elevation: 4 
  },
  cancelRequestBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '800' 
  },
  tabBar: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    paddingTop: 8, 
    paddingBottom: Platform.OS === 'ios' ? 24 : 12, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 10, 
    elevation: 10 
  },
  tabItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  tabIconWrap: { 
    paddingHorizontal: 20, 
    paddingVertical: 6, 
    borderRadius: 16 
  },
  tabIconWrapActive: { 
    backgroundColor: TAB_ACTIVE_BG 
  },
  tabLabel: { 
    fontSize: 12, 
    color: MUTED, 
    marginTop: 2 
  },
  tabLabelActive: { 
    color: NAVY, 
    fontWeight: '700' 
  },
});