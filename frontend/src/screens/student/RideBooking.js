// RideBooking.js
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
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const LIME = '#B6E84A';
const MUTED = '#6B7280';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const TAB_ACTIVE_BG = '#EEF2FF';
const BORDER = '#E2E8F0';
const PILL_BG = '#F1F5F9';

const MAP_URI = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200';

export default function RideBooking({ onNavigate }) {
  const [rideStep, setRideStep] = useState('hub');
  
  const [pickup, setPickup] = useState('Library West');
  const [destination, setDestination] = useState('');

  // Scheduled Ride Modal & List State
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleDest, setScheduleDest] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduledRidesList, setScheduledRidesList] = useState([]);

  const [acceptedDriver, setAcceptedDriver] = useState({
    name: 'Marcus Chen',
    rating: '4.9',
    totalRides: '2,400+ rides',
    vehicleModel: 'Honda Civic',
    licensePlate: 'ABC-1234',
    eta: '3 mins away'
  });

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Setup local notification listener to handle background/foreground push simulations
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log("[Notification Received]", notification);
    });

    return () => subscription.remove();
  }, []);

  const handleStartSearch = () => {
    if (!destination.trim()) {
      Alert.alert("Destination Required", "Please enter where you are going.");
      return;
    }
    // TODO: BACKEND INTEGRATION - POST /api/v1/rides/broadcast-search (Continuous search until driver accepts)
    setRideStep('searching');

    // Simulate persistent searching until a driver accepts after 4 seconds
    setTimeout(() => {
      setRideStep('driver-found');
      // Trigger background push notification simulation
      triggerDriverFoundNotification();
    }, 4000);
  };

  const triggerDriverFoundNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Driver Accepted! 🚗",
          subtitle: "CampusRide Dispatch",
          body: `${acceptedDriver.name} has accepted your ride request. Tap to track arrival.`,
          sound: true,
        },
        trigger: null, // immediate trigger
      });
    } catch (err) {
      console.log("[Push Notification Error]", err.message);
    }
  };

  const handleConfirmSchedule = () => {
    if (!scheduleDest.trim() || !scheduleTime.trim()) {
      Alert.alert("Error", "Please fill in all scheduling fields.");
      return;
    }

    const newSchedule = {
      id: Date.now().toString(),
      destination: scheduleDest,
      time: scheduleTime,
      status: 'Scheduled',
    };

    setScheduledRidesList((prev) => [...prev, newSchedule]);

    // TODO: BACKEND INTEGRATION - POST /api/v1/rides/schedule
    // Simulating 20-minute advance reminder job registration on server
    Alert.alert(
      "Ride Scheduled Successfully", 
      `Your trip to ${scheduleDest} is locked in for ${scheduleTime}.\n\nYou will receive a pre-commute alert 20 minutes prior before auto-dispatching to zone drivers.`
    );

    setScheduleDest('');
    setScheduleTime('');
    setScheduleModalVisible(false);
  };

  const handleCancelScheduledRide = (id) => {
    setScheduledRidesList((prev) => prev.filter((item) => item.id !== id));
    Alert.alert("Scheduled Ride Canceled", "Your scheduled trip has been successfully canceled with no penalty.");
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Clean Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle} numberOfLines={1}>
            {rideStep === 'hub' && 'Zone Hub & Rides'}
            {rideStep === 'searching' && 'Broadcasting...'}
            {rideStep === 'driver-found' && 'Driver Matched!'}
            {rideStep === 'en-route' && 'Driver En Route'}
            {rideStep === 'arrived' && 'Ready for Pickup'}
            {rideStep === 'trip-active' && 'Trip in Progress'}
            {rideStep === 'completed' && 'Trip Finished'}
          </Text>
        </View>
        
        {rideStep === 'hub' && (
          <TouchableOpacity 
            style={styles.scheduleHeaderBtn} 
            activeOpacity={0.8}
            onPress={() => setScheduleModalVisible(true)}
          >
            <Ionicons name="calendar" size={14} color={NAVY} />
            <Text style={styles.scheduleHeaderText}>Schedule</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* ========================================== */}
        {/* STEP 1: RIDES HUB (Input & Zone Overview)   */}
        {/* ========================================== */}
        {rideStep === 'hub' && (
          <>
            <View style={styles.zoneBannerCard}>
              <View style={styles.zoneBadgeGlow}>
                <Ionicons name="radio" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.zoneLabel}>ZONE: CAMPUS CENTRAL</Text>
                <Text style={styles.zoneSub}>12 Active drivers ready • Continuous auto-dispatch</Text>
              </View>
              <View style={styles.liveIndicatorBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {/* Active Scheduled Rides Section */}
            {scheduledRidesList.length > 0 && (
              <View style={styles.scheduledActiveCard}>
                <Text style={styles.cardSectionTitle}>UPCOMING SCHEDULED COMMUTES</Text>
                {scheduledRidesList.map((item) => (
                  <View key={item.id} style={styles.scheduledItemRow}>
                    <View style={styles.scheduleIconWrap}>
                      <Ionicons name="time" size={16} color={BLUE} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.scheduleDestText}>{item.destination}</Text>
                      <Text style={styles.scheduleTimeText}>{item.time} • Auto-reminder set for 20m prior</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.cancelScheduleSmallBtn}
                      onPress={() => handleCancelScheduledRide(item.id)}
                    >
                      <Text style={styles.cancelScheduleSmallText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.inputCard}>
              <Text style={styles.cardSectionTitle}>WHERE ARE YOU COMMUTING?</Text>
              
              <View style={styles.inputRow}>
                <View style={[styles.dotIndicator, { backgroundColor: BLUE }]} />
                <TextInput
                  style={styles.textInput}
                  value={pickup}
                  onChangeText={setPickup}
                  placeholder="Pickup Location"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.connectingLineContainer}>
                <View style={styles.connectingLine} />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.dotIndicator, { backgroundColor: '#10B981' }]} />
                <TextInput
                  style={styles.textInput}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Enter destination building..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="people-outline" size={18} color={BLUE} />
                </View>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Active Fleet</Text>
              </View>
              <View style={styles.statBox}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="time-outline" size={18} color="#10B981" />
                </View>
                <Text style={styles.statNumber}>3m</Text>
                <Text style={styles.statLabel}>Pickup ETA</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.primaryButton} 
              activeOpacity={0.85}
              onPress={handleStartSearch}
            >
              <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>SEARCH ZONE DRIVERS</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ========================================== */}
        {/* STEP 2: SEARCHING / BROADCASTING STATE       */}
        {/* ========================================== */}
        {rideStep === 'searching' && (
          <View style={styles.centerSection}>
            <View style={styles.mapCard}>
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 20 }}>
                <View style={styles.mapPillTop}>
                  <View style={styles.greenDot} />
                  <Text style={styles.mapPillText}>Continuous zone search active...</Text>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.radarContainer}>
              <View style={styles.radarRingOuter}>
                <View style={styles.radarRingMid}>
                  <View style={styles.radarCenterCircle}>
                    <MaterialCommunityIcons name="car-side" size={32} color={BLUE} />
                  </View>
                </View>
              </View>
              <Text style={styles.matchingTitle}>Searching for available drivers...</Text>
              <Text style={styles.matchingText}>System is persistently broadcasting your route until a driver accepts.</Text>
            </View>

            <TouchableOpacity 
              style={styles.cancelButton} 
              activeOpacity={0.85}
              onPress={() => setRideStep('hub')}
            >
              <Text style={styles.cancelButtonText}>Cancel Broadcast</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================== */}
        {/* STEP 3: DRIVER FOUND & SURROUNDING DRIVERS  */}
        {/* ========================================== */}
        {rideStep === 'driver-found' && (
          <View style={styles.foundContainer}>
            <View style={styles.successBanner}>
              <View style={styles.successIconBubble}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.successBannerTitle}>Match Confirmed via Push Notification!</Text>
                <Text style={styles.successBannerText}>Driver accepted your persistent zone search.</Text>
              </View>
            </View>

            <View style={styles.mapCard}>
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 20 }}>
                <View style={styles.mapPinIndicator} />
              </ImageBackground>
            </View>

            <Text style={styles.sectionTitle}>ASSIGNED DRIVER DETAILS</Text>

            <View style={styles.driverHighlightCard}>
              <View style={styles.driverProfileRow}>
                <View style={styles.avatarWrap}>
                  <FontAwesome5 name="user-alt" size={22} color={BLUE} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.driverName}>{acceptedDriver.name}</Text>
                  <Text style={styles.driverMeta}>★ {acceptedDriver.rating} • {acceptedDriver.vehicleModel}</Text>
                </View>
                <View style={styles.etaBadge}>
                  <Text style={styles.etaBadgeText}>{acceptedDriver.eta}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.primaryButton} 
                activeOpacity={0.85}
                onPress={() => setRideStep('en-route')}
              >
                <Text style={styles.primaryButtonText}>TRACK ACCEPTED DRIVER</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================== */}
        {/* STEP 4: TRACKING DRIVER TO PICKUP          */}
        {/* ========================================== */}
        {rideStep === 'en-route' && (
          <View style={styles.trackingContainer}>
            <View style={styles.mapCardLarge}>
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 20 }}>
                <View style={styles.floatingStatusPill}>
                  <View style={styles.greenDot} />
                  <Text style={styles.mapPillText}>Driver is moving toward you (3m)</Text>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.sheetStandalone}>
              <View style={styles.driverProfileRow}>
                <View style={styles.avatarWrap}>
                  <FontAwesome5 name="user-alt" size={24} color={BLUE} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.driverName}>{acceptedDriver.name}</Text>
                  <Text style={styles.driverMeta}>{acceptedDriver.vehicleModel} • Plate: {acceptedDriver.licensePlate}</Text>
                </View>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={() => Alert.alert("Call", "Calling driver...")}>
                  <Ionicons name="call" size={18} color={NAVY} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconCircleBtn, { marginLeft: 8 }]} onPress={() => Alert.alert("Chat", "Opening chat...")}>
                  <Ionicons name="chatbubble-ellipses" size={18} color={NAVY} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.simulationBtn} 
                onPress={() => setRideStep('arrived')}
              >
                <Text style={styles.simulationBtnText}>[Simulate Driver Arrival]</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================== */}
        {/* STEP 5: DRIVER ARRIVED AT PICKUP POINT     */}
        {/* ========================================== */}
        {rideStep === 'arrived' && (
          <View style={styles.arrivedContainer}>
            <View style={styles.arrivedAlertBanner}>
              <View style={styles.arrivedIconBubble}>
                <Ionicons name="notifications" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.arrivedTitle}>Your driver has arrived!</Text>
                <Text style={styles.arrivedSub}>Head to the {pickup} entrance now.</Text>
              </View>
            </View>

            <View style={styles.mapCard}>
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 20 }} />
            </View>

            <View style={styles.driverHighlightCard}>
              <View style={styles.driverProfileRow}>
                <View style={styles.avatarWrap}>
                  <FontAwesome5 name="user-alt" size={20} color={BLUE} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.driverName}>{acceptedDriver.name}</Text>
                  <Text style={styles.driverMeta}>Vehicle Plate: {acceptedDriver.licensePlate}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.primaryButton} 
                activeOpacity={0.85}
                onPress={() => setRideStep('trip-active')}
              >
                <Text style={styles.primaryButtonText}>I HAVE BOARDED • START TRIP</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================== */}
        {/* STEP 6: TRIP ACTIVE TRACKING               */}
        {/* ========================================== */}
        {rideStep === 'trip-active' && (
          <View style={styles.trackingContainer}>
            <View style={styles.mapCardLarge}>
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 20 }}>
                <View style={styles.floatingStatusPill}>
                  <View style={styles.greenDot} />
                  <Text style={styles.mapPillText}>En route to: {destination || 'Destination'}</Text>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.sheetStandalone}>
              <Text style={styles.sectionTitle}>SECURE CAMPUS TRANSIT</Text>
              <Text style={styles.tripDestText}>Destination: {destination || 'Engineering Library'}</Text>

              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={() => setRideStep('completed')}
              >
                <Text style={styles.primaryButtonText}>[Simulate Arrival at Destination]</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================== */}
        {/* STEP 7: RIDE COMPLETED & RATING FEEDBACK   */}
        {/* ========================================== */}
        {rideStep === 'completed' && (
          <View style={styles.completedContainer}>
            <View style={styles.successCheckWrap}>
              <Ionicons name="checkmark" size={36} color="#fff" />
            </View>
            <Text style={styles.completedTitle}>You've Arrived Safely</Text>
            <Text style={styles.completedSub}>Thank you for riding with CampusRide.</Text>

            <View style={styles.ratingCard}>
              <Text style={styles.ratingPrompt}>How was your trip with {acceptedDriver.name}?</Text>
              
              {/* Star Rating Row */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                    <Ionicons 
                      name={star <= rating ? "star" : "star-outline"} 
                      size={32} 
                      color="#F59E0B" 
                      style={{ marginHorizontal: 6 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.commentInput}
                placeholder="Leave a compliment or note (optional)..."
                placeholderTextColor="#9CA3AF"
                value={comment}
                onChangeText={setComment}
              />

              <TouchableOpacity 
                style={styles.primaryButton} 
                activeOpacity={0.85}
                onPress={() => {
                  // TODO: POST /api/v1/rides/rate ({ rating, comment })
                  Alert.alert("Thank you!", "Your feedback has been recorded.");
                  setRideStep('hub');
                }}
              >
                <Text style={styles.primaryButtonText}>SUBMIT REVIEW & EXIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* SCHEDULE RIDE MODAL */}
      <Modal
        visible={scheduleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Schedule a Ride</Text>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
                <Ionicons name="close" size={24} color={TEXT} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Plan ahead. You'll get an alert 20 mins before departure with options to cancel or auto-dispatch.</Text>

            <Text style={styles.inputLabel}>Destination</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Science Complex Block B"
              placeholderTextColor="#9CA3AF"
              value={scheduleDest}
              onChangeText={setScheduleDest}
            />

            <Text style={styles.inputLabel}>Pickup Time</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Tomorrow at 11:00 AM"
              placeholderTextColor="#9CA3AF"
              value={scheduleTime}
              onChangeText={setScheduleTime}
            />

            <TouchableOpacity 
              style={styles.scheduleConfirmBtn} 
              activeOpacity={0.85}
              onPress={handleConfirmSchedule}
            >
              <Text style={styles.scheduleConfirmText}>Lock In Scheduled Ride</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Unified Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home" size={22} color={MUTED} />} label="Home" onPress={() => onNavigate('home')} />
        <TabItem icon={<FontAwesome5 name="car" size={18} color={BLUE} />} label="Rides" active={true} onPress={() => onNavigate('rides')} />
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 20,
  },
  brandTitle: { fontSize: 18, fontWeight: '800', color: NAVY },
  scheduleHeaderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: TAB_ACTIVE_BG, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  scheduleHeaderText: { fontSize: 13, fontWeight: '700', color: NAVY },
  
  scrollContainer: { padding: 16, paddingTop: 16, paddingBottom: 110 },
  
  zoneBannerCard: { backgroundColor: BLUE, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 18, shadowColor: BLUE, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  zoneBadgeGlow: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  zoneLabel: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  zoneSub: { fontSize: 13, color: '#E0F2FE', marginTop: 3 },
  liveIndicatorBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  liveText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  scheduledActiveCard: { backgroundColor: CARD_BG, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.03, elevation: 2 },
  scheduledItemRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: PILL_BG, padding: 12, borderRadius: 14 },
  scheduleIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: TAB_ACTIVE_BG, alignItems: 'center', justifyContent: 'center' },
  scheduleDestText: { fontSize: 14, fontWeight: '700', color: TEXT },
  scheduleTimeText: { fontSize: 11, color: MUTED, marginTop: 2, fontWeight: '600' },
  cancelScheduleSmallBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  cancelScheduleSmallText: { color: '#EF4444', fontSize: 11, fontWeight: '700' },

  inputCard: { backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardSectionTitle: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.8, marginBottom: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  dotIndicator: { width: 10, height: 10, borderRadius: 5, marginLeft: 4 },
  connectingLineContainer: { height: 16, marginLeft: 8, justifyContent: 'center' },
  connectingLine: { width: 2, height: '100%', backgroundColor: BORDER },
  textInput: { flex: 1, marginLeft: 14, height: 44, fontSize: 15, fontWeight: '700', color: TEXT, backgroundColor: PILL_BG, paddingHorizontal: 14, borderRadius: 12 },

  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: CARD_BG, borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  statIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: PILL_BG, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statNumber: { fontSize: 20, fontWeight: '800', color: NAVY },
  statLabel: { fontSize: 12, color: MUTED, marginTop: 2, fontWeight: '600' },

  primaryButton: { backgroundColor: NAVY, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: NAVY, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  centerSection: { alignItems: 'center' },
  mapCard: { height: 200, width: '100%', borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  mapCardLarge: { height: 320, width: '100%', borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  mapImage: { flex: 1, justifyContent: 'flex-end', padding: 14, position: 'relative' },
  mapPillTop: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, gap: 6, shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  mapPillText: { fontSize: 12, fontWeight: '700', color: NAVY },
  mapPinIndicator: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#22C55E', borderWidth: 3, borderColor: '#fff', alignSelf: 'center', marginBottom: 40 },
  floatingStatusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8, shadowColor: '#000', shadowOpacity: 0.15, elevation: 4 },

  radarContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 10, width: '100%' },
  radarRingOuter: { width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(47, 107, 255, 0.08)', alignItems: 'center', justifyContent: 'center' },
  radarRingMid: { width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(47, 107, 255, 0.15)', alignItems: 'center', justifyContent: 'center' },
  radarCenterCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: BLUE, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  matchingTitle: { fontSize: 18, fontWeight: '800', color: NAVY, marginTop: 20 },
  matchingText: { fontSize: 13, fontWeight: '600', color: MUTED, textAlign: 'center', marginTop: 4, paddingHorizontal: 20, lineHeight: 18 },

  cancelButton: { backgroundColor: '#EF4444', height: 52, borderRadius: 18, width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 24, shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
  cancelButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  foundContainer: {},
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', padding: 16, borderRadius: 18, marginBottom: 18, borderWidth: 1, borderColor: '#BBF7D0' },
  successIconBubble: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#166534', alignItems: 'center', justifyContent: 'center' },
  successBannerTitle: { fontSize: 14, fontWeight: '800', color: '#166534' },
  successBannerText: { fontSize: 12, color: '#15803D', marginTop: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.8, marginBottom: 10 },
  driverHighlightCard: { backgroundColor: CARD_BG, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  driverProfileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatarWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: TAB_ACTIVE_BG, alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 17, fontWeight: '800', color: TEXT },
  driverMeta: { fontSize: 13, color: MUTED, marginTop: 3, fontWeight: '600' },
  etaBadge: { backgroundColor: PILL_BG, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  etaBadgeText: { fontSize: 12, fontWeight: '800', color: NAVY },

  trackingContainer: {},
  sheetStandalone: { backgroundColor: CARD_BG, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  iconCircleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: PILL_BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  simulationBtn: { marginTop: 14, alignItems: 'center', padding: 8 },
  simulationBtnText: { color: BLUE, fontSize: 13, fontWeight: '700' },

  arrivedContainer: {},
  arrivedAlertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: NAVY, padding: 18, borderRadius: 20, marginBottom: 18, shadowColor: NAVY, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  arrivedIconBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  arrivedTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  arrivedSub: { fontSize: 13, color: '#E0F2FE', marginTop: 2 },

  tripDestText: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 16 },

  completedContainer: { alignItems: 'center', paddingVertical: 20 },
  successCheckWrap: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#22C55E', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  completedTitle: { fontSize: 24, fontWeight: '800', color: NAVY, marginBottom: 6 },
  completedSub: { fontSize: 14, color: MUTED, marginBottom: 24, textAlign: 'center' },
  ratingCard: { backgroundColor: CARD_BG, borderRadius: 24, padding: 22, width: '100%', borderWidth: 1, borderColor: BORDER, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  ratingPrompt: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 18, textAlign: 'center' },
  starsRow: { flexDirection: 'row', marginBottom: 22 },
  commentInput: { backgroundColor: PILL_BG, borderRadius: 14, width: '100%', paddingHorizontal: 16, height: 52, fontSize: 14, color: TEXT, borderWidth: 1, borderColor: BORDER, marginBottom: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: NAVY },
  modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 6 },
  modalInput: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, color: TEXT, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  scheduleConfirmBtn: { backgroundColor: BLUE, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  scheduleConfirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },

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