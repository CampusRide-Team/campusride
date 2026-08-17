// RideBooking.js
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
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { io } from 'socket.io-client';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#8A8FA3';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const TAB_ACTIVE_BG = '#EEF2FF';
const BORDER = '#E2E8F0';
const GREEN_TEXT = '#16a34a';

const SOCKET_SERVER_URL = 'https://c5m62bwc-5000.uks1.devtunnels.ms';
const API_BASE_URL = `${SOCKET_SERVER_URL}/api/v1`;

export default function RideBooking({ onNavigate, initialDestination }) {
  const [activeSubTab, setActiveSubTab] = useState('zone'); // Zone Hub default view
  const [rideStep, setRideStep] = useState('hub');
  
  // Schedule state with Clock/Alarm Picker integration
  const [schedulePickup, setSchedulePickup] = useState('Detecting current GPS...');
  const [scheduleDestination, setScheduleDestination] = useState('');
  const [scheduleRideType, setScheduleRideType] = useState('shared');
  
  const [scheduledTime, setScheduledTime] = useState(new Date(Date.now() + 45 * 60000));
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [scheduledRides, setScheduledRides] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  // Zone Hub broadcast state
  const [currentLocation, setCurrentLocation] = useState({ latitude: 5.6037, longitude: -0.1870 });
  const [zonePickup, setZonePickup] = useState('Detecting current GPS...');
  const [zoneDestination, setZoneDestination] = useState(initialDestination || '');
  const [zoneRideType, setZoneRideType] = useState('shared');
  const [passengerNotes, setPassengerNotes] = useState('');
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);
  const [activeRideId, setActiveRideId] = useState(null);

  // Accepted driver state & telemetry
  const [acceptedDriver, setAcceptedDriver] = useState(null);

  // Review & Rating state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const mapRef = useRef(null);
  const socketRef = useRef(null);

  const getStoredToken = async () => {
    return await AsyncStorage.getItem('token') || await AsyncStorage.getItem('user_token');
  };

  useEffect(() => {
    if (initialDestination) {
      setZoneDestination(initialDestination);
      setActiveSubTab('zone');
    }
  }, [initialDestination]);

  useEffect(() => {
    initializePassengerLocation();
    fetchScheduledRides();

    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current.on('connect', () => {
      console.log('[RideBooking Telemetry] Socket connected:', socketRef.current.id);
    });

    // Listen for live driver acceptance of zone broadcast
    socketRef.current.on('rideAccepted', (rideData) => {
      if (rideData && rideData.driver) {
        setAcceptedDriver({
          id: rideData.driver._id || rideData.driver.id,
          name: rideData.driver.fullName || rideData.driver.name,
          rating: rideData.driver.rating || '4.9',
          totalRides: rideData.driver.totalRides || '1,000+ rides',
          vehicleModel: rideData.driver.vehicleModel || 'Campus Fleet Vehicle',
          licensePlate: rideData.driver.vehicleLicensePlate || 'N/A',
          phoneNumber: rideData.driver.phoneNumber,
          eta: '3 mins away',
          latitude: rideData.driver.currentLocation?.coordinates?.[1],
          longitude: rideData.driver.currentLocation?.coordinates?.[0],
        });
        setRideStep('driver-found');
      }
    });

    // Listen for live 15-minute search window timeout/expiration
    socketRef.current.on('passenger:ride-timeout', (data) => {
      if (rideStep === 'searching') {
        setRideStep('hub');
        Alert.alert(
          "Ride Search Timed Out",
          data.message || "No drivers accepted your ride within the 15-minute window. Would you like to reschedule or try private dispatch?",
          [
            { text: "Try Private Dispatch", onPress: () => { setZoneRideType('private'); } },
            { text: "Reschedule", onPress: () => setActiveSubTab('schedule') },
            { text: "OK", style: "cancel" }
          ]
        );
      }
    });

    // Listen for live driver GPS telemetry updates
    socketRef.current.on('driverLocationUpdate', (telemetry) => {
      if (acceptedDriver && (telemetry.id === acceptedDriver.id || telemetry._id === acceptedDriver.id)) {
        setAcceptedDriver(prev => ({
          ...prev,
          latitude: telemetry.latitude || telemetry.currentLocation?.coordinates?.[1],
          longitude: telemetry.longitude || telemetry.currentLocation?.coordinates?.[0],
        }));
      }
    });

    // Listen for milestone updates during transit
    socketRef.current.on('tripStatusUpdate', ({ status }) => {
      if (status === 'arrived') setRideStep('arrived');
      if (status === 'in-progress') setRideStep('trip-active');
      if (status === 'completed') setRideStep('completed');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializePassengerLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setZonePickup('Campus Central Area');
        setSchedulePickup('Campus Central Area');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(coords);
      let reverseGeocode = await Location.reverseGeocodeAsync(coords);
      if (reverseGeocode && reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const formatted = [place.name, place.street, place.city].filter(Boolean).join(', ');
        setZonePickup(formatted);
        setSchedulePickup(formatted);
      } else {
        setZonePickup('Current GPS Location');
        setSchedulePickup('Current GPS Location');
      }
    } catch (error) {
      console.error("GPS Error:", error);
      setZonePickup('Current Campus Location');
      setSchedulePickup('Current Campus Location');
    }
  };

  const fetchScheduledRides = async () => {
    try {
      setLoadingSchedule(true);
      const token = await getStoredToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/rides/scheduled`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const result = await response.json();
      if (response.ok && Array.isArray(result.data)) {
        setScheduledRides(result.data);
      }
    } catch (err) {
      console.error("Error fetching schedules:", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setScheduledTime(selectedDate);
    }
  };

  const handleCreateSchedule = async () => {
    if (!scheduleDestination.trim()) {
      return Alert.alert("Missing Destination", "Please provide a destination for your scheduled ride.");
    }

    const now = new Date();
    const diffMinutes = Math.round((scheduledTime - now) / 60000);

    if (diffMinutes < 30) {
      return Alert.alert("Too Soon", "Scheduled rides must be set at least 30 minutes in advance. Use Zone Hub for instant matching.");
    }
    if (diffMinutes > 1440) {
      return Alert.alert("Out of Range", "Rides can only be scheduled up to 24 hours in advance.");
    }

    setIsSubmittingSchedule(true);
    try {
      const token = await getStoredToken();
      const response = await fetch(`${API_BASE_URL}/rides/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          pickup: schedulePickup,
          destination: scheduleDestination,
          rideType: scheduleRideType,
          scheduledTime: scheduledTime.toISOString(),
          scheduledMinutesFromNow: diffMinutes,
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Failed to schedule ride.');

      setIsSubmittingSchedule(false);
      Alert.alert("Ride Scheduled!", `Your ride is locked in for ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
      setScheduleDestination('');
      fetchScheduledRides();
    } catch (err) {
      setIsSubmittingSchedule(false);
      Alert.alert("Schedule Error", err.message || "Could not complete scheduled booking.");
    }
  };

  const handleCancelScheduledRide = async (rideId) => {
    Alert.alert(
      "Cancel Scheduled Ride",
      "Are you sure you want to cancel this scheduled ride?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getStoredToken();
              const response = await fetch(`${API_BASE_URL}/rides/scheduled/${rideId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (response.ok) {
                Alert.alert("Cancelled", "Your scheduled ride has been successfully deleted.");
                fetchScheduledRides();
              } else {
                Alert.alert("Error", "Could not cancel scheduled ride.");
              }
            } catch (err) {
              console.error("Cancel Error:", err);
            }
          }
        }
      ]
    );
  };

  const handleStartZoneSearch = async () => {
    if (!zoneDestination.trim()) {
      return Alert.alert("Destination Required", "Please enter your campus destination.");
    }

    setIsSubmittingBroadcast(true);
    try {
      const token = await getStoredToken();
      
      const response = await fetch(`${API_BASE_URL}/rides/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          pickup: zonePickup,
          destination: zoneDestination,
          rideType: zoneRideType,
          notes: passengerNotes,
          coordinates: [currentLocation.longitude, currentLocation.latitude]
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Failed to broadcast ride.');

      setActiveRideId(result.data?.rideId || result.data?._id);
      setIsSubmittingBroadcast(false);
      setRideStep('searching');
    } catch (err) {
      console.error("Broadcast Error:", err.message);
      setIsSubmittingBroadcast(false);
      Alert.alert("Broadcast Error", err.message);
    }
  };

  const handleCancelBroadcast = () => {
    Alert.alert(
      "Cancel Broadcast",
      "Are you sure you want to stop broadcasting to zone drivers?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              if (activeRideId) {
                const token = await getStoredToken();
                await fetch(`${API_BASE_URL}/rides/${activeRideId}/cancel`, {
                  method: 'POST',
                  headers: { 'Authorization': token ? `Bearer ${token}` : '' }
                });
              }
            } catch (err) {
              console.error("Cancel Error:", err);
            } finally {
              setRideStep('hub');
              setActiveRideId(null);
            }
          }
        }
      ]
    );
  };

  const handleCallDriver = () => {
    if (acceptedDriver?.phoneNumber) {
      Linking.openURL(`tel:${acceptedDriver.phoneNumber}`);
    } else {
      Alert.alert("Call Driver", `Connecting securely with ${acceptedDriver?.name}...`);
    }
  };

  const handleTextDriver = () => {
    Alert.alert("Secure Chat", `Opening messaging channel with ${acceptedDriver?.name}.`);
  };

  const handleSubmitReview = async () => {
    setIsSubmittingReview(true);
    try {
      const token = await getStoredToken();
      await fetch(`${API_BASE_URL}/rides/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          driverId: acceptedDriver?.id,
          rating,
          comment
        })
      });
      setIsSubmittingReview(false);
      Alert.alert("Thank you!", "Your feedback has been successfully saved.");
      setRideStep('hub');
      setActiveSubTab('zone');
      setAcceptedDriver(null);
    } catch (err) {
      setIsSubmittingReview(false);
      setRideStep('hub');
      setActiveSubTab('zone');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>
          {rideStep === 'hub' && (activeSubTab === 'schedule' ? 'Schedule a Ride' : 'Zone Hub')}
          {rideStep === 'searching' && 'Broadcasting to Drivers'}
          {rideStep === 'driver-found' && 'Driver Found!'}
          {rideStep === 'en-route' && 'Driver En Route'}
          {rideStep === 'arrived' && 'Driver Has Arrived'}
          {rideStep === 'trip-active' && 'Active Trip'}
          {rideStep === 'completed' && 'Trip Completed'}
        </Text>
      </View>

      {rideStep === 'hub' && (
        <View style={styles.subTabRow}>
          <TouchableOpacity 
            style={[styles.subTabBtn, activeSubTab === 'schedule' && styles.subTabBtnActive]}
            onPress={() => setActiveSubTab('schedule')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'schedule' && styles.subTabTextActive]}>Schedule Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.subTabBtn, activeSubTab === 'zone' && styles.subTabBtnActive]}
            onPress={() => setActiveSubTab('zone')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'zone' && styles.subTabTextActive]}>Zone Hub</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* ================= SCHEDULE TAB ================= */}
        {rideStep === 'hub' && activeSubTab === 'schedule' && (
          <View>
            <Text style={styles.sectionHeader}>BOOK A SCHEDULED RIDE</Text>
            
            <View style={styles.locationCard}>
              <View style={styles.locRow}>
                <View style={styles.originDot} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.locLabel}>PICKUP LOCATION (GPS)</Text>
                  <TextInput
                    style={styles.locInputInline}
                    value={schedulePickup}
                    onChangeText={setSchedulePickup}
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
                    value={scheduleDestination}
                    onChangeText={setScheduleDestination}
                    placeholder="Enter campus building"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            <Text style={styles.sectionHeader}>SELECT RIDE TYPE</Text>
            <View style={styles.rideTypeRow}>
              <TouchableOpacity 
                style={[styles.typeCard, scheduleRideType === 'shared' && styles.typeCardActive]}
                onPress={() => setScheduleRideType('shared')}
                activeOpacity={0.8}
              >
                <Ionicons name="people" size={20} color={scheduleRideType === 'shared' ? BLUE : MUTED} />
                <Text style={[styles.typeTitle, scheduleRideType === 'shared' && styles.typeTitleActive]}>Shared</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.typeCard, scheduleRideType === 'private' && styles.typeCardActive]}
                onPress={() => setScheduleRideType('private')}
                activeOpacity={0.8}
              >
                <Ionicons name="person" size={20} color={scheduleRideType === 'private' ? BLUE : MUTED} />
                <Text style={[styles.typeTitle, scheduleRideType === 'private' && styles.typeTitleActive]}>Private</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>PICKUP TIME (ALARM SELECTOR)</Text>
            <TouchableOpacity 
              style={styles.alarmPickerButton}
              activeOpacity={0.8}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={BLUE} />
              <Text style={styles.alarmPickerText}>
                {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({scheduledTime.toLocaleDateString()})
              </Text>
              <Text style={styles.changeAlarmLabel}>Change</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={scheduledTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}

            <TouchableOpacity 
              style={[styles.primaryButton, isSubmittingSchedule && { opacity: 0.7 }]} 
              activeOpacity={0.85} 
              onPress={handleCreateSchedule}
              disabled={isSubmittingSchedule}
            >
              {isSubmittingSchedule ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Lock In Schedule</Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.sectionHeader, { marginTop: 24 }]}>YOUR SCHEDULED RIDES</Text>
            {loadingSchedule ? (
              <ActivityIndicator size="small" color={NAVY} style={{ marginTop: 16 }} />
            ) : scheduledRides.length === 0 ? (
              <Text style={styles.emptyText}>No scheduled rides found.</Text>
            ) : (
              scheduledRides.map((ride) => (
                <View key={ride.id || ride._id} style={styles.historyCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDest}>{ride.dropoffLocation || ride.destination}</Text>
                    <Text style={styles.historySub}>{ride.pickupLocation || ride.pickup} • {ride.rideMode}</Text>
                    <Text style={styles.historyTime}>
                      {ride.scheduledTime ? new Date(ride.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Scheduled'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Scheduled</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleCancelScheduledRide(ride.id || ride._id)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= ZONE HUB TAB ================= */}
        {rideStep === 'hub' && activeSubTab === 'zone' && (
          <View>
            <View style={styles.zoneBannerCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.zoneLabel}>ZONE HUB: LIVE BROADCAST</Text>
                <Text style={styles.zoneSub}>Instantly ping all online drivers in your campus sector</Text>
              </View>
              <View style={styles.liveIndicatorBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.liveText}>READY</Text>
              </View>
            </View>

            <View style={styles.locationCard}>
              <View style={styles.locRow}>
                <Ionicons name="locate" size={18} color={BLUE} style={{ marginLeft: -1 }} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.locLabel}>CURRENT LOCATION (GPS)</Text>
                  <TextInput
                    style={styles.locInputInline}
                    value={zonePickup}
                    onChangeText={setZonePickup}
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
                    value={zoneDestination}
                    onChangeText={setZoneDestination}
                    placeholder="Where are you going? (e.g. Main Gate)"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            <Text style={styles.sectionHeader}>SELECT RIDE TYPE</Text>
            <View style={styles.rideTypeRow}>
              <TouchableOpacity 
                style={[styles.typeCard, zoneRideType === 'shared' && styles.typeCardActive]}
                onPress={() => setZoneRideType('shared')}
                activeOpacity={0.8}
              >
                <Ionicons name="people" size={20} color={zoneRideType === 'shared' ? BLUE : MUTED} />
                <Text style={[styles.typeTitle, zoneRideType === 'shared' && styles.typeTitleActive]}>Shared</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.typeCard, zoneRideType === 'private' && styles.typeCardActive]}
                onPress={() => setZoneRideType('private')}
                activeOpacity={0.8}
              >
                <Ionicons name="person" size={20} color={zoneRideType === 'private' ? BLUE : MUTED} />
                <Text style={[styles.typeTitle, zoneRideType === 'private' && styles.typeTitleActive]}>Private</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>PASSENGER NOTES FOR DRIVER</Text>
            <TextInput
              style={styles.timeInput}
              value={passengerNotes}
              onChangeText={setPassengerNotes}
              placeholder="e.g. Wearing a red backpack by the gate"
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity 
              style={[styles.primaryButton, isSubmittingBroadcast && { opacity: 0.7 }]} 
              activeOpacity={0.85} 
              onPress={handleStartZoneSearch}
              disabled={isSubmittingBroadcast}
            >
              {isSubmittingBroadcast ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>BROADCAST TO ZONE DRIVERS</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ================= STEP 2: SEARCHING / BROADCASTING ================= */}
        {rideStep === 'searching' && (
          <View style={styles.searchingContainer}>
            <View style={styles.searchMapCard}>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                }}
                showsCompass={false}
                showsUserLocation={true}
              />
              <View style={styles.mapOverlayDark} />
              
              {/* Signal Wave Animation Wrapper */}
              <View style={styles.radarCenterWrapper}>
                <View style={styles.signalWaveRing3} />
                <View style={styles.signalWaveRing2} />
                <View style={styles.signalWaveRing1} />
                <View style={styles.radarCoreDot}>
                  <MaterialCommunityIcons name="car-wireless" size={22} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.searchStatusPill}>
                <View style={styles.greenDotPulse} />
                <Text style={styles.searchStatusPillText}>Broadcasting signal waves to zone drivers...</Text>
              </View>
            </View>

            <View style={styles.searchSummaryCard}>
              <View style={styles.summaryHeaderRow}>
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>{zoneRideType.toUpperCase()} RIDE</Text>
                </View>
                <Text style={styles.summaryEstTime}>Live Zone Search</Text>
              </View>

              <View style={styles.summaryRouteBox}>
                <View style={styles.summaryRouteItem}>
                  <View style={styles.originDot} />
                  <Text style={styles.summaryRouteText} numberOfLines={1}>{zonePickup}</Text>
                </View>
                <View style={styles.summaryConnectingLine} />
                <View style={styles.summaryRouteItem}>
                  <Ionicons name="flag" size={14} color={NAVY} />
                  <Text style={styles.summaryRouteText} numberOfLines={1}>{zoneDestination}</Text>
                </View>
              </View>

              {passengerNotes ? (
                <View style={styles.summaryNotesRow}>
                  <Ionicons name="document-text-outline" size={14} color={MUTED} />
                  <Text style={styles.summaryNotesText} numberOfLines={1}>Notes: {passengerNotes}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={styles.proCancelButton} activeOpacity={0.85} onPress={handleCancelBroadcast}>
              <Text style={styles.proCancelButtonText}>Cancel Broadcast</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= STEP 3: DRIVER FOUND ================= */}
        {rideStep === 'driver-found' && acceptedDriver && (
          <View style={styles.foundContainer}>
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={24} color={GREEN_TEXT} />
              <Text style={styles.successBannerText}>Driver Accepted Your Broadcast!</Text>
            </View>

            <View style={styles.mapCard}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={{
                  latitude: acceptedDriver.latitude || currentLocation.latitude,
                  longitude: acceptedDriver.longitude || currentLocation.longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                }}
              >
                {acceptedDriver.latitude && acceptedDriver.longitude && (
                  <Marker coordinate={{ latitude: acceptedDriver.latitude, longitude: acceptedDriver.longitude }}>
                    <View style={styles.fleetBubble}>
                      <FontAwesome5 name="car" size={12} color="#FFFFFF" />
                    </View>
                  </Marker>
                )}
              </MapView>
            </View>

            <Text style={styles.sectionTitle}>ACCEPTED DRIVER DETAILS</Text>

            <View style={styles.driverHighlightCard}>
              <View style={styles.driverProfileRow}>
                <View style={styles.avatarWrap}>
                  <FontAwesome5 name="user-alt" size={20} color={BLUE} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.driverName}>{acceptedDriver.name}</Text>
                  <Text style={styles.driverMeta}>★ {acceptedDriver.rating} • {acceptedDriver.vehicleModel} ({acceptedDriver.licensePlate})</Text>
                </View>
                <View style={styles.etaBadge}>
                  <Text style={styles.etaBadgeText}>{acceptedDriver.eta}</Text>
                </View>
              </View>

              <View style={styles.actionButtonRow}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCallDriver} activeOpacity={0.8}>
                  <Ionicons name="call-outline" size={18} color={NAVY} />
                  <Text style={styles.actionButtonText}>Call Driver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleTextDriver} activeOpacity={0.8}>
                  <Ionicons name="chatbubble-outline" size={18} color={NAVY} />
                  <Text style={styles.actionButtonText}>Text Driver</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={() => setRideStep('en-route')}>
                <Text style={styles.primaryButtonText}>TRACK ACCEPTED DRIVER</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 4: EN ROUTE TRACKING ================= */}
        {rideStep === 'en-route' && acceptedDriver && (
          <View style={styles.trackingContainer}>
            <View style={styles.mapCardLarge}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                region={{
                  latitude: acceptedDriver.latitude || currentLocation.latitude,
                  longitude: acceptedDriver.longitude || currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                {acceptedDriver.latitude && acceptedDriver.longitude && (
                  <Marker coordinate={{ latitude: acceptedDriver.latitude, longitude: acceptedDriver.longitude }}>
                    <View style={styles.fleetBubble}><FontAwesome5 name="car" size={12} color="#fff" /></View>
                  </Marker>
                )}
              </MapView>
              <View style={styles.floatingStatusPill}>
                <View style={styles.greenDot} />
                <Text style={styles.mapPillText}>Driver is en route to pickup point</Text>
              </View>
            </View>

            <View style={styles.sheetStandalone}>
              <View style={styles.driverProfileRow}>
                <View style={styles.avatarWrap}><FontAwesome5 name="user-alt" size={22} color={BLUE} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.driverName}>{acceptedDriver.name}</Text>
                  <Text style={styles.driverMeta}>{acceptedDriver.vehicleModel} • {acceptedDriver.licensePlate}</Text>
                </View>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={handleCallDriver}>
                  <Ionicons name="call-outline" size={18} color={NAVY} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 5: ARRIVED ================= */}
        {rideStep === 'arrived' && acceptedDriver && (
          <View style={styles.arrivedContainer}>
            <View style={styles.arrivedAlertBanner}>
              <Ionicons name="notifications" size={22} color={NAVY} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.arrivedTitle}>Your driver has arrived!</Text>
                <Text style={styles.arrivedSub}>Please board the vehicle at your pickup zone.</Text>
              </View>
            </View>

            <View style={styles.driverHighlightCard}>
              <View style={styles.driverProfileRow}>
                <View style={styles.avatarWrap}><FontAwesome5 name="user-alt" size={20} color={BLUE} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.driverName}>{acceptedDriver.name}</Text>
                  <Text style={styles.driverMeta}>Plate: {acceptedDriver.licensePlate}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={() => setRideStep('trip-active')}>
                <Text style={styles.primaryButtonText}>I HAVE BOARDED • START TRIP</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 6: TRIP ACTIVE ================= */}
        {rideStep === 'trip-active' && (
          <View style={styles.trackingContainer}>
            <View style={styles.mapCardLarge}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
              />
              <View style={styles.floatingStatusPill}>
                <View style={styles.greenDot} />
                <Text style={styles.mapPillText}>Tracking active trip to {zoneDestination}</Text>
              </View>
            </View>

            <View style={styles.sheetStandalone}>
              <Text style={styles.sectionTitle}>ACTIVE TRIP IN PROGRESS</Text>
              <Text style={styles.tripDestText}>Destination: {zoneDestination}</Text>
            </View>
          </View>
        )}

        {/* ================= STEP 7: COMPLETED ================= */}
        {rideStep === 'completed' && acceptedDriver && (
          <View style={styles.completedContainer}>
            <View style={styles.successCheckWrap}><Ionicons name="checkmark" size={32} color="#fff" /></View>
            <Text style={styles.completedTitle}>Ride Completed</Text>
            <Text style={styles.completedSub}>You have arrived safely at your destination.</Text>

            <View style={styles.ratingCard}>
              <Text style={styles.ratingPrompt}>Rate your driver, {acceptedDriver.name}</Text>
              
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Ionicons 
                      name={star <= rating ? "star" : "star-outline"} 
                      size={28} 
                      color="#F59E0B" 
                      style={{ marginHorizontal: 4 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.commentInput}
                placeholder="Leave a comment or compliment (optional)"
                placeholderTextColor="#9CA3AF"
                value={comment}
                onChangeText={setComment}
              />

              <TouchableOpacity 
                style={[styles.compactReviewButton, isSubmittingReview && { opacity: 0.7 }]} 
                activeOpacity={0.85}
                onPress={handleSubmitReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.compactReviewButtonText}>Submit Review & Exit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Unified Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home-outline" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={BLUE} />} label="Rides" active={true} onPress={() => {}} />
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" onPress={() => onNavigate('alerts')} />
        <TabItem icon={<Feather name="user" size={22} color={MUTED} />} label="Profile" onPress={() => onNavigate('profile')} />
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    zIndex: 20,
  },
  brandTitle: { fontSize: 18, fontWeight: '800', color: NAVY },
  scrollContainer: { padding: 16, paddingBottom: 100 },

  subTabRow: { flexDirection: 'row', backgroundColor: '#E2E8F0', padding: 4, margin: 16, borderRadius: 14 },
  subTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  subTabBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  subTabText: { fontSize: 13, fontWeight: '700', color: MUTED },
  subTabTextActive: { color: NAVY },

  sectionHeader: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.8, marginBottom: 8, marginTop: 14 },
  
  zoneBannerCard: { backgroundColor: BLUE, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  zoneLabel: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  zoneSub: { fontSize: 13, color: '#E0F2FE', marginTop: 2 },
  liveIndicatorBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  liveText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  locationCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  originDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE, marginLeft: 3 },
  connectingLine: { width: 2, height: 20, backgroundColor: '#E2E8F0', marginLeft: 7, marginVertical: 4 },
  locLabel: { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 0.5 },
  locInputInline: { fontSize: 15, fontWeight: '700', color: TEXT, marginTop: 2, height: 30, padding: 0 },

  rideTypeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  typeCard: { flex: 1, backgroundColor: CARD_BG, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: BORDER, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  typeCardActive: { borderColor: BLUE, backgroundColor: TAB_ACTIVE_BG },
  typeTitle: { fontSize: 14, fontWeight: '700', color: MUTED },
  typeTitleActive: { color: NAVY },

  timeInput: { backgroundColor: CARD_BG, borderRadius: 14, paddingHorizontal: 16, height: 50, fontSize: 15, color: TEXT, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  
  alarmPickerButton: { backgroundColor: CARD_BG, borderRadius: 14, paddingHorizontal: 16, height: 52, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, marginBottom: 16, gap: 10 },
  alarmPickerText: { flex: 1, fontSize: 15, fontWeight: '700', color: TEXT },
  changeAlarmLabel: { fontSize: 13, fontWeight: '700', color: BLUE },

  primaryButton: { backgroundColor: NAVY, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, elevation: 3 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  actionButtonRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: BORDER, borderRadius: 12, height: 42, gap: 6 },
  actionButtonText: { fontSize: 13, fontWeight: '700', color: NAVY },

  searchingContainer: { paddingHorizontal: 4 },
  searchMapCard: { height: 260, width: '100%', borderRadius: 24, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: BORDER, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  mapOverlayDark: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16, 32, 107, 0.2)' },
  
  radarCenterWrapper: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -50 }, { translateY: -50 }], width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  signalWaveRing1: { position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 1.5, borderColor: 'rgba(47, 107, 255, 0.5)', backgroundColor: 'rgba(47, 107, 255, 0.15)' },
  signalWaveRing2: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1.5, borderColor: 'rgba(47, 107, 255, 0.35)', backgroundColor: 'rgba(47, 107, 255, 0.08)' },
  signalWaveRing3: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(47, 107, 255, 0.2)', backgroundColor: 'rgba(47, 107, 255, 0.03)' },
  radarCoreDot: { width: 48, height: 48, borderRadius: 24, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, elevation: 6, zIndex: 5 },

  searchStatusPill: { position: 'absolute', top: 16, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, gap: 8, shadowColor: '#000', shadowOpacity: 0.15, elevation: 4 },
  greenDotPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  searchStatusPillText: { fontSize: 13, fontWeight: '800', color: NAVY },

  searchSummaryCard: { backgroundColor: CARD_BG, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: BORDER, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, elevation: 2 },
  summaryHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  summaryBadge: { backgroundColor: TAB_ACTIVE_BG, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  summaryBadgeText: { fontSize: 10, fontWeight: '900', color: BLUE, letterSpacing: 0.5 },
  summaryEstTime: { fontSize: 12, fontWeight: '700', color: MUTED },

  summaryRouteBox: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  summaryRouteItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryConnectingLine: { width: 2, height: 14, backgroundColor: '#CBD5E1', marginLeft: 3, marginVertical: 3 },
  summaryRouteText: { fontSize: 14, fontWeight: '700', color: TEXT, flex: 1 },

  summaryNotesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  summaryNotesText: { fontSize: 12, color: MUTED, fontWeight: '600' },

  proCancelButton: { backgroundColor: '#FEE2E2', height: 52, borderRadius: 16, width: '100%', alignItems: 'center', justifyContent: 'center' },
  proCancelButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '800' },

  mapCard: { height: 180, width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: BORDER },
  mapCardLarge: { height: 320, width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  fleetBubble: { backgroundColor: NAVY, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 2, borderColor: '#fff' },
  floatingStatusPill: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  mapPillText: { fontSize: 12, fontWeight: '700', color: NAVY },

  foundContainer: {},
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', padding: 14, borderRadius: 14, marginBottom: 16, gap: 10 },
  successBannerText: { fontSize: 14, fontWeight: '700', color: GREEN_TEXT },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.8, marginBottom: 10 },
  driverHighlightCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  driverProfileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: TAB_ACTIVE_BG, alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 16, fontWeight: '800', color: TEXT },
  driverMeta: { fontSize: 13, color: MUTED, marginTop: 2 },
  etaBadge: { backgroundColor: '#E6E8F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  etaBadgeText: { fontSize: 12, fontWeight: '700', color: NAVY },

  trackingContainer: {},
  sheetStandalone: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  iconCircleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },

  arrivedContainer: {},
  arrivedAlertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: TAB_ACTIVE_BG, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: BLUE },
  arrivedTitle: { fontSize: 16, fontWeight: '800', color: NAVY },
  arrivedSub: { fontSize: 13, color: MUTED, marginTop: 2 },

  tripDestText: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 16 },

  completedContainer: { alignItems: 'center', paddingVertical: 20 },
  successCheckWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.2, elevation: 4 },
  completedTitle: { fontSize: 24, fontWeight: '800', color: NAVY, marginBottom: 6 },
  completedSub: { fontSize: 14, color: MUTED, marginBottom: 24, textAlign: 'center' },
  ratingCard: { backgroundColor: CARD_BG, borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  ratingPrompt: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 16 },
  starsRow: { flexDirection: 'row', marginBottom: 20 },
  commentInput: { backgroundColor: '#fff', borderRadius: 12, width: '100%', paddingHorizontal: 16, height: 48, fontSize: 14, color: TEXT, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },

  compactReviewButton: { backgroundColor: NAVY, height: 46, borderRadius: 14, width: '100%', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  compactReviewButtonText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },

  historyCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
  historyDest: { fontSize: 16, fontWeight: '800', color: TEXT },
  historySub: { fontSize: 13, color: MUTED, marginTop: 2 },
  historyTime: { fontSize: 12, fontWeight: '700', color: BLUE, marginTop: 6 },
  statusBadge: { backgroundColor: TAB_ACTIVE_BG, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800', color: NAVY },
  emptyText: { textAlign: 'center', color: MUTED, marginTop: 20, fontSize: 14 },

  tabBar: { 
    position: 'absolute', left: 0, right: 0, bottom: 0, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    paddingTop: 8, 
    paddingBottom: Platform.OS === 'ios' ? 22 : 10, 
    borderTopLeftRadius: 20, borderTopRightRadius: 20, 
    shadowColor: '#000', shadowOpacity: 0.06, elevation: 8 
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 16 },
  tabIconWrapActive: { backgroundColor: TAB_ACTIVE_BG },
  tabLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
  tabLabelActive: { color: TEXT, fontWeight: '600' },
});