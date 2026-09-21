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
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../api/axios';
import { getPersistentSocket } from '../../api/socketHelper';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#8A8FA3';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const TAB_ACTIVE_BG = '#EEF2FF';
const BORDER = '#E2E8F0';
const GREEN_TEXT = '#16a34a';

export default function RideBooking({ onNavigate, initialDestination }) {
  const [activeSubTab, setActiveSubTab] = useState('zone'); // Zone Hub default view
  const [rideStep, setRideStep] = useState('hub');
  
  // Schedule state with Clock/Alarm Picker integration
  const [schedulePickup, setSchedulePickup] = useState('Detecting current GPS...');
  const [schedulePickupCoords, setSchedulePickupCoords] = useState([-0.1870, 5.6508]);
  const [scheduleDestination, setScheduleDestination] = useState('');
  const [scheduleDestCoords, setScheduleDestCoords] = useState(null);
  const [scheduleRideType, setScheduleRideType] = useState('shared');
  
  const [scheduledTime, setScheduledTime] = useState(new Date(Date.now() + 45 * 60000));
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [scheduledRides, setScheduledRides] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  // Zone Hub broadcast state
  const [currentLocation, setCurrentLocation] = useState({ latitude: 5.6037, longitude: -0.1870 });
  const [zonePickup, setZonePickup] = useState('Detecting current GPS...');
  const [zonePickupCoords, setZonePickupCoords] = useState([-0.1870, 5.6037]);
  const [zoneDestination, setZoneDestination] = useState(initialDestination || '');
  const [zoneDestCoords, setZoneDestCoords] = useState(null);
  const [zoneRideType, setZoneRideType] = useState('shared');
  const [passengerNotes, setPassengerNotes] = useState('');
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState(null);

  // POI search autocomplete suggestions
  const [poiSuggestions, setPoiSuggestions] = useState([]);
  const [activeSearchTarget, setActiveSearchTarget] = useState(null); // 'zoneDest', 'scheduleDest'

  // Accepted driver state & telemetry
  const [acceptedDriver, setAcceptedDriver] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);
  const activeTripIdRef = useRef(null);

  // Review & Rating state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [stopsAheadCount, setStopsAheadCount] = useState(null);

  const mapRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (initialDestination) {
      setZoneDestination(initialDestination);
      setActiveSubTab('zone');
      searchPOIs(initialDestination, 'zoneDest');
    }
  }, [initialDestination]);

  useEffect(() => {
    initializePassengerLocation();
    fetchScheduledRides();

    let isMounted = true;

    async function setupSocket() {
      const socket = await getPersistentSocket();
      if (!isMounted) return;
      socketRef.current = socket;

      // 1. Driver Assignment
      const handleRideAssigned = (data) => {
        if (!isMounted) return;
        console.log("🎉 Ride Assigned event received in RideBooking:", data);
        if (data && data.driver) {
          const tripId = data.driverTripId || data.tripId;
          if (tripId) {
            setActiveTripId(tripId);
            activeTripIdRef.current = tripId;
            socket.emit('trip:join', { tripId });
          }
          setAcceptedDriver({
            id: data.driver.id || data.driverId,
            name: data.driver.fullName || data.driver.name || 'Campus Driver',
            rating: data.driver.rating || '5.0',
            vehicleModel: data.driver.vehicle?.model || data.driver.vehicleModel || 'Campus Vehicle',
            licensePlate: data.driver.vehicle?.licensePlate || data.driver.vehicleLicensePlate || 'N/A',
            phoneNumber: data.driver.phoneNumber || '',
            eta: '3 mins away',
            latitude: data.driver.currentLocation?.coordinates?.[1] || 5.6508,
            longitude: data.driver.currentLocation?.coordinates?.[0] || -0.1870,
          });
          setActiveBookingId(data.bookingId);
          setRideStep('driver-found');
        }
      };

      // 2. Stop & Status Lifecycle Updates
      const handleStopUpdate = (data) => {
        if (!isMounted) return;
        const targetStatus = data?.targetStatus || data?.stop?.status;
        const stopType = data?.stop?.stopType;
        if (targetStatus === 'arrived' || targetStatus === 'arrived_at_pickup') {
          setRideStep('arrived');
        } else if (targetStatus === 'completed' && stopType === 'pickup') {
          setRideStep('trip-active');
        } else if (targetStatus === 'completed' && stopType === 'dropoff') {
          setRideStep('completed');
        }
      };

      const handleStatusChange = (data) => {
        if (!isMounted) return;
        const status = data?.status;
        if (status === 'active' || status === 'in_progress') {
          setRideStep('trip-active');
        } else if (status === 'completed') {
          setRideStep('completed');
        }
      };

      // 3. Sanitized Route Updates for Shared Pool
      const handleRouteUpdated = (data) => {
        if (!isMounted) return;
        console.log("📍 Sanitized Route Updated for passenger:", data);
        if (data?.tripId && !activeTripIdRef.current) {
          setActiveTripId(data.tripId);
          activeTripIdRef.current = data.tripId;
          socket.emit('trip:join', { tripId: data.tripId });
        }
        if (data?.stopsAheadCount !== undefined) {
          setStopsAheadCount(data.stopsAheadCount);
        }
      };

      // 4. Trip Completed
      const handleRideCompleted = (data) => {
        if (!isMounted) return;
        console.log("🏁 Ride completed:", data);
        if (activeTripIdRef.current) {
          socket.emit('trip:leave', { tripId: activeTripIdRef.current });
          activeTripIdRef.current = null;
          setActiveTripId(null);
        }
        if (data?.bookingId) {
          setActiveBookingId(data.bookingId);
        }
        setRideStep('completed');
      };

      // 5. Ride Cancelled
      const handleRideCancelled = (data) => {
        if (!isMounted) return;
        if (activeTripIdRef.current) {
          socket.emit('trip:leave', { tripId: activeTripIdRef.current });
          activeTripIdRef.current = null;
          setActiveTripId(null);
        }
        Alert.alert(
          "Ride Cancelled",
          data?.reason ? `Your ride was cancelled: ${data.reason}` : "Your ride request was cancelled."
        );
        setRideStep('hub');
        setActiveBookingId(null);
        setAcceptedDriver(null);
        setStopsAheadCount(null);
      };

      // 6. Driver GPS Telemetry Stream
      const handleDriverTelemetry = (telemetry) => {
        if (!isMounted) return;
        if (telemetry?.coordinates && Array.isArray(telemetry.coordinates) && telemetry.coordinates.length === 2) {
          setAcceptedDriver(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              longitude: telemetry.coordinates[0],
              latitude: telemetry.coordinates[1],
            };
          });
        }
      };

      // 7. Socket Reconnect Handler (Re-join active trip room on reconnect)
      const handleConnect = () => {
        if (activeTripIdRef.current) {
          console.log("🔄 Rejoining trip room after reconnect:", activeTripIdRef.current);
          socket.emit('trip:join', { tripId: activeTripIdRef.current });
        }
      };

      socket.on('connect', handleConnect);
      socket.on('ride:assigned', handleRideAssigned);
      socket.on('rideAccepted', handleRideAssigned);
      socket.on('trip:stop_update', handleStopUpdate);
      socket.on('trip:status_change', handleStatusChange);
      socket.on('trip:route-updated', handleRouteUpdated);
      socket.on('ride:completed', handleRideCompleted);
      socket.on('ride:cancelled', handleRideCancelled);
      socket.on('driver:telemetry', handleDriverTelemetry);

      return () => {
        if (activeTripIdRef.current && socket) {
          socket.emit('trip:leave', { tripId: activeTripIdRef.current });
          activeTripIdRef.current = null;
        }
        socket.off('connect', handleConnect);
        socket.off('ride:assigned', handleRideAssigned);
        socket.off('rideAccepted', handleRideAssigned);
        socket.off('trip:stop_update', handleStopUpdate);
        socket.off('trip:status_change', handleStatusChange);
        socket.off('trip:route-updated', handleRouteUpdated);
        socket.off('ride:completed', handleRideCompleted);
        socket.off('ride:cancelled', handleRideCancelled);
        socket.off('driver:telemetry', handleDriverTelemetry);
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
      setZonePickupCoords([coords.longitude, coords.latitude]);
      setSchedulePickupCoords([coords.longitude, coords.latitude]);

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
      setZonePickup('Current Campus Location');
      setSchedulePickup('Current Campus Location');
    }
  };

  const searchPOIs = async (queryText, targetField) => {
    if (!queryText || queryText.trim().length < 2) {
      setPoiSuggestions([]);
      return;
    }
    try {
      setActiveSearchTarget(targetField);
      const response = await api.get(`/pois/search?query=${encodeURIComponent(queryText.trim())}&limit=5`);
      if (response.data?.success && Array.isArray(response.data.data)) {
        setPoiSuggestions(response.data.data);
      }
    } catch (e) {
      // Safe swallow
    }
  };

  const handleSelectPoi = (poi) => {
    if (activeSearchTarget === 'zoneDest') {
      setZoneDestination(poi.name);
      if (poi.coordinates?.coordinates) {
        setZoneDestCoords(poi.coordinates.coordinates);
      }
    } else if (activeSearchTarget === 'scheduleDest') {
      setScheduleDestination(poi.name);
      if (poi.coordinates?.coordinates) {
        setScheduleDestCoords(poi.coordinates.coordinates);
      }
    }
    setPoiSuggestions([]);
  };

  const fetchScheduledRides = async () => {
    try {
      setLoadingSchedule(true);
      const response = await api.get('/bookings/history');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const scheduled = response.data.data.filter(b => b.status === 'pending' || b.status === 'driver_assigned' || b.scheduledTime);
        setScheduledRides(scheduled);
      }
    } catch (err) {
      // Safe swallow
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
      return Alert.alert("Too Soon", "Scheduled rides must be set at least 30 minutes in advance. Use Zone Hub for instant dispatch.");
    }
    if (diffMinutes > 1440) {
      return Alert.alert("Out of Range", "Rides can only be scheduled up to 24 hours in advance.");
    }

    setIsSubmittingSchedule(true);
    try {
      const dropCoords = scheduleDestCoords || [-0.1870, 5.6508];
      const payload = {
        pickup: {
          name: schedulePickup,
          coordinates: schedulePickupCoords
        },
        dropoff: {
          name: scheduleDestination,
          coordinates: dropCoords
        },
        rideMode: scheduleRideType === 'shared' ? 'shared' : 'solo',
        scheduledTime: scheduledTime.toISOString(),
      };

      const response = await api.post('/bookings', payload);
      setIsSubmittingSchedule(false);

      if (response.data?.success) {
        Alert.alert("Ride Scheduled!", `Your ride is locked in for ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
        setScheduleDestination('');
        fetchScheduledRides();
      }
    } catch (err) {
      setIsSubmittingSchedule(false);
      Alert.alert("Schedule Error", err.response?.data?.error?.message || err.message || "Could not complete scheduled booking.");
    }
  };

  const handleCancelScheduledRide = async (bookingId) => {
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
              const response = await api.post(`/bookings/${bookingId}/cancel`, {
                reason: 'Passenger cancelled scheduled booking'
              });
              if (response.data?.success) {
                Alert.alert("Cancelled", "Your scheduled ride has been successfully cancelled.");
                fetchScheduledRides();
              }
            } catch (err) {
              Alert.alert("Error", err.response?.data?.error?.message || "Could not cancel scheduled ride.");
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
      const dropCoords = zoneDestCoords || [-0.1870, 5.6508];
      const payload = {
        pickup: {
          name: zonePickup,
          coordinates: zonePickupCoords
        },
        dropoff: {
          name: zoneDestination,
          coordinates: dropCoords
        },
        rideMode: zoneRideType === 'shared' ? 'shared' : 'solo',
        notes: passengerNotes
      };

      const response = await api.post('/bookings', payload);
      setIsSubmittingBroadcast(false);

      if (response.data?.success) {
        const booking = response.data.data;
        setActiveBookingId(booking._id);
        setRideStep('searching');
      }
    } catch (err) {
      setIsSubmittingBroadcast(false);
      Alert.alert("Broadcast Error", err.response?.data?.error?.message || err.message || "Failed to broadcast ride.");
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
              if (activeTripIdRef.current && socketRef.current) {
                socketRef.current.emit('trip:leave', { tripId: activeTripIdRef.current });
                activeTripIdRef.current = null;
                setActiveTripId(null);
              }
              if (activeBookingId) {
                await api.post(`/bookings/${activeBookingId}/cancel`, {
                  reason: 'Passenger cancelled broadcast'
                });
              }
            } catch (err) {
              // Safe swallow
            } finally {
              setRideStep('hub');
              setActiveBookingId(null);
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
    if (activeTripIdRef.current && socketRef.current) {
      socketRef.current.emit('trip:leave', { tripId: activeTripIdRef.current });
      activeTripIdRef.current = null;
      setActiveTripId(null);
    }

    if (!activeBookingId) {
      setRideStep('hub');
      setActiveSubTab('zone');
      setAcceptedDriver(null);
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.post('/ratings', {
        bookingId: activeBookingId,
        score: rating,
        comment
      });
      setIsSubmittingReview(false);
      Alert.alert("Thank you!", "Your feedback has been successfully saved.");
      setRideStep('hub');
      setActiveSubTab('zone');
      setAcceptedDriver(null);
      setActiveBookingId(null);
    } catch (err) {
      setIsSubmittingReview(false);
      const errMsg = err.response?.data?.error?.message || err.message;
      if (errMsg?.includes('RATING_ALREADY_EXISTS')) {
        Alert.alert("Already Rated", "This ride has already been reviewed. Thank you!");
      }
      setRideStep('hub');
      setActiveSubTab('zone');
      setAcceptedDriver(null);
      setActiveBookingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        {rideStep !== 'hub' ? (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (rideStep === 'searching') handleCancelBroadcast();
              else setRideStep('hub');
            }} 
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={NAVY} />
          </TouchableOpacity>
        )}

        <Text style={styles.brandTitle}>
          {rideStep === 'hub' && (activeSubTab === 'schedule' ? 'Schedule a Ride' : 'Zone Hub')}
          {rideStep === 'searching' && 'Broadcasting to Drivers'}
          {rideStep === 'driver-found' && 'Driver Assigned!'}
          {rideStep === 'en-route' && 'Driver En Route'}
          {rideStep === 'arrived' && 'Driver Has Arrived'}
          {rideStep === 'trip-active' && 'Active Trip'}
          {rideStep === 'completed' && 'Trip Completed'}
        </Text>
        <View style={{ width: 36 }} />
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
                    onChangeText={(t) => {
                      setScheduleDestination(t);
                      searchPOIs(t, 'scheduleDest');
                    }}
                    placeholder="Enter campus building (e.g. Balme Library)"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            {poiSuggestions.length > 0 && activeSearchTarget === 'scheduleDest' && (
              <View style={styles.poiSuggestionCard}>
                {poiSuggestions.map((poi) => (
                  <TouchableOpacity
                    key={poi._id}
                    style={styles.poiSuggestionRow}
                    onPress={() => handleSelectPoi(poi)}
                  >
                    <Ionicons name="location" size={16} color={BLUE} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.poiSuggestionTitle}>{poi.name}</Text>
                      <Text style={styles.poiSuggestionSub}>{poi.campusZone} Zone • {poi.category}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
                style={[styles.typeCard, scheduleRideType === 'solo' && styles.typeCardActive]}
                onPress={() => setScheduleRideType('solo')}
                activeOpacity={0.8}
              >
                <Ionicons name="person" size={20} color={scheduleRideType === 'solo' ? BLUE : MUTED} />
                <Text style={[styles.typeTitle, scheduleRideType === 'solo' && styles.typeTitleActive]}>Solo</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>PICKUP TIME</Text>
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
                    <Text style={styles.historyDest}>{ride.dropoff?.name || ride.dropoffLocation || ride.destination || 'Campus Destination'}</Text>
                    <Text style={styles.historySub}>{ride.pickup?.name || ride.pickupLocation || 'Pickup'} • {ride.rideMode?.toUpperCase()}</Text>
                    <Text style={styles.historyTime}>
                      {ride.scheduledTime ? new Date(ride.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Scheduled'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{ride.status?.replace('_', ' ') || 'Scheduled'}</Text>
                    </View>
                    {ride.status === 'pending' && (
                      <TouchableOpacity 
                        onPress={() => handleCancelScheduledRide(ride.id || ride._id)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Cancel</Text>
                      </TouchableOpacity>
                    )}
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
                <Text style={styles.zoneLabel}>ZONE HUB: LIVE DISPATCH</Text>
                <Text style={styles.zoneSub}>Instantly dispatch to active drivers in your campus sector</Text>
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
                    onChangeText={(t) => {
                      setZoneDestination(t);
                      searchPOIs(t, 'zoneDest');
                    }}
                    placeholder="Where are you going? (e.g. Balme Library)"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            {poiSuggestions.length > 0 && activeSearchTarget === 'zoneDest' && (
              <View style={styles.poiSuggestionCard}>
                {poiSuggestions.map((poi) => (
                  <TouchableOpacity
                    key={poi._id}
                    style={styles.poiSuggestionRow}
                    onPress={() => handleSelectPoi(poi)}
                  >
                    <Ionicons name="location" size={16} color={BLUE} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.poiSuggestionTitle}>{poi.name}</Text>
                      <Text style={styles.poiSuggestionSub}>{poi.campusZone} Zone • {poi.category}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
                style={[styles.typeCard, zoneRideType === 'solo' && styles.typeCardActive]}
                onPress={() => setZoneRideType('solo')}
                activeOpacity={0.8}
              >
                <Ionicons name="person" size={20} color={zoneRideType === 'solo' ? BLUE : MUTED} />
                <Text style={[styles.typeTitle, zoneRideType === 'solo' && styles.typeTitleActive]}>Solo</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>PASSENGER NOTES FOR DRIVER</Text>
            <TextInput
              style={styles.timeInput}
              value={passengerNotes}
              onChangeText={setPassengerNotes}
              placeholder="e.g. Waiting in front of library entrance"
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
                  <Text style={styles.primaryButtonText}>REQUEST CAMPUS RIDE</Text>
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
                <Text style={styles.searchStatusPillText}>Dispatching request to nearby campus drivers...</Text>
              </View>
            </View>

            <View style={styles.searchSummaryCard}>
              <View style={styles.summaryHeaderRow}>
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>{zoneRideType.toUpperCase()} RIDE</Text>
                </View>
                <Text style={styles.summaryEstTime}>Pending Driver Acceptance</Text>
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
              <Text style={styles.proCancelButtonText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= STEP 3: DRIVER FOUND ================= */}
        {rideStep === 'driver-found' && acceptedDriver && (
          <View style={styles.foundContainer}>
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={24} color={GREEN_TEXT} />
              <Text style={styles.successBannerText}>Driver Assigned to Your Ride!</Text>
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

            <Text style={styles.sectionTitle}>ASSIGNED DRIVER DETAILS</Text>

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
                <Text style={styles.primaryButtonText}>TRACK ASSIGNED DRIVER</Text>
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
                <Text style={styles.mapPillText}>
                  {stopsAheadCount !== null && stopsAheadCount > 0 
                    ? `Shared Route • ${stopsAheadCount} stop(s) before pickup` 
                    : "Driver is en route to pickup point"}
                </Text>
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
                <Text style={styles.arrivedSub}>Please meet the vehicle at your designated pickup spot.</Text>
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

              <View style={styles.boardingPill}>
                <Ionicons name="checkmark-circle" size={16} color={GREEN_TEXT} />
                <Text style={styles.boardingPillText}>Driver is waiting at pickup zone</Text>
              </View>
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
                <Text style={styles.mapPillText}>
                  {stopsAheadCount !== null && stopsAheadCount > 0
                    ? `Shared Ride • ${stopsAheadCount} stop(s) before dropoff`
                    : `Tracking active trip to ${zoneDestination}`}
                </Text>
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
                placeholder="Leave a comment or feedback (optional)"
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
                  <Text style={styles.compactReviewButtonText}>Submit Review & Finish</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: 17, fontWeight: '800', color: NAVY },

  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 10,
  },
  subTabBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabBtnActive: { backgroundColor: NAVY },
  subTabText: { fontSize: 13, fontWeight: '700', color: MUTED },
  subTabTextActive: { color: '#FFFFFF' },

  scrollContainer: { padding: 16 },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },

  locationCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 12,
  },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  originDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE },
  connectingLine: { width: 2, height: 16, backgroundColor: BORDER, marginLeft: 4, marginVertical: 4 },
  locLabel: { fontSize: 10, fontWeight: '800', color: MUTED, letterSpacing: 0.3 },
  locInputInline: { fontSize: 14, fontWeight: '600', color: TEXT, paddingVertical: 2 },

  poiSuggestionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
    overflow: 'hidden',
  },
  poiSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  poiSuggestionTitle: { fontSize: 13, fontWeight: '700', color: TEXT },
  poiSuggestionSub: { fontSize: 11, color: MUTED, marginTop: 1 },

  rideTypeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  typeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD_BG,
    gap: 8,
  },
  typeCardActive: { borderColor: BLUE, backgroundColor: TAB_ACTIVE_BG },
  typeTitle: { fontSize: 13, fontWeight: '600', color: MUTED },
  typeTitleActive: { color: BLUE, fontWeight: '700' },

  alarmPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  alarmPickerText: { fontSize: 13, fontWeight: '700', color: TEXT, flex: 1, marginLeft: 10 },
  changeAlarmLabel: { fontSize: 12, fontWeight: '700', color: BLUE },

  timeInput: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 13,
    color: TEXT,
    marginBottom: 16,
  },

  primaryButton: {
    backgroundColor: NAVY,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },

  historyCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyDest: { fontSize: 14, fontWeight: '700', color: TEXT },
  historySub: { fontSize: 12, color: MUTED, marginTop: 2 },
  historyTime: { fontSize: 11, color: BLUE, marginTop: 4, fontWeight: '600' },
  statusBadge: {
    backgroundColor: TAB_ACTIVE_BG,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700', color: NAVY, textTransform: 'capitalize' },
  emptyText: { fontSize: 13, color: MUTED, fontStyle: 'italic', textAlign: 'center', marginTop: 12 },

  zoneBannerCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoneLabel: { fontSize: 12, fontWeight: '800', color: NAVY },
  zoneSub: { fontSize: 11, color: MUTED, marginTop: 2 },
  liveIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#166534' },

  searchingContainer: { alignItems: 'center' },
  searchMapCard: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },
  map: { width: '100%', height: '100%' },
  mapOverlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 32, 107, 0.4)',
  },
  radarCenterWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalWaveRing1: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  signalWaveRing2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  signalWaveRing3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  radarCoreDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchStatusPill: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenDotPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a' },
  searchStatusPillText: { fontSize: 12, fontWeight: '700', color: NAVY },

  searchSummaryCard: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 16,
  },
  summaryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryBadge: { backgroundColor: TAB_ACTIVE_BG, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  summaryBadgeText: { fontSize: 11, fontWeight: '800', color: BLUE },
  summaryEstTime: { fontSize: 12, color: MUTED, fontWeight: '600' },
  summaryRouteBox: { gap: 6 },
  summaryRouteItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryRouteText: { fontSize: 13, fontWeight: '700', color: TEXT, flex: 1 },
  summaryConnectingLine: { width: 2, height: 10, backgroundColor: BORDER, marginLeft: 4 },
  summaryNotesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  summaryNotesText: { fontSize: 12, color: MUTED },
  proCancelButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proCancelButtonText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },

  foundContainer: { width: '100%' },
  successBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  successBannerText: { fontSize: 14, fontWeight: '700', color: '#166534' },
  mapCard: { height: 160, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  mapCardLarge: { height: 260, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: BORDER, position: 'relative' },
  fleetBubble: { width: 28, height: 28, borderRadius: 14, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.5, marginBottom: 10 },
  driverHighlightCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  driverProfileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: TAB_ACTIVE_BG, alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 16, fontWeight: '800', color: TEXT },
  driverMeta: { fontSize: 12, color: MUTED, marginTop: 2 },
  etaBadge: { backgroundColor: TAB_ACTIVE_BG, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  etaBadgeText: { fontSize: 12, fontWeight: '800', color: NAVY },
  actionButtonRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    gap: 8,
  },
  actionButtonText: { fontSize: 13, fontWeight: '700', color: NAVY },

  trackingContainer: { width: '100%' },
  floatingStatusPill: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
  },
  mapPillText: { fontSize: 12, fontWeight: '700', color: NAVY },
  sheetStandalone: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginTop: 14,
  },
  iconCircleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: TAB_ACTIVE_BG, alignItems: 'center', justifyContent: 'center' },
  tripDestText: { fontSize: 14, fontWeight: '700', color: TEXT, marginTop: 4 },

  arrivedContainer: { width: '100%' },
  arrivedAlertBanner: {
    backgroundColor: TAB_ACTIVE_BG,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  arrivedTitle: { fontSize: 15, fontWeight: '800', color: NAVY },
  arrivedSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  boardingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    height: 44,
    gap: 8,
    marginTop: 4,
  },
  boardingPillText: { fontSize: 13, fontWeight: '700', color: '#166534' },

  completedContainer: { alignItems: 'center', paddingVertical: 20 },
  successCheckWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  completedTitle: { fontSize: 20, fontWeight: '800', color: NAVY },
  completedSub: { fontSize: 13, color: MUTED, marginTop: 4, marginBottom: 20 },
  ratingCard: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    alignItems: 'center',
  },
  ratingPrompt: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 14 },
  starsRow: { flexDirection: 'row', marginBottom: 16 },
  commentInput: {
    width: '100%',
    height: 70,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    fontSize: 13,
    color: TEXT,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  compactReviewButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactReviewButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

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
