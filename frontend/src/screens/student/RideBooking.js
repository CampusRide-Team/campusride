// RideBooking.js
import React, { useState } from 'react';
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
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#8A8FA3';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const TAB_ACTIVE_BG = '#EEF2FF';
const BORDER = '#E2E8F0';
const GREEN_TEXT = '#16a34a';

const MAP_URI = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200';

export default function RideBooking({ onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('schedule');
  const [rideStep, setRideStep] = useState('hub');
  
  // Schedule form state
  const [schedulePickup, setSchedulePickup] = useState('Current Location');
  const [scheduleDestination, setScheduleDestination] = useState('');
  const [scheduleRideType, setScheduleRideType] = useState('shared');
  const [scheduleTimeInput, setScheduleTimeInput] = useState('');

  // Scheduled rides list state (TODO: Fetch from backend API)
  const [scheduledRides, setScheduledRides] = useState([
    {
      id: 'sched-1',
      pickup: 'Main Hostel',
      destination: 'Science Complex',
      rideType: 'Shared Ride',
      time: 'Today at 4:30 PM',
      status: 'Scheduled',
    },
  ]);

  // Zone Hub form state
  const [zonePickup, setZonePickup] = useState('Current Location (Auto-detected)');
  const [zoneDestination, setZoneDestination] = useState('');
  const [zoneRideType, setZoneRideType] = useState('shared');
  const [passengerNotes, setPassengerNotes] = useState('');

  // Simulated Accepted Driver Details
  const [acceptedDriver, setAcceptedDriver] = useState({
    name: 'Marcus Chen',
    rating: '4.9',
    totalRides: '2,400+ rides',
    vehicleModel: 'Honda Civic',
    licensePlate: 'ABC-1234',
    eta: '3 mins away'
  });

  // Rating feedback state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Reminder state for scheduled rides
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [activeScheduledRide, setActiveScheduledRide] = useState(null);

  const handleCreateSchedule = () => {
    if (!scheduleDestination.trim() || !scheduleTimeInput.trim()) {
      Alert.alert("Missing Fields", "Please provide both a destination and a scheduled time.");
      return;
    }

    const minutesFromNow = parseInt(scheduleTimeInput, 10);
    if (isNaN(minutesFromNow)) {
      Alert.alert("Invalid Time", "Please enter valid minutes from now.");
      return;
    }

    if (minutesFromNow < 30) {
      Alert.alert("Too Soon", "Scheduled rides must be booked at least 30 minutes in advance. Use Zone Hub for instant live matching.");
      return;
    }
    if (minutesFromNow > 1440) {
      Alert.alert("Out of Range", "Rides can only be scheduled up to 24 hours in advance.");
      return;
    }

    // TODO: POST schedule payload to backend database
    const newRide = {
      id: Date.now().toString(),
      pickup: schedulePickup,
      destination: scheduleDestination,
      rideType: scheduleRideType === 'shared' ? 'Shared Ride' : 'Private Ride',
      time: `In ${minutesFromNow} mins`,
      status: 'Scheduled',
    };

    setScheduledRides([newRide, ...scheduledRides]);
    setScheduleDestination('');
    setScheduleTimeInput('');
    Alert.alert("Ride Scheduled Successfully!", "Your ride is now visible under your Schedule tab.");
  };

  const trigger30MinReminder = (ride) => {
    setActiveScheduledRide(ride);
    setReminderModalVisible(true);
  };

  const handleReminderAction = (action) => {
    setReminderModalVisible(false);
    if (action === 'cancel') {
      // TODO: Call backend to cancel schedule
      setScheduledRides(scheduledRides.filter(r => r.id !== activeScheduledRide.id));
      Alert.alert("Ride Cancelled", "Your scheduled ride has been cancelled.");
    } else {
      setActiveSubTab('zone');
    }
  };

  const handleStartZoneSearch = () => {
    if (!zoneDestination.trim()) {
      Alert.alert("Destination Required", "Please enter your destination before searching for active drivers.");
      return;
    }

    // TODO: BACKEND INTEGRATION - POST /api/v1/rides/broadcast-search
    setRideStep('searching');

    setTimeout(() => {
      setRideStep('driver-found');
    }, 3500);
  };

  // Communication Handlers
  const handleCallDriver = () => {
    // TODO: Integrate native linking for phone calls e.g., Linking.openURL(`tel:${driverPhone}`)
    Alert.alert("Call Driver", `Connecting you securely with ${acceptedDriver.name}...`);
  };

  const handleTextDriver = () => {
    // TODO: Open in-app chat modal or message screen with driver
    Alert.alert("Text Driver", `Opening secure messaging with ${acceptedDriver.name}. Note: "${passengerNotes || 'Hello'}"`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>
          {rideStep === 'hub' && (activeSubTab === 'schedule' ? 'Schedule a Ride' : 'Zone Hub')}
          {rideStep === 'searching' && 'Searching for Drivers'}
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
                  <Text style={styles.locLabel}>PICKUP LOCATION</Text>
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

            <Text style={styles.sectionHeader}>SCHEDULE TIME (30m to 24h window)</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="Enter minutes from now (e.g. 45)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={scheduleTimeInput}
              onChangeText={setScheduleTimeInput}
            />

            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleCreateSchedule}>
              <Text style={styles.primaryButtonText}>Lock In Schedule</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionHeader, { marginTop: 24 }]}>YOUR SCHEDULED RIDES</Text>
            {scheduledRides.length === 0 ? (
              <Text style={styles.emptyText}>No scheduled rides found.</Text>
            ) : (
              scheduledRides.map((ride) => (
                <View key={ride.id} style={styles.historyCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDest}>{ride.destination}</Text>
                    <Text style={styles.historySub}>{ride.pickup} • {ride.rideType}</Text>
                    <Text style={styles.historyTime}>{ride.time}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{ride.status}</Text>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity style={styles.testReminderBtn} onPress={() => trigger30MinReminder(scheduledRides[0] || { id: 'test', destination: 'Library' })}>
              <Text style={styles.testReminderText}>[Test] Trigger 30-Min Reminder Popup</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= ZONE HUB TAB ================= */}
        {rideStep === 'hub' && activeSubTab === 'zone' && (
          <View>
            <View style={styles.zoneBannerCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.zoneLabel}>ZONE: CAMPUS CENTRAL</Text>
                <Text style={styles.zoneSub}>12 Active Drivers Nearby • Avg 3m wait</Text>
              </View>
              <View style={styles.liveIndicatorBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.locationCard}>
              <View style={styles.locRow}>
                <Ionicons name="locate" size={18} color={BLUE} style={{ marginLeft: -1 }} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.locLabel}>CURRENT LOCATION (Auto / Editable)</Text>
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
                    placeholder="Where are you going?"
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

            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleStartZoneSearch}>
              <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>SEARCH ZONE DRIVERS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= STEP 2: SEARCHING ================= */}
        {rideStep === 'searching' && (
          <View style={styles.searchingContainer}>
            <View style={styles.searchMapCard}>
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 20 }}>
                <View style={styles.mapOverlayDark} />
                <View style={styles.radarCenterWrapper}>
                  <View style={styles.radarPulseRing1} />
                  <View style={styles.radarPulseRing2} />
                  <View style={styles.radarCoreDot}>
                    <MaterialCommunityIcons name="car" size={20} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.searchStatusPill}>
                  <View style={styles.greenDotPulse} />
                  <Text style={styles.searchStatusPillText}>Broadcasting to Zone Drivers...</Text>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.searchSummaryCard}>
              <View style={styles.summaryHeaderRow}>
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>{zoneRideType.toUpperCase()} RIDE</Text>
                </View>
                <Text style={styles.summaryEstTime}>Est. Match: ~30s</Text>
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

            <TouchableOpacity style={styles.proCancelButton} activeOpacity={0.85} onPress={() => setRideStep('hub')}>
              <Text style={styles.proCancelButtonText}>Cancel Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= STEP 3: DRIVER FOUND ================= */}
        {rideStep === 'driver-found' && (
          <View style={styles.foundContainer}>
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={24} color={GREEN_TEXT} />
              <Text style={styles.successBannerText}>Driver Accepted Your Request!</Text>
            </View>

            <View style={styles.mapCard}>
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 16 }}>
                <View style={styles.mapPinIndicator} />
              </ImageBackground>
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

              {/* Call & Text Actions */}
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

              {passengerNotes ? (
                <View style={styles.passengerNotesBox}>
                  <Ionicons name="document-text-outline" size={16} color={NAVY} />
                  <Text style={styles.passengerNotesText}>Notes: {passengerNotes}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={() => setRideStep('en-route')}>
                <Text style={styles.primaryButtonText}>TRACK ACCEPTED DRIVER</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 4: EN ROUTE TRACKING ================= */}
        {rideStep === 'en-route' && (
          <View style={styles.trackingContainer}>
            <View style={styles.mapCardLarge}>
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 16 }}>
                <View style={styles.floatingStatusPill}>
                  <View style={styles.greenDot} />
                  <Text style={styles.mapPillText}>Driver is en route to pickup point</Text>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.sheetStandalone}>
              <View style={styles.driverProfileRow}>
                <View style={styles.avatarWrap}>
                  <FontAwesome5 name="user-alt" size={22} color={BLUE} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.driverName}>{acceptedDriver.name}</Text>
                  <Text style={styles.driverMeta}>{acceptedDriver.vehicleModel} • {acceptedDriver.licensePlate}</Text>
                </View>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={handleCallDriver}>
                  <Ionicons name="call-outline" size={18} color={NAVY} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconCircleBtn, { marginLeft: 8 }]} onPress={handleTextDriver}>
                  <Ionicons name="chatbubble-outline" size={18} color={NAVY} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.simulationBtn} onPress={() => setRideStep('arrived')}>
                <Text style={styles.simulationBtnText}>[Simulate Driver Arrival]</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 5: ARRIVED ================= */}
        {rideStep === 'arrived' && (
          <View style={styles.arrivedContainer}>
            <View style={styles.arrivedAlertBanner}>
              <Ionicons name="notifications" size={22} color={NAVY} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.arrivedTitle}>Your driver has arrived!</Text>
                <Text style={styles.arrivedSub}>Please board the car at your pickup zone.</Text>
              </View>
            </View>

            <View style={styles.mapCard}>
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 16 }} />
            </View>

            <View style={styles.driverHighlightCard}>
              <View style={styles.driverProfileRow}>
                <View style={styles.avatarWrap}>
                  <FontAwesome5 name="user-alt" size={20} color={BLUE} />
                </View>
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
              <ImageBackground source={{ uri: MAP_URI }} style={styles.mapImage} imageStyle={{ borderRadius: 16 }}>
                <View style={styles.floatingStatusPill}>
                  <View style={styles.greenDot} />
                  <Text style={styles.mapPillText}>Tracking trip to {zoneDestination || 'Destination'}</Text>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.sheetStandalone}>
              <Text style={styles.sectionTitle}>ACTIVE TRIP IN PROGRESS</Text>
              <Text style={styles.tripDestText}>Destination: {zoneDestination || 'Engineering Building'}</Text>

              <TouchableOpacity style={styles.primaryButton} onPress={() => setRideStep('completed')}>
                <Text style={styles.primaryButtonText}>[Simulate Arrival at Destination]</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 7: COMPLETED ================= */}
        {rideStep === 'completed' && (
          <View style={styles.completedContainer}>
            <View style={styles.successCheckWrap}>
              <Ionicons name="checkmark" size={32} color="#fff" />
            </View>
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

              {/* Optimized compact review button */}
              <TouchableOpacity 
                style={styles.compactReviewButton} 
                activeOpacity={0.85}
                onPress={() => {
                  Alert.alert("Thank you!", "Your feedback has been recorded.");
                  setRideStep('hub');
                  setActiveSubTab('schedule');
                }}
              >
                <Text style={styles.compactReviewButtonText}>Submit Review & Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Reminder Modal */}
      <Modal
        visible={reminderModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reminderContent}>
            <View style={styles.warningIconWrap}>
              <Ionicons name="time-outline" size={28} color={BLUE} />
            </View>
            <Text style={styles.reminderTitle}>Upcoming Ride Reminder</Text>
            <Text style={styles.reminderSub}>
              Your scheduled ride to {activeScheduledRide?.destination} goes live in 30 minutes. Do you wish to continue or cancel?
            </Text>

            <View style={styles.reminderBtnRow}>
              <TouchableOpacity style={styles.cancelRideOptionBtn} onPress={() => handleReminderAction('cancel')}>
                <Text style={styles.cancelRideOptionText}>Cancel Ride</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.continueRideOptionBtn} onPress={() => handleReminderAction('continue')}>
                <Text style={styles.continueRideOptionText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

  primaryButton: { backgroundColor: NAVY, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, elevation: 3 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  // Call & Text action row styling inside driver found state
  actionButtonRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: BORDER, borderRadius: 12, height: 42, gap: 6 },
  actionButtonText: { fontSize: 13, fontWeight: '700', color: NAVY },

  // Professional Searching Styles
  searchingContainer: { paddingHorizontal: 4 },
  searchMapCard: { height: 260, width: '100%', borderRadius: 24, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: BORDER, position: 'relative' },
  mapOverlayDark: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16, 32, 107, 0.2)' },
  
  radarCenterWrapper: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -40 }, { translateY: -40 }], width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  radarPulseRing1: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(47, 107, 255, 0.25)' },
  radarPulseRing2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(47, 107, 255, 0.12)' },
  radarCoreDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, elevation: 6 },

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
  mapImage: { flex: 1, justifyContent: 'flex-end', padding: 12, position: 'relative' },
  mapPinIndicator: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff', alignSelf: 'center', marginBottom: 40 },
  floatingStatusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
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
  passengerNotesBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 6, marginBottom: 16 },
  passengerNotesText: { fontSize: 12, color: MUTED, flex: 1 },

  trackingContainer: {},
  sheetStandalone: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  iconCircleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  simulationBtn: { marginTop: 12, alignItems: 'center', padding: 8 },
  simulationBtnText: { color: BLUE, fontSize: 13, fontWeight: '700' },

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

  // Optimized compact review button style
  compactReviewButton: { backgroundColor: NAVY, height: 46, borderRadius: 14, width: '100%', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  compactReviewButtonText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },

  historyCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
  historyDest: { fontSize: 16, fontWeight: '800', color: TEXT },
  historySub: { fontSize: 13, color: MUTED, marginTop: 2 },
  historyTime: { fontSize: 12, fontWeight: '700', color: BLUE, marginTop: 6 },
  statusBadge: { backgroundColor: TAB_ACTIVE_BG, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800', color: NAVY },
  emptyText: { textAlign: 'center', color: MUTED, marginTop: 20, fontSize: 14 },
  testReminderBtn: { marginTop: 14, alignItems: 'center', padding: 10 },
  testReminderText: { fontSize: 12, color: BLUE, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  reminderContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center' },
  warningIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: TAB_ACTIVE_BG, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  reminderTitle: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 8, textAlign: 'center' },
  reminderSub: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  reminderBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelRideOptionBtn: { flex: 1, backgroundColor: '#F1F5F9', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelRideOptionText: { color: '#EF4444', fontWeight: '800', fontSize: 14 },
  continueRideOptionBtn: { flex: 1, backgroundColor: NAVY, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  continueRideOptionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

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