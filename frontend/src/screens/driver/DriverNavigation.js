import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";  
import api from "../../api/axios";

const { width } = Dimensions.get("window");

const DriverNavigation = ({
  onBack,
  onArrive,
  onCancelNoPenalty,
  onChangeTab,
  passenger,
}) => {
  const { theme, darkModeEnabled } = useTheme();  
  const [hasArrived, setHasArrived] = useState(false);
  const [tripStarted, setTripStarted] = useState(false);
  const [secondsWaiting, setSecondsWaiting] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPassenger = passenger || {
    id: "req_lucy",
    name: "Lucy Amankwa",
    rating: "4.9",
    pickup: "Law Department",
    destination: "Engineering Block C",
    avatarEmoji: "👩‍🎓",
  };

  const [driverCoords, setDriverCoords] = useState({
    latitude: 5.6506,
    longitude: -0.1915,
  });

  const activeTargetCoords = tripStarted
    ? { latitude: 5.6595, longitude: -0.1852 }
    : { latitude: 5.6545, longitude: -0.1873 };

  useEffect(() => {
    let positionSubscription;

    const streamCoordinates = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        positionSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 4000,
            distanceInterval: 5,
          },
          (location) => {
            setDriverCoords({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          },
        );
      } catch (err) {
        console.error("Telemetry streaming engine error:", err);
      }
    };

    streamCoordinates();
    return () => {
      if (positionSubscription) positionSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let interval = null;
    if (hasArrived && !tripStarted) {
      interval = setInterval(() => {
        setSecondsWaiting((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasArrived, tripStarted]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isCancellationEligible = secondsWaiting >= 300;

  const navigationRegion = {
    latitude: (driverCoords.latitude + activeTargetCoords.latitude) / 2,
    longitude: (driverCoords.longitude + activeTargetCoords.longitude) / 2,
    latitudeDelta:
      Math.abs(driverCoords.latitude - activeTargetCoords.latitude) * 2 ||
      0.012,
    longitudeDelta:
      Math.abs(driverCoords.longitude - activeTargetCoords.longitude) * 2 ||
      0.01,
  };

  const routePathCoordinates = [driverCoords, activeTargetCoords];

  const handlePrimaryAction = async () => {
    const rideId = currentPassenger.id || currentPassenger._id;
    try {
      setIsSubmitting(true);

      if (!hasArrived) {
        const response = await api.put(`/rides/${rideId}/arrived`);
        if (response.data?.success) setHasArrived(true);
      } else if (!tripStarted) {
        const response = await api.put(`/rides/${rideId}/start`);
        if (response.data?.success) setTripStarted(true);
      } else {
        const response = await api.put(`/rides/${rideId}/complete`);
        if (response.data?.success && onArrive) {
          onArrive();
        }
      }
    } catch (error) {
      console.error("Navigation pipeline execution failure:", error);
      Alert.alert(
        "Server Synchronization Error",
        "Failed to transition state. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRide = async () => {
    const rideId = currentPassenger.id || currentPassenger._id;
    try {
      setIsSubmitting(true);
      const response = await api.post(`/rides/${rideId}/cancel-no-penalty`);
      if (response.data?.success && onCancelNoPenalty) {
        onCancelNoPenalty();
      }
    } catch (error) {
      console.error("Cancellation error:", error);
      Alert.alert("Error", "Could not complete cancellation at this moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <StatusBar style={theme.statusBar} />

      {/* Top Header Navigation Bar */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitleText, { color: theme.iconColor }]}>
          {tripStarted
            ? "In Transit to Drop-off"
            : hasArrived
              ? "At Pickup Point"
              : "Navigating to Pickup"}
        </Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.headerButton}>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={theme.iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* Map Viewport Canvas */}
      <View style={styles.mapViewportContainer}>
        <MapView
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : null}
          style={StyleSheet.absoluteFillObject}
          region={navigationRegion}
          showsCompass={false}
          showsPointsOfInterest={true}
          customMapStyle={darkModeEnabled ? darkMapStyle : []}
        >
          <Polyline
            coordinates={routePathCoordinates}
            strokeColor={tripStarted ? "#A3E635" : theme.iconColor}
            strokeWidth={4}
            lineDashPattern={[6, 6]}
          />

          <Marker coordinate={driverCoords}>
            <View style={[styles.driverLocatorCircle, { backgroundColor: theme.iconColor, borderColor: theme.background }]}>
              <MaterialCommunityIcons
                name="navigation"
                size={16}
                color="#FFFFFF"
                style={styles.driverNavIcon}
              />
            </View>
          </Marker>

          <Marker coordinate={activeTargetCoords}>
            <View style={styles.pickupMarkerContainer}>
              <View
                style={[
                  styles.pickupLabelBadge,
                  { backgroundColor: theme.iconColor },
                  tripStarted && styles.dropoffBadgeVariant,
                ]}
              >
                <Text style={[styles.pickupLabelText, { color: tripStarted ? "#1E3A8A" : "#FFFFFF" }]}>
                  {tripStarted ? "DROP-OFF" : "PICKUP"}
                </Text>
              </View>
              <View
                style={[
                  styles.pickupPinNode,
                  { backgroundColor: theme.iconColor },
                  tripStarted && styles.dropoffPinVariant,
                ]}
              >
                <View style={[styles.pickupPinInnerNode, { backgroundColor: theme.background }]} />
              </View>
            </View>
          </Marker>
        </MapView>

        <View style={styles.floatingControlsStack}>
          <TouchableOpacity style={[styles.mapUtilityButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]} activeOpacity={0.8}>
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={20}
              color={theme.mainText}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Ride Information Sheet */}
        <View style={[styles.passengerSheet, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
          <View style={styles.profileMasterRow}>
            <View style={styles.avatarContainerMock}>
              <Text style={styles.avatarEmojiMock}>
                {currentPassenger.avatarEmoji}
              </Text>
              <View style={[styles.ratingBadgeContainer, { borderColor: theme.borderColor }]}>
                <Text style={styles.ratingTextValue}>
                  ★ {currentPassenger.rating}
                </Text>
              </View>
            </View>

            <View style={styles.identityTextBlock}>
              <Text style={[styles.passengerNameText, { color: theme.mainText }]}>
                {currentPassenger.name}
              </Text>
              <View style={styles.subLocationRow}>
                <MaterialCommunityIcons
                  name="routes"
                  size={14}
                  color={theme.subText}
                />
                <Text style={[styles.subLocationLabel, { color: theme.subText }]} numberOfLines={1}>
                  {tripStarted
                    ? currentPassenger.destination
                    : currentPassenger.pickup}
                </Text>
              </View>
            </View>

            <View style={styles.communicationButtonsGroup}>
              <TouchableOpacity
                style={[styles.commsCircleButton, { backgroundColor: theme.background, borderColor: theme.borderColor }]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="phone"
                  size={18}
                  color={theme.mainText}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.commsCircleButton, { backgroundColor: theme.background, borderColor: theme.borderColor }]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="message-text"
                  size={18}
                  color={theme.mainText}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Conditional Layout Notification Banners */}
          {tripStarted ? (
            <View style={[styles.transitTrackingBanner, { backgroundColor: theme.iconWrap, borderColor: theme.tabBarBorder }]}>
              <MaterialCommunityIcons
                name="rocket-launch"
                size={16}
                color={theme.iconColor}
              />
              <Text style={[styles.transitTextContent, { color: theme.iconColor }]}>
                Driving to destination point. Follow road safety margins.
              </Text>
            </View>
          ) : hasArrived ? (
            <View
              style={[
                styles.timerTrackingBanner,
                { backgroundColor: theme.iconWrap, borderColor: theme.tabBarBorder },
                isCancellationEligible && styles.timerAlertBannerVariant,
              ]}
            >
              <MaterialCommunityIcons
                name={isCancellationEligible ? "alert-circle" : "clock-outline"}
                size={16}
                color={isCancellationEligible ? "#EF4444" : theme.iconColor}
              />
              <Text
                style={[
                  styles.timerTrackingLabel,
                  { color: theme.iconColor },
                  isCancellationEligible && styles.timerAlertLabelVariant,
                ]}
              >
                {isCancellationEligible ? (
                  <Text>
                    Passenger late.{" "}
                    <Text style={styles.boldText}>
                      Penalty-free cancellation active.
                    </Text>
                  </Text>
                ) : (
                  <Text>
                    Waiting for passenger:{" "}
                    <Text style={[styles.timerCountdownValue, { color: theme.iconColor }]}>
                      {formatTime(secondsWaiting)}
                    </Text>
                  </Text>
                )}
              </Text>
            </View>
          ) : (
            <View style={[styles.instructionNoteBanner, { backgroundColor: theme.background, borderColor: theme.borderColor }]}>
              <MaterialCommunityIcons
                name="information"
                size={16}
                color={theme.iconColor}
              />
              <Text style={[styles.instructionTextContent, { color: theme.subText }]}>
                "Wait at the North entrance circular drive. Look for the blue backpack."
              </Text>
            </View>
          )}

          {/* Conditional Action Button Stack */}
          <View style={styles.actionButtonsStack}>
            {hasArrived && !tripStarted && isCancellationEligible && (
              <TouchableOpacity
                style={styles.cancelRideButton}
                activeOpacity={0.85}
                onPress={handleCancelRide}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel Ride (No Penalty)
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryActionButton,
                { backgroundColor: theme.iconColor },
                hasArrived && styles.startTripButtonVariant,
                tripStarted && styles.endTripButtonVariant,
              ]}
              activeOpacity={0.85}
              onPress={handlePrimaryAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.primaryButtonText, hasArrived && !tripStarted && { color: "#1E3A8A" }]}>
                  {tripStarted
                    ? "End Trip   🏁"
                    : hasArrived
                      ? "Start Trip   ➔"
                      : "Arrived at Pickup   ✓"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Base Tab Bar Component */}
      <View style={[styles.tabBarContainer, { backgroundColor: theme.background, borderTopColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab?.("home")}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="home-outline"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.tabLabelInactive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab?.("trips")}
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
              name="car-multiple"
              size={24}
              color={theme.iconColor}
            />
          </View>
          <Text style={[styles.tabLabelActive, { color: theme.iconColor }]}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab?.("profile")}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.tabLabelInactive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionButtonsStack: {
    flexDirection: "column",
    gap: 12,
  },
  activeTabIconBackground: {
    backgroundColor: "#F1F5F9",
  },
  avatarContainerMock: {
    height: 60,
    position: "relative",
    width: 60,
  },
  avatarEmojiMock: {
    fontSize: 44,
  },
  boldText: {
    fontWeight: "800",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  cancelRideButton: {
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
  },
  commsCircleButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  communicationButtonsGroup: {
    flexDirection: "row",
    gap: 10,
  },
  container: {
    flex: 1,
  },
  disabledSaveButton: {
    backgroundColor: "#94A3B8",
  },
  driverLocatorCircle: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 3,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  driverNavIcon: {
    transform: [{ rotate: "45deg" }],
  },
  dropoffBadgeVariant: {
    backgroundColor: "#A3E635",
  },
  dropoffPinVariant: {
    backgroundColor: "#A3E635",
  },
  endTripButtonVariant: {
    backgroundColor: "#EF4444",
  },
  floatingControlsStack: {
    gap: 12,
    position: "absolute",
    right: 16,
    top: "25%",
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  headerButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  identityTextBlock: {
    flex: 1,
    justifyContent: "center",
    marginLeft: 16,
  },
  instructionNoteBanner: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    padding: 14,
  },
  instructionTextContent: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  mapUtilityButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  mapViewportContainer: {
    flex: 1,
    position: "relative",
  },
  passengerNameText: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  passengerSheet: {
    borderRadius: 16,
    borderWidth: 1,
    bottom: 16,
    left: 16,
    padding: 20,
    position: "absolute",
    right: 16,
  },
  pickupLabelBadge: {
    borderRadius: 8,
    marginBottom: -2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  pickupLabelText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  pickupMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pickupPinInnerNode: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  pickupPinNode: {
    alignItems: "center",
    borderColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  primaryActionButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  profileMasterRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 16,
  },
  ratingBadgeContainer: {
    alignSelf: "center",
    backgroundColor: "#A3E635",
    borderColor: "#1E3A8A",
    borderRadius: 8,
    borderWidth: 1,
    bottom: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: "absolute",
  },
  ratingTextValue: {
    color: "#1E3A8A",
    fontSize: 9,
    fontWeight: "800",
  },
  startTripButtonVariant: {
    backgroundColor: "#A3E635",
  },
  subLocationLabel: {
    fontSize: 13,
    fontWeight: "600",
    width: width * 0.34,
  },
  subLocationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  tabBarContainer: {
    borderTopWidth: 1,
    flexDirection: "row",
    height: 74,
  },
  tabIconBackground: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    marginBottom: 2,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  tabLabelActive: {
    fontSize: 11,
    fontWeight: "700",
  },
  tabLabelInactive: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  timerAlertBannerVariant: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEE2E2",
  },
  timerAlertLabelVariant: {
    color: "#EF4444",
  },
  timerCountdownValue: {
    fontWeight: "800",
  },
  timerTrackingBanner: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    padding: 14,
  },
  timerTrackingLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  transitTrackingBanner: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    padding: 14,
  },
  transitTextContent: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default DriverNavigation;