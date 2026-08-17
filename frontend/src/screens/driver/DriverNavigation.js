// DriverNavigation.js
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";  
import api from "../../api/axios";
import { getPersistentSocket } from "../../api/socketHelper";

const { width } = Dimensions.get("window");

const DriverNavigation = ({
  onBack,
  onTripCompleted,
  onCancelNoPenalty,
  onChangeTab,
  rideData,
}) => {
  const { theme, darkModeEnabled } = useTheme();  
  
  const [currentRideData, setCurrentRideData] = useState(rideData || {});
  const [isFetchingRide, setIsFetchingRide] = useState(true);

  // 🔑 Guaranteed ID Extraction supporting MongoDB `_id` and `id`
  const rideId = 
    currentRideData?._id || 
    currentRideData?.id || 
    currentRideData?.rideId;

  // 🔑 Force fresh backend fetch on mount to guarantee populated passenger details
  useEffect(() => {
    let isMounted = true;

    const fetchRideDetails = async () => {
      if (!rideId) {
        if (isMounted) setIsFetchingRide(false);
        return;
      }

      try {
        console.log(`🔍 Fetching fresh populated ride data for ID: ${rideId}`);
        const response = await api.get(`/rides/${rideId}`);
        if (isMounted && response.data?.success && response.data?.data) {
          console.log("✅ Successfully populated ride details from backend");
          setCurrentRideData(response.data.data);
        }
      } catch (error) {
        console.error("❌ Failed to fetch ride details:", error.response?.data || error.message);
      } finally {
        if (isMounted) setIsFetchingRide(false);
      }
    };

    fetchRideDetails();

    return () => {
      isMounted = false;
    };
  }, [rideId]);

  const [rideStatus, setRideStatus] = useState(currentRideData?.status || "accepted");
  const [secondsWaiting, setSecondsWaiting] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [driverHeading, setDriverHeading] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const mapRef = useRef(null);

  // 🔑 Bulletproof Passenger Name Extraction
  const passengerName = 
    currentRideData?.passenger?.fullName || 
    currentRideData?.passengerName || 
    currentRideData?.name || 
    currentRideData?.passenger?.name ||
    "Student Rider";

  // 🔑 Bulletproof Passenger Phone Extraction for Calling
  const passengerPhone = 
    currentRideData?.passenger?.phoneNumber || 
    currentRideData?.passengerPhone || 
    currentRideData?.phone ||
    currentRideData?.passenger?.phone ||
    null;

  // 🔑 Exact Pickup Location Extraction
  const pickupLocText = 
    currentRideData?.pickupLocation || 
    currentRideData?.pickup || 
    currentRideData?.location ||
    "Campus Pickup Point";

  // 🔑 Exact Dropoff Location Extraction
  const dropoffLocText = 
    currentRideData?.dropoffLocation || 
    currentRideData?.destination || 
    currentRideData?.dropoff ||
    "Campus Destination";

  // 🔑 Robust Coordinate Parser for MongoDB GeoJSON & Arrays [lng, lat]
  const parseCoordinates = (targetData, fallbackLat, fallbackLng) => {
    if (!targetData) return { latitude: fallbackLat, longitude: fallbackLng };
    if (targetData.coordinates && Array.isArray(targetData.coordinates) && targetData.coordinates.length >= 2) {
      return { latitude: Number(targetData.coordinates[1]), longitude: Number(targetData.coordinates[0]) };
    }
    if (Array.isArray(targetData) && targetData.length >= 2) {
      return { latitude: Number(targetData[1]), longitude: Number(targetData[0]) };
    }
    if (targetData.latitude !== undefined && targetData.longitude !== undefined) {
      return { latitude: Number(targetData.latitude), longitude: Number(targetData.longitude) };
    }
    return { latitude: fallbackLat, longitude: fallbackLng };
  };

  const pickupCoords = useMemo(() => parseCoordinates(
    currentRideData?.pickupCoordinates || currentRideData?.pickupLocationCoordinates || currentRideData?.location, 
    5.6037, 
    -0.1870
  ), [currentRideData]);

  const dropoffCoords = useMemo(() => parseCoordinates(
    currentRideData?.dropoffCoordinates || currentRideData?.destinationCoordinates, 
    5.6595, 
    -0.1852
  ), [currentRideData]);

  const [driverCoords, setDriverCoords] = useState(pickupCoords);

  const activeTargetCoords = (rideStatus === "in_progress" || rideStatus === "completed") 
    ? dropoffCoords 
    : pickupCoords;

  useEffect(() => {
    if (mapRef.current && pickupCoords.latitude !== 5.6037) {
      mapRef.current.fitToCoordinates([driverCoords, pickupCoords], {
        edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
        animated: true,
      });
    }
  }, [pickupCoords.latitude, pickupCoords.longitude]);

  useEffect(() => {
    let isMounted = true;

    const fetchRoadRoute = async (start, end) => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (isMounted && data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(coord => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          setRouteCoordinates(coords);
        }
      } catch (error) {
        if (isMounted) setRouteCoordinates([start, end]);
      }
    };

    if (driverCoords && activeTargetCoords) {
      fetchRoadRoute(driverCoords, activeTargetCoords);
    }

    return () => {
      isMounted = false;
    };
  }, [driverCoords, activeTargetCoords]);

  useEffect(() => {
    let positionSubscription;
    let socketInstance;

    const initTracking = async () => {
      try {
        socketInstance = await getPersistentSocket();

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        let initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const liveLat = initialLoc.coords.latitude;
        const liveLng = initialLoc.coords.longitude;

        const initCoords = (Math.abs(liveLat - pickupCoords.latitude) > 0.2) 
          ? pickupCoords 
          : { latitude: liveLat, longitude: liveLng };

        setDriverCoords(initCoords);

        positionSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 3,
          },
          (location) => {
            const coords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setDriverCoords(coords);

            if (location.coords.heading >= 0) {
              setDriverHeading(location.coords.heading);
            }

            if (socketInstance && rideId) {
              socketInstance.emit("driver:location-update", {
                rideId,
                latitude: coords.latitude,
                longitude: coords.longitude,
                lat: coords.latitude,
                lng: coords.longitude,
                heading: location.coords.heading || 0,
              });
            }
          },
        );
      } catch (err) {
        console.error("Telemetry error:", err);
      }
    };

    initTracking();
    return () => {
      if (positionSubscription) positionSubscription.remove();
    };
  }, [rideId, pickupCoords.latitude, pickupCoords.longitude]);

  useEffect(() => {
    let interval = null;
    if (rideStatus === "arrived") {
      interval = setInterval(() => {
        setSecondsWaiting((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [rideStatus]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isCancellationEligible = secondsWaiting >= 300;

  const handleRecenterMap = () => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(routeCoordinates.length > 0 ? routeCoordinates : [driverCoords, activeTargetCoords], {
        edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
        animated: true,
      });
    }
  };

  const handlePrimaryAction = async () => {
    if (!rideId) {
      Alert.alert("Error", "Invalid ride reference.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (rideStatus === "accepted") {
        const response = await api.put(`/rides/${rideId}/status`, { status: "arrived" });
        if (response.data?.success) setRideStatus("arrived");
      } else if (rideStatus === "arrived") {
        const response = await api.put(`/rides/${rideId}/status`, { status: "in_progress" });
        if (response.data?.success) {
          setRideStatus("in_progress");
          handleRecenterMap();
        }
      } else if (rideStatus === "in_progress") {
        const response = await api.put(`/rides/${rideId}/status`, { status: "completed" });
        if (response.data?.success) {
          setRideStatus("completed");
          if (onTripCompleted) onTripCompleted();
        }
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error?.message || "Failed to update ride status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRide = async () => {
    if (!rideId) return;
    try {
      setIsSubmitting(true);
      const response = await api.post(`/rides/${rideId}/cancel-no-penalty`);
      if (response.data?.success && onCancelNoPenalty) {
        onCancelNoPenalty();
      }
    } catch (error) {
      Alert.alert("Error", "Could not complete cancellation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallPassenger = () => {
    if (passengerPhone && passengerPhone !== "N/A") {
      Linking.openURL(`tel:${passengerPhone}`);
    } else {
      Alert.alert("Unavailable", "Passenger phone number is not available.");
    }
  };

  if (isFetchingRide) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.iconColor} />
        <Text style={{ color: theme.subText, marginTop: 12, fontWeight: "600" }}>Loading passenger details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <StatusBar style={theme.statusBar} />

      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.tabBarBorder }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.headerButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitleText, { color: theme.iconColor }]}>
          {rideStatus === "in_progress" ? "In Transit to Drop-off" : rideStatus === "arrived" ? "At Pickup Point" : "Navigating to Pickup"}
        </Text>
        <TouchableOpacity onPress={handleRecenterMap} activeOpacity={0.7} style={styles.headerButton}>
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.iconColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapViewportContainer}>
        <MapView
          key={`${pickupCoords.latitude}-${pickupCoords.longitude}`}
          ref={mapRef}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : null}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: pickupCoords.latitude,
            longitude: pickupCoords.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
          showsCompass={false}
          showsPointsOfInterest={false}
          showsBuildings={false}
        >
          {routeCoordinates.length > 0 && (
            <Polyline coordinates={routeCoordinates} strokeColor="#2563EB" strokeWidth={5} />
          )}

          <Marker coordinate={driverCoords} anchor={{ x: 0.5, y: 0.5 }} flat={true}>
            <View style={[styles.driverLocatorCircle, { backgroundColor: theme.iconColor, borderColor: theme.background }]}>
              <MaterialCommunityIcons name="navigation" size={18} color="#FFFFFF" style={{ transform: [{ rotate: `${driverHeading}deg` }] }} />
            </View>
          </Marker>

          <Marker coordinate={activeTargetCoords} anchor={{ x: 0.5, y: 1.0 }}>
            <View style={styles.pickupMarkerContainer}>
              <View style={[styles.pickupLabelBadge, { backgroundColor: theme.iconColor }, rideStatus === "in_progress" && styles.dropoffBadgeVariant]}>
                <Text style={[styles.pickupLabelText, { color: rideStatus === "in_progress" ? "#1E3A8A" : "#FFFFFF" }]}>
                  {rideStatus === "in_progress" ? "DROP-OFF" : "PICKUP"}
                </Text>
              </View>
              <View style={[styles.pickupPinNode, { backgroundColor: theme.iconColor }, rideStatus === "in_progress" && styles.dropoffPinVariant]}>
                <View style={[styles.pickupPinInnerNode, { backgroundColor: theme.background }]} />
              </View>
            </View>
          </Marker>
        </MapView>

        {/* Passenger Information Card */}
        <View style={[styles.passengerSheet, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
          <View style={styles.profileMasterRow}>
            <View style={styles.avatarContainerMock}>
              <Text style={styles.avatarEmojiMock}>👩‍🎓</Text>
            </View>

            <View style={styles.identityTextBlock}>
              <Text style={[styles.passengerNameText, { color: theme.mainText }]} numberOfLines={1}>
                {passengerName}
              </Text>
              <View style={styles.subLocationRow}>
                <MaterialCommunityIcons name="routes" size={14} color={theme.subText} />
                <Text style={[styles.subLocationLabel, { color: theme.subText }]} numberOfLines={1}>
                  {rideStatus === "in_progress" ? dropoffLocText : pickupLocText}
                </Text>
              </View>
            </View>

            <View style={styles.communicationButtonsGroup}>
              <TouchableOpacity
                style={[styles.commsCircleButton, { backgroundColor: theme.background, borderColor: theme.borderColor }]}
                activeOpacity={0.7}
                onPress={handleCallPassenger}
              >
                <MaterialCommunityIcons name="phone" size={18} color={theme.mainText} />
              </TouchableOpacity>
            </View>
          </View>

          {rideStatus === "in_progress" ? (
            <View style={[styles.transitTrackingBanner, { backgroundColor: theme.iconWrap, borderColor: theme.tabBarBorder }]}>
              <MaterialCommunityIcons name="rocket-launch" size={16} color={theme.iconColor} />
              <Text style={[styles.transitTextContent, { color: theme.iconColor }]}>Trip in progress. Navigating to drop-off.</Text>
            </View>
          ) : rideStatus === "arrived" ? (
            <View style={[styles.timerTrackingBanner, { backgroundColor: theme.iconWrap, borderColor: theme.tabBarBorder }, isCancellationEligible && styles.timerAlertBannerVariant]}>
              <MaterialCommunityIcons name={isCancellationEligible ? "alert-circle" : "clock-outline"} size={16} color={isCancellationEligible ? "#EF4444" : theme.iconColor} />
              <Text style={[styles.timerTrackingLabel, { color: theme.iconColor }, isCancellationEligible && styles.timerAlertLabelVariant]}>
                {isCancellationEligible ? <Text>Passenger late. <Text style={styles.boldText}>Penalty-free cancellation active.</Text></Text> : <Text>Waiting for passenger: <Text style={[styles.timerCountdownValue, { color: theme.iconColor }]}>{formatTime(secondsWaiting)}</Text></Text>}
              </Text>
            </View>
          ) : (
            <View style={[styles.instructionNoteBanner, { backgroundColor: theme.background, borderColor: theme.borderColor }]}>
              <MaterialCommunityIcons name="information" size={16} color={theme.iconColor} />
              <Text style={[styles.instructionTextContent, { color: theme.subText }]}>In-app navigation active. Follow route to pickup station.</Text>
            </View>
          )}

          <View style={styles.actionButtonsStack}>
            {rideStatus === "arrived" && isCancellationEligible && (
              <TouchableOpacity style={styles.cancelRideButton} activeOpacity={0.85} onPress={handleCancelRide} disabled={isSubmitting}>
                <Text style={styles.cancelButtonText}>Cancel Ride (No Penalty)</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryActionButton,
                { backgroundColor: theme.iconColor },
                rideStatus === "arrived" && styles.startTripButtonVariant,
                rideStatus === "in_progress" && styles.endTripButtonVariant,
              ]}
              activeOpacity={0.85}
              onPress={handlePrimaryAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.primaryButtonText, rideStatus === "arrived" && { color: "#1E3A8A" }]}>
                  {rideStatus === "in_progress" ? "End Trip   🏁" : rideStatus === "arrived" ? "Start Trip   ➔" : "Arrived at Pickup   ✓"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionButtonsStack: { flexDirection: "column", gap: 12 },
  avatarContainerMock: { height: 60, width: 60, justifyContent: "center", alignItems: "center" },
  avatarEmojiMock: { fontSize: 40 },
  boldText: { fontWeight: "800" },
  cancelButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  cancelRideButton: { alignItems: "center", backgroundColor: "#EF4444", borderRadius: 16, height: 56, justifyContent: "center" },
  commsCircleButton: { alignItems: "center", borderRadius: 16, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  communicationButtonsGroup: { flexDirection: "row", gap: 10 },
  container: { flex: 1 },
  driverLocatorCircle: { alignItems: "center", borderRadius: 18, borderWidth: 3, height: 36, justifyContent: "center", width: 36 },
  dropoffBadgeVariant: { backgroundColor: "#A3E635" },
  dropoffPinVariant: { backgroundColor: "#A3E635" },
  endTripButtonVariant: { backgroundColor: "#EF4444" },
  header: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 14 },
  headerButton: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  headerTitleText: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  identityTextBlock: { flex: 1, justifyContent: "center", marginLeft: 16 },
  instructionNoteBanner: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 20, padding: 14 },
  instructionTextContent: { flex: 1, fontSize: 12, fontWeight: "500", lineHeight: 16 },
  mapViewportContainer: { flex: 1, position: "relative" },
  passengerNameText: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  passengerSheet: { borderRadius: 16, borderWidth: 1, bottom: 16, left: 16, padding: 20, position: "absolute", right: 16 },
  pickupLabelBadge: { borderRadius: 8, marginBottom: -2, paddingHorizontal: 10, paddingVertical: 4, zIndex: 10 },
  pickupLabelText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  pickupMarkerContainer: { alignItems: "center", justifyContent: "center" },
  pickupPinInnerNode: { borderRadius: 4, height: 8, width: 8 },
  pickupPinNode: { alignItems: "center", borderColor: "#FFFFFF", borderRadius: 12, borderWidth: 2, height: 24, justifyContent: "center", width: 24 },
  primaryActionButton: { alignItems: "center", borderRadius: 16, height: 56, justifyContent: "center" },
  primaryButtonText: { fontSize: 15, fontWeight: "700" },
  profileMasterRow: { alignItems: "center", flexDirection: "row", marginBottom: 16 },
  startTripButtonVariant: { backgroundColor: "#A3E635" },
  subLocationLabel: { fontSize: 13, fontWeight: "600", width: width * 0.34 },
  subLocationRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  timerAlertBannerVariant: { borderColor: "#FCA5A5", backgroundColor: "#FEE2E2" },
  timerAlertLabelVariant: { color: "#EF4444" },
  timerCountdownValue: { fontWeight: "800" },
  timerTrackingBanner: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 20, padding: 14 },
  timerTrackingLabel: { fontSize: 13, fontWeight: "600" },
  transitTrackingBanner: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 20, padding: 14 },
  transitTextContent: { flex: 1, fontSize: 12, fontWeight: "600" },
});

export default DriverNavigation;