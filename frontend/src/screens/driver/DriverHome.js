import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";  
import api from "../../api/axios";
import { getPersistentSocket } from "../../api/socketHelper";

const { width, height } = Dimensions.get("window");

const DriverHome = ({ driverData, onLogout, onViewRequests, onChangeTab }) => {
  const { theme, darkModeEnabled } = useTheme();  
  const [isOnline, setIsOnline] = useState(driverData?.isOnline ?? true);
  const [analytics, setAnalytics] = useState({ dailyTrips: 0, totalTrips: 0 });
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [driverLocation, setDriverLocation] = useState({
    latitude: 5.6037,
    longitude: -0.1870,
    latitudeDelta: 0.015,
    longitudeDelta: 0.012,
  });

  const mapRef = useRef(null);
  const isOnlineRef = useRef(isOnline);
  
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Properly sync online/offline state change with backend database
  const toggleOnlineStatus = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState); // Optimistic UI update

    try {
      await api.put("/driver/location", {
        isOnline: nextState,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
      });
    } catch (error) {
      console.error("Failed to update online status on backend:", error.message);
      setIsOnline(!nextState); // Revert on failure
      Alert.alert("Status Sync Error", "Could not update your online status. Please check your connection.");
    }
  };

  // PERSISTENT REAL-TIME SOCKET CONNECTION
  useEffect(() => {
    let activeSocket = null;

    const initSocket = async () => {
      activeSocket = await getPersistentSocket();

      activeSocket.on("driver:remove-request", (rideId) => {
        setNearbyRequests((prevRequests) =>
          prevRequests.filter((req) => (req.id || req._id) !== rideId)
        );
      });

      activeSocket.on("driver:incoming-broadcast", (newRequest) => {
        if (newRequest.status && newRequest.status !== 'pending') return;
        if (isOnlineRef.current) {
          setNearbyRequests((prev) => {
            const reqId = newRequest.id || newRequest._id;
            const exists = prev.some(r => (r.id || r._id) === reqId);
            if (exists) return prev;
            
            const formatted = {
              ...newRequest,
              id: newRequest._id || newRequest.id,
              pickupLocation: newRequest.pickupLocation || newRequest.pickup,
              dropoffLocation: newRequest.dropoffLocation || newRequest.destination,
            };
            return [formatted, ...prev];
          });
        }
      });

      activeSocket.on("driver:incoming-request", (newRequest) => {
        console.log("📥 Targeted Driver Request Received:", newRequest);
        if (newRequest.status && newRequest.status !== 'pending') return;
        if (isOnlineRef.current) {
          setNearbyRequests((prev) => {
            const reqId = newRequest.id || newRequest._id;
            const exists = prev.some(r => (r.id || r._id) === reqId);
            if (exists) return prev;
            
            const formatted = {
              ...newRequest,
              id: newRequest._id || newRequest.id,
              pickupLocation: newRequest.pickupLocation || newRequest.pickup,
              dropoffLocation: newRequest.dropoffLocation || newRequest.destination,
            };
            return [formatted, ...prev];
          });
        }
      });
    };

    initSocket();
  }, []);

  useEffect(() => {
    const fetchNotificationBadgeCount = async () => {
      try {
        const response = await api.get("/driver/notifications");
        if (response.data?.success) {
          setUnreadNotifications(response.data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Failed to parse notifications data logs stream:", err);
      }
    };

    fetchNotificationBadgeCount();
    const badgeSyncInterval = setInterval(fetchNotificationBadgeCount, 10000);
    return () => clearInterval(badgeSyncInterval);
  }, []);

  const formatBadgeText = (count) => {
    if (count <= 0) return "";
    return count > 9 ? "9+" : `${count}`;
  };

  useEffect(() => {
    const fetchDriverStats = async () => {
      try {
        setLoadingAnalytics(true);
        const response = await api.get("/driver/analytics");
        if (response.data?.success && response.data?.data) {
          setAnalytics({
            dailyTrips: response.data.data.dailyTrips || 0,
            totalTrips: response.data.data.totalTrips || 0,
          });
        }
      } catch (error) {
        console.error("Failed to sync metrics from analytics gateway:", error);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchDriverStats();
  }, []);

  useEffect(() => {
    const fetchNearbyFares = async () => {
      if (!isOnline) {
        setNearbyRequests([]);
        return;
      }
      try {
        const response = await api.get("/rides/pending");
        if (response.data?.success && response.data?.data) {
          const pendingRides = response.data.data.filter(r => r.status === 'pending');
          setNearbyRequests(pendingRides);
        }
      } catch (error) {
        console.error("Error streaming nearby campus dispatches:", error.message);
      }
    };

    fetchNearbyFares();
    const mapSyncInterval = setInterval(fetchNearbyFares, 3000);

    return () => clearInterval(mapSyncInterval);
  }, [isOnline]);

  // 🔑 Continuous live GPS tracking & map animation with sync safeguards
  useEffect(() => {
    let locationSubscription;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Location permission denied. Using default campus fallbacks.");
          return;
        }

        const initialLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const latitude = initialLoc.coords.latitude;
        const longitude = initialLoc.coords.longitude;

        const newCoords = { latitude, longitude, latitudeDelta: 0.015, longitudeDelta: 0.012 };
        setDriverLocation(newCoords);

        if (mapRef.current) {
          mapRef.current.animateToRegion(newCoords, 1000);
        }

        await api.put("/driver/location", {
          latitude,
          longitude,
          isOnline: isOnlineRef.current,
        }).catch(err => console.error("Initial GPS sync error:", err.message));

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 3,
          },
          async (updatedLoc) => {
            const newLat = updatedLoc.coords.latitude;
            const newLng = updatedLoc.coords.longitude;

            const updatedCoords = {
              latitude: newLat,
              longitude: newLng,
              latitudeDelta: 0.015,
              longitudeDelta: 0.012,
            };

            setDriverLocation(updatedCoords);

            if (mapRef.current) {
              mapRef.current.animateToRegion(updatedCoords, 1000);
            }

            try {
              await api.put("/driver/location", {
                latitude: newLat,
                longitude: newLng,
                isOnline: isOnlineRef.current,
              });
            } catch (err) {
              console.error("Live GPS broadcast error:", err.message);
            }
          },
        );
      } catch (err) {
        console.error("Location tracking engine initialization error:", err);
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar style={theme.statusBar} />

      {/* Top Header App Bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.tabBarBorder,
          },
        ]}
      >
        <Text style={[styles.logoText, { color: theme.iconColor }]}>
          CampusRide
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.driverName, { color: theme.mainText }]}>
            {driverData?.fullName?.split(" ")[0] || "Driver"}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onChangeTab("profile")}
            style={styles.avatarContainer}
          >
            {driverData?.avatarUri || driverData?.avatar ? (
              <Image
                source={{ uri: driverData.avatarUri || driverData.avatar }}
                style={styles.avatarImage}
              />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.borderColor,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color={theme.iconColor}
                />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.7}
            onPress={() => onChangeTab("notifications")}
          >
            <View style={styles.iconBadgeWrapper}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color={theme.iconColor}
              />
              {unreadNotifications > 0 && (
                <View style={styles.badgePillContainer}>
                  <Text style={styles.badgeText}>
                    {formatBadgeText(unreadNotifications)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Go Online Switch Card */}
      <View
        style={[
          styles.toggleCardContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <View
          style={[
            styles.toggleCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <View style={styles.toggleCardTextColumn}>
            <Text style={[styles.toggleCardTitle, { color: theme.mainText }]}>
              {isOnline ? "Go Offline" : "Go Online"}
            </Text>
            <Text
              style={[styles.toggleCardSubtitle, { color: theme.subText }]}
              numberOfLines={1}
            >
              {isOnline
                ? "Ready to accept ride requests"
                : "Stay offline to pause requests"}
            </Text>
          </View>
          <Switch
            trackColor={{ false: "#E2E8F0", true: "#A3E635" }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E2E8F0"
            onValueChange={toggleOnlineStatus}
            value={isOnline}
          />
        </View>
      </View>

      {/* Map Viewport Area */}
      <View style={styles.mapViewportContainer}>
        <MapView
          ref={mapRef}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : null}
          style={StyleSheet.absoluteFillObject}
          initialRegion={driverLocation}
          showsCompass={false}
          showsPointsOfInterest={true}
          customMapStyle={darkModeEnabled ? darkMapStyle : []}
        >
          {isOnline && (
            <>
              <Marker
                coordinate={{
                  latitude: driverLocation.latitude,
                  longitude: driverLocation.longitude,
                }}
              >
                <View
                  style={[
                    styles.driverPulseOuter,
                    { borderColor: theme.borderColor },
                  ]}
                >
                  <View
                    style={[
                      styles.driverPulseInner,
                      { backgroundColor: theme.iconColor },
                    ]}
                  />
                </View>
              </Marker>

              {nearbyRequests.map((request) => {
                const reqId = request.id || request._id;
                
                const lat = parseFloat(
                  request.latitude || 
                  request.pickupCoordinates?.coordinates?.[1] || 
                  request.coordinates?.[1]
                );
                const lng = parseFloat(
                  request.longitude || 
                  request.pickupCoordinates?.coordinates?.[0] || 
                  request.coordinates?.[0]
                );

                if (isNaN(lat) || isNaN(lng)) return null;

                return (
                  <Marker
                    key={reqId}
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={request.pickupLocation || request.pickup || "Ride Request"}
                  >
                    <View
                      style={[
                        styles.passengerPin,
                        { backgroundColor: theme.iconColor },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account"
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>
                  </Marker>
                );
              })}
            </>
          )}
        </MapView>

        {/* Map Overlay Status Badge */}
        <View
          style={[
            styles.mapStatusBadge,
            {
              backgroundColor: isOnline ? theme.iconWrap : theme.cardBackground,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? "#A3E635" : theme.subText },
            ]}
          />
          <Text
            style={[
              styles.mapStatusBadgeText,
              { color: isOnline ? theme.iconColor : theme.subText },
            ]}
          >
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Text>
        </View>

        {/* Floating Context Summary Drawer */}
        <View
          style={[
            styles.floatingStatusDrawer,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <View style={styles.drawerHeaderRow}>
            <View style={styles.drawerTextBlock}>
              <Text
                style={[
                  styles.drawerMainStatusTitle,
                  { color: theme.mainText },
                ]}
              >
                {isOnline ? "You are online" : "You are offline"}
              </Text>
              <Text
                style={[styles.drawerSubStatusTitle, { color: theme.subText }]}
                numberOfLines={1}
              >
                {isOnline
                  ? `${nearbyRequests.length} requests nearby`
                  : "Toggle online status to start tracking"}
              </Text>
            </View>
            <View
              style={[
                styles.drawerIconSquare,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.borderColor,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="routes"
                size={22}
                color={theme.iconColor}
              />
            </View>
          </View>

          {loadingAnalytics ? (
            <ActivityIndicator
              size="small"
              color={theme.iconColor}
              style={styles.analyticsLoader}
            />
          ) : (
            <Text style={[styles.metricsTextLine, { color: theme.subText }]}>
              Trips today:{" "}
              <Text
                style={[styles.metricsBoldValue, { color: theme.mainText }]}
              >
                {analytics.dailyTrips}
              </Text>{" "}
              • Total trips:{" "}
              <Text
                style={[styles.metricsBoldValue, { color: theme.mainText }]}
              >
                {analytics.totalTrips}
              </Text>
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.iconColor },
              !isOnline && styles.disabledActionButton,
            ]}
            activeOpacity={0.85}
            disabled={!isOnline}
            onPress={onViewRequests}
          >
            <Text style={styles.actionButtonText}>View Active Requests</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom App Nav Tab Bar Component */}
      <View
        style={[
          styles.tabBarContainer,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.tabBarBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab("home")}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.tabIconBackground,
              !darkModeEnabled && styles.activeTabIconBackground,
              darkModeEnabled && { backgroundColor: "#334155" },
            ]}
          >
            <MaterialCommunityIcons
              name="home"
              size={24}
              color={theme.iconColor}
            />
          </View>
          <Text
            style={[
              styles.tabLabelText,
              { color: theme.iconColor, fontWeight: "700" },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab("trips")}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="car-multiple"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.tabLabelText}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab("profile")}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.tabLabelText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  logoText: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  driverName: { fontSize: 14, fontWeight: "700" },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 18 },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  notificationBtn: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeWrapper: {
    position: "relative",
    padding: 2,
  },
  badgePillContainer: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },
  toggleCardContainer: { paddingHorizontal: 24, paddingVertical: 12 },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  toggleCardTextColumn: { flex: 1, paddingRight: 8 },
  toggleCardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  toggleCardSubtitle: { fontSize: 13, fontWeight: "500" },
  mapViewportContainer: { flex: 1, position: "relative" },
  mapStatusBadge: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    elevation: 2,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  mapStatusBadgeText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  passengerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    elevation: 3,
  },
  driverPulseOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    elevation: 4,
  },
  driverPulseInner: { width: 14, height: 14, borderRadius: 7 },
  floatingStatusDrawer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    elevation: 4,
  },
  drawerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  drawerTextBlock: { flex: 1, paddingRight: 12 },
  drawerMainStatusTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  drawerSubStatusTitle: { fontSize: 14, fontWeight: "500" },
  drawerIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  metricsTextLine: { fontSize: 13, fontWeight: "500", marginBottom: 16 },
  metricsBoldValue: { fontWeight: "700" },
  analyticsLoader: { alignSelf: "flex-start", marginBottom: 16 },
  actionButton: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  disabledActionButton: { backgroundColor: "#CBD5E1", elevation: 0 },
  actionButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  tabBarContainer: { flexDirection: "row", height: 74, borderTopWidth: 1 },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabIconBackground: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 2,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabIconBackground: { backgroundColor: "#F1F5F9" },
  tabLabelText: { fontSize: 11, fontWeight: "600", color: "#94A3B8" },
});

export default DriverHome;