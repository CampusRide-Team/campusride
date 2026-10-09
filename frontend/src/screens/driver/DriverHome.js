import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  PanResponder,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "../../components/maps/MapLibreCompat";
import * as Location from "expo-location";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts, radii, spacing } from "../../theme";
import api from "../../api/axios";
import { getPersistentSocket, onSocketReconnect } from "../../api/socketHelper";
import driverService from "../../api/services/driverService";

const PANEL_HEIGHTS = {
  COLLAPSED: 68,
  COMPACT: 190,
  EXPANDED: 340,
};

const DriverHome = ({ driverData, navigation, onLogout, onViewRequests, onChangeTab }) => {
  const insets = useSafeAreaInsets();
  const { theme, darkModeEnabled } = useTheme();
  const { colors } = theme;

  const [isOnline, setIsOnline] = useState(driverData?.isOnline === true);
  const [analytics, setAnalytics] = useState({ dailyTrips: 0, totalTrips: 0 });
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isAcceptingRide, setIsAcceptingRide] = useState(false);

  const [driverLocation, setDriverLocation] = useState({
    latitude: 5.6037,
    longitude: -0.1870,
    latitudeDelta: 0.015,
    longitudeDelta: 0.012,
  });

  const mapRef = useRef(null);
  const isOnlineRef = useRef(isOnline);

  // Retractable Bottom Sheet State & Animations
  const [panelState, setPanelState] = useState('COMPACT'); // 'COLLAPSED' | 'COMPACT' | 'EXPANDED'
  const animatedHeight = useRef(new Animated.Value(PANEL_HEIGHTS.COMPACT)).current;
  const currentHeightRef = useRef(PANEL_HEIGHTS.COMPACT);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    if (typeof driverData?.isOnline === 'boolean') {
      setIsOnline(driverData.isOnline);
    }
  }, [driverData?.isOnline]);

  const animateToHeight = (targetHeight, nextState) => {
    Animated.spring(animatedHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start(() => {
      currentHeightRef.current = targetHeight;
      if (nextState) setPanelState(nextState);
    });
  };

  const handleTogglePanel = () => {
    if (panelState === 'COLLAPSED') {
      animateToHeight(PANEL_HEIGHTS.COMPACT, 'COMPACT');
    } else if (panelState === 'COMPACT') {
      animateToHeight(PANEL_HEIGHTS.EXPANDED, 'EXPANDED');
    } else {
      animateToHeight(PANEL_HEIGHTS.COMPACT, 'COMPACT');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = currentHeightRef.current - gestureState.dy;
        if (newHeight >= PANEL_HEIGHTS.COLLAPSED - 10 && newHeight <= PANEL_HEIGHTS.EXPANDED + 20) {
          animatedHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const releasedHeight = currentHeightRef.current - gestureState.dy;
        if (gestureState.dy < -30 || (gestureState.vy < -0.4 && releasedHeight > PANEL_HEIGHTS.COMPACT)) {
          animateToHeight(PANEL_HEIGHTS.EXPANDED, 'EXPANDED');
        } else if (gestureState.dy > 30 || (gestureState.vy > 0.4 && releasedHeight < PANEL_HEIGHTS.COMPACT)) {
          animateToHeight(PANEL_HEIGHTS.COLLAPSED, 'COLLAPSED');
        } else {
          const distToCollapsed = Math.abs(releasedHeight - PANEL_HEIGHTS.COLLAPSED);
          const distToCompact = Math.abs(releasedHeight - PANEL_HEIGHTS.COMPACT);
          const distToExpanded = Math.abs(releasedHeight - PANEL_HEIGHTS.EXPANDED);
          const minDist = Math.min(distToCollapsed, distToCompact, distToExpanded);

          if (minDist === distToCollapsed) {
            animateToHeight(PANEL_HEIGHTS.COLLAPSED, 'COLLAPSED');
          } else if (minDist === distToCompact) {
            animateToHeight(PANEL_HEIGHTS.COMPACT, 'COMPACT');
          } else {
            animateToHeight(PANEL_HEIGHTS.EXPANDED, 'EXPANDED');
          }
        }
      },
    })
  ).current;

  // Toggle Driver Online / Offline status with backend sync
  const toggleOnlineStatus = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);

    try {
      await api.put("/driver/availability", {
        isOnline: nextState,
      });
    } catch (error) {
      console.error("Failed to update online status on backend:", error.message);
      setIsOnline(!nextState);
      Alert.alert("Status Sync Error", "Could not update your online status. Please check your connection.");
    }
  };

  // Recenter map camera on driver position
  const handleRecenter = () => {
    if (mapRef.current && driverLocation) {
      mapRef.current.animateToRegion({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.012,
      }, 500);
    }
  };

  // Accept incoming dispatch offer directly
  const handleAcceptRide = async (request) => {
    const requestId = request.offerId || request.id || request._id;

    try {
      setIsAcceptingRide(true);
      const response = await driverService.respondToOffer(requestId, "accept");
      const acceptedData = response?.data?.trip || response?.data?.booking || response?.data;

      setNearbyRequests((prev) => prev.filter((r) => (r.id || r._id || r.bookingId) !== requestId));

      if (acceptedData) {
        navigation?.navigate("DriverNavigation", { passenger: acceptedData });
      } else {
        navigation?.navigate("DriverNavigation", { passenger: request });
      }
    } catch (err) {
      console.error("Failed to accept ride:", err);
      Alert.alert("Acceptance Error", err.response?.data?.message || err.message || "Failed to accept ride.");
    } finally {
      setIsAcceptingRide(false);
    }
  };

  const handleDeclineRide = async (requestId) => {
    try { await driverService.respondToOffer(requestId, "decline"); } catch (error) { console.warn("Decline sync failed:", error.message); }
    setNearbyRequests((prev) => prev.filter((r) => (r.offerId || r.id || r._id) !== requestId));
  };

  // Real-time socket subscriptions for live dispatches
  useEffect(() => {
    let activeSocket = null;

    const handleRemoveRequest = (rideId) => {
      setNearbyRequests((prevRequests) =>
        prevRequests.filter((req) => (req.id || req._id || req.bookingId) !== rideId)
      );
    };

    const handleIncomingDispatch = (newRequest) => {
      if (!newRequest?.offerId) return;
      if (newRequest.status && newRequest.status !== "pending") return;
      if (isOnlineRef.current) {
        setNearbyRequests((prev) => {
          const reqId = newRequest.offerId;
          const exists = prev.some((r) => (r.offerId || r.id || r._id) === reqId);
          if (exists) return prev;

          const formatted = {
            ...newRequest,
            id: reqId,
            offerId: reqId,
            bookingId: newRequest.bookingId,
            pickupLocation: newRequest.pickup?.name || newRequest.pickupLocation || "Location unavailable",
            dropoffLocation: newRequest.dropoff?.name || newRequest.dropoffLocation || "Location unavailable",
            rideMode: newRequest.offerType === "pool_join" || newRequest.rideMode === "shared" ? "shared" : "solo",
          };
          return [formatted, ...prev];
        });
      }
    };

    const initSocket = async () => {
      activeSocket = await getPersistentSocket();

      activeSocket.on("dispatch:offer", handleIncomingDispatch);
      activeSocket.on("dispatch:offer_cancelled", handleRemoveRequest);
      activeSocket.on("dispatch:offer_expired", handleRemoveRequest);
      activeSocket.on("driver:remove-request", handleRemoveRequest);
    };

    initSocket();

    return () => {
      if (activeSocket) {
        activeSocket.off("dispatch:offer", handleIncomingDispatch);
        activeSocket.off("dispatch:offer_cancelled", handleRemoveRequest);
        activeSocket.off("dispatch:offer_expired", handleRemoveRequest);
        activeSocket.off("driver:remove-request", handleRemoveRequest);
      }
    };
  }, []);

  // Notifications badge polling with connectivity-aware backoff and in-flight guard
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    let inFlight = false;
    let failureCount = 0;

    const pollNotifications = async () => {
      if (!isMounted || inFlight) return;
      inFlight = true;
      try {
        const response = await api.get("/driver/notifications");
        if (isMounted && response.data?.success) {
          setUnreadNotifications(response.data.unreadCount || 0);
          failureCount = 0;
        }
      } catch (err) {
        failureCount++;
        if (failureCount <= 2) {
          console.warn("Notification sync notice:", err.message);
        }
      } finally {
        inFlight = false;
        if (isMounted) {
          // 10s on success, backed off up to 30s on repeated failures
          const delay = failureCount === 0 ? 10000 : Math.min(10000 * Math.pow(1.5, failureCount), 30000);
          timeoutId = setTimeout(pollNotifications, delay);
        }
      }
    };

    pollNotifications();

    const unsubscribeReconnect = onSocketReconnect(() => {
      failureCount = 0;
      if (timeoutId) clearTimeout(timeoutId);
      pollNotifications();
    });

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribeReconnect();
    };
  }, []);

  const formatBadgeText = (count) => {
    if (count <= 0) return "";
    return count > 9 ? "9+" : `${count}`;
  };

  // Fetch driver analytics
  useEffect(() => {
    let isMounted = true;
    const fetchDriverStats = async () => {
      try {
        setLoadingAnalytics(true);
        const response = await api.get("/driver/analytics");
        if (isMounted && response.data?.success && response.data?.data) {
          setAnalytics({
            dailyTrips: response.data.data.dailyTrips || 0,
            totalTrips: response.data.data.totalTrips || 0,
          });
        }
      } catch (error) {
        if (isMounted) {
          console.warn("Analytics sync notice:", error.message);
        }
      } finally {
        if (isMounted) {
          setLoadingAnalytics(false);
        }
      }
    };

    fetchDriverStats();
    return () => { isMounted = false; };
  }, []);

  // Continuous pending dispatches polling while online with backoff & in-flight guard
  useEffect(() => {
    if (!isOnline) {
      setNearbyRequests([]);
      return;
    }

    let isMounted = true;
    let timeoutId = null;
    let inFlight = false;
    let failureCount = 0;

    const pollPendingRequests = async () => {
      if (!isMounted || !isOnlineRef.current || inFlight) return;
      inFlight = true;
      try {
        const response = await driverService.getPendingRequests();
        if (isMounted && response?.success && response?.data) {
          failureCount = 0;
          const pendingRides = response.data
            .filter((r) => r.status === "pending")
            .map((r) => ({
              ...r,
              id: r.offerId || r.id,
              offerId: r.offerId || r.id,
              pickupLocation: r.pickup?.name || "Location unavailable",
              dropoffLocation: r.dropoff?.name || "Location unavailable",
              rideMode: r.rideMode || "solo",
            }));
          setNearbyRequests(pendingRides);
        }
      } catch (error) {
        failureCount++;
        if (failureCount <= 2) {
          console.warn("Dispatch poll notice:", error.message);
        }
      } finally {
        inFlight = false;
        if (isMounted && isOnlineRef.current) {
          // 3s interval when healthy, backoff up to 15s on repeated failures
          const delay = failureCount === 0 ? 3000 : Math.min(3000 * Math.pow(1.5, failureCount), 15000);
          timeoutId = setTimeout(pollPendingRequests, delay);
        }
      }
    };

    pollPendingRequests();

    const unsubscribeReconnect = onSocketReconnect(() => {
      failureCount = 0;
      if (timeoutId) clearTimeout(timeoutId);
      pollPendingRequests();
    });

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribeReconnect();
    };
  }, [isOnline]);

  // Live GPS tracking & map camera sync with in-flight protection & error backoff
  useEffect(() => {
    let locationSubscription = null;
    let isMounted = true;
    let isSyncingLocation = false;
    let locationErrorCount = 0;

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

        if (!isMounted) return;

        const latitude = initialLoc.coords.latitude;
        const longitude = initialLoc.coords.longitude;
        const newCoords = { latitude, longitude, latitudeDelta: 0.015, longitudeDelta: 0.012 };
        setDriverLocation(newCoords);

        if (mapRef.current) {
          mapRef.current.animateToRegion(newCoords, 1000);
        }

        api
          .put("/driver/location", { latitude, longitude })
          .catch((err) => console.warn("Initial GPS sync notice:", err.message));

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 3,
          },
          async (updatedLoc) => {
            if (!isMounted) return;

            const newLat = updatedLoc.coords.latitude;
            const newLng = updatedLoc.coords.longitude;
            const updatedCoords = {
              latitude: newLat,
              longitude: newLng,
              latitudeDelta: 0.015,
              longitudeDelta: 0.012,
            };

            setDriverLocation(updatedCoords);

            // In-flight guard: do not fire parallel location updates
            if (isSyncingLocation) return;
            isSyncingLocation = true;

            try {
              await api.put("/driver/location", {
                latitude: newLat,
                longitude: newLng,
              });
              locationErrorCount = 0;
            } catch (err) {
              locationErrorCount++;
              if (locationErrorCount <= 2) {
                console.warn("Live GPS broadcast notice:", err.message);
              }
            } finally {
              isSyncingLocation = false;
            }
          }
        );
      } catch (err) {
        console.error("Location tracking engine initialization error:", err);
      }
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const topInset = Math.max(insets.top, 16);
  const activeOffer = nearbyRequests.length > 0 && isOnline ? nearbyRequests[0] : null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* 1. DOMINANT FULL-SCREEN INTERACTIVE MAP */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : null}
        style={StyleSheet.absoluteFillObject}
        initialRegion={driverLocation}
        showsCompass={false}
        showsPointsOfInterest={true}
      >
        {/* Driver Live Marker */}
        <Marker
          coordinate={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.driverPulseOuter}>
            <View
              style={[
                styles.driverPulseInner,
                { backgroundColor: isOnline ? colors.semantic.success : colors.text.muted },
              ]}
            />
          </View>
        </Marker>

        {/* Nearby Request Markers */}
        {isOnline &&
          nearbyRequests.map((request) => {
            const reqId = request.id || request._id || request.bookingId;
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
                title={request.pickupLocation || "Ride Request"}
              >
                <View style={[styles.passengerPin, { backgroundColor: colors.brand.primary }]}>
                  <MaterialCommunityIcons name="account" size={16} color="#FFFFFF" />
                </View>
              </Marker>
            );
          })}
      </MapView>

      {/* 2. FLOATING OPERATIONAL HEADER (Bolt / Yango Clarity — No Branding Over Map) */}
      <View style={[styles.floatingHeader, { top: topInset }]} pointerEvents="box-none">
        {/* Availability Toggle Pill */}
        <TouchableOpacity
          style={[
            styles.availabilityPill,
            {
              backgroundColor: isOnline ? '#E8F5EC' : (colors.surface.tile || '#F3F3F1'),
              borderColor: isOnline ? colors.semantic.success : colors.border.subtle,
            },
          ]}
          onPress={toggleOnlineStatus}
          activeOpacity={0.85}
          accessibilityRole="switch"
          accessibilityState={{ checked: isOnline }}
          accessibilityLabel={`Driver availability status: ${isOnline ? 'Online' : 'Offline'}`}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? colors.semantic.success : colors.text.muted },
            ]}
          />
          <Text
            style={[
              styles.availabilityText,
              { color: isOnline ? colors.semantic.success : colors.text.secondary },
            ]}
          >
            {isOnline ? "Online" : "Offline"}
          </Text>
          <Switch
            trackColor={{ false: colors.border.subtle, true: colors.semantic.successTint }}
            thumbColor={isOnline ? colors.semantic.success : '#FFFFFF'}
            ios_backgroundColor={colors.border.subtle}
            onValueChange={toggleOnlineStatus}
            value={isOnline}
            style={styles.pillSwitch}
          />
        </TouchableOpacity>

        {/* Top-Right Secondary Controls: Notifications & Profile Avatar */}
        <View style={styles.topRightControls} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.circleButton,
              { backgroundColor: colors.surface.base, borderColor: colors.border.subtle },
            ]}
            activeOpacity={0.8}
            onPress={() => onChangeTab("notifications")}
            accessibilityRole="button"
            accessibilityLabel="Driver Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
            {unreadNotifications > 0 && (
              <View style={[styles.badgePill, { backgroundColor: colors.semantic.danger }]}>
                <Text style={styles.badgeText}>{formatBadgeText(unreadNotifications)}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.avatarButton,
              { borderColor: colors.border.subtle, backgroundColor: colors.surface.base },
            ]}
            activeOpacity={0.8}
            onPress={() => onChangeTab("profile")}
            accessibilityRole="button"
            accessibilityLabel="Driver Profile"
          >
            {driverData?.avatarUri || driverData?.avatar ? (
              <Image
                source={{ uri: driverData.avatarUri || driverData.avatar }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.surface.tile || '#F3F3F1' }]}>
                <Ionicons name="person" size={16} color={colors.text.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. FLOATING RECENTER FAB */}
      <View style={styles.recenterWrap} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.recenterButton,
            { backgroundColor: colors.surface.base, borderColor: colors.border.subtle },
          ]}
          onPress={handleRecenter}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Recenter map on driver location"
        >
          <Ionicons name="locate" size={22} color={colors.brand.primary} />
        </TouchableOpacity>
      </View>

      {/* 4. INCOMING DISPATCH OFFER CARD (Displayed prominently when offer arrives) */}
      {activeOffer && (
        <View
          style={[
            styles.dispatchOfferCard,
            { backgroundColor: colors.surface.base, borderColor: colors.brand.primary },
          ]}
        >
          <View style={styles.dispatchHeaderRow}>
            <View style={[styles.dispatchBadge, { backgroundColor: colors.brand.primary }]}>
              <Text style={styles.dispatchBadgeText}>NEW RIDE OFFER</Text>
            </View>
            <Text style={[styles.dispatchModeText, { color: colors.text.secondary }]}>
              {activeOffer.rideMode === "shared" ? "Shared Ride" : "Solo Ride"}
            </Text>
          </View>

          {/* Locations */}
          <View style={styles.dispatchLocations}>
            <View style={styles.dispatchPointRow}>
              <View style={[styles.pointDot, { backgroundColor: colors.brand.primary }]} />
              <Text style={[styles.pointText, { color: colors.text.primary }]} numberOfLines={1}>
                {activeOffer.pickupLocation}
              </Text>
            </View>
            <View style={[styles.pointTrack, { backgroundColor: colors.border.subtle }]} />
            <View style={styles.dispatchPointRow}>
              <View style={[styles.pointDot, { backgroundColor: colors.semantic.danger }]} />
              <Text style={[styles.pointText, { color: colors.text.primary }]} numberOfLines={1}>
                {activeOffer.dropoffLocation}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.dispatchFooterRow}>
            <View style={styles.dispatchActionButtons}>
              <TouchableOpacity
                style={[styles.declineButton, { borderColor: colors.border.subtle }]}
                onPress={() => handleDeclineRide(activeOffer.offerId || activeOffer.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.declineButtonText, { color: colors.text.secondary }]}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.acceptButton, { backgroundColor: colors.brand.primary }]}
                onPress={() => handleAcceptRide(activeOffer)}
                activeOpacity={0.85}
                disabled={isAcceptingRide}
              >
                {isAcceptingRide ? (
                  <ActivityIndicator size="small" color={colors.brand.onGoldText} />
                ) : (
                  <Text style={[styles.acceptButtonText, { color: colors.brand.onGoldText }]}>Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 5. RETRACTABLE WHITE BOTTOM SHEET (Bolt / Yango Style) */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            height: animatedHeight,
            backgroundColor: colors.surface.base,
            borderTopColor: colors.border.subtle,
          },
        ]}
      >
        {/* Drag / Sheet Handle Hitbox */}
        <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
          <TouchableOpacity
            onPress={handleTogglePanel}
            activeOpacity={0.7}
            style={styles.handleHitbox}
            accessibilityRole="button"
            accessibilityLabel="Toggle driver information panel"
          >
            <View style={[styles.grabBar, { backgroundColor: colors.border.subtle }]} />
          </TouchableOpacity>
        </View>

        {/* Collapsed State: Minimal Status Strip */}
        {panelState === "COLLAPSED" ? (
          <TouchableOpacity
            style={styles.collapsedStrip}
            onPress={handleTogglePanel}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.statusDotSmall,
                { backgroundColor: isOnline ? colors.semantic.success : colors.text.muted },
              ]}
            />
            <Text style={[styles.collapsedStatusText, { color: colors.text.primary }]}>
              {isOnline ? "Online • Ready for campus rides" : "Offline • Tap to go online"}
            </Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-up" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        ) : (
          /* Compact & Expanded Content */
          <View style={styles.sheetContent}>
            {/* Status Headline */}
            <View style={styles.statusRow}>
              <View style={styles.statusTextCol}>
                <Text style={[styles.statusTitle, { color: colors.text.primary }]}>
                  {isOnline ? "You are online" : "You are offline"}
                </Text>
                <Text style={[styles.statusSubtitle, { color: colors.text.secondary }]}>
                  {isOnline
                    ? nearbyRequests.length > 0
                      ? `${nearbyRequests.length} active requests nearby`
                      : "Ready to accept ride requests"
                    : "Toggle online status to start receiving trips"}
                </Text>
              </View>

              <View
                style={[
                  styles.onlineStatusBadge,
                  {
                    backgroundColor: isOnline ? "#E8F5EC" : (colors.surface.tile || '#F3F3F1'),
                    borderColor: isOnline ? colors.semantic.success : colors.border.subtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDotSmall,
                    { backgroundColor: isOnline ? colors.semantic.success : colors.text.muted },
                  ]}
                />
                <Text
                  style={[
                    styles.onlineBadgeText,
                    { color: isOnline ? colors.semantic.success : colors.text.secondary },
                  ]}
                >
                  {isOnline ? "READY" : "PAUSED"}
                </Text>
              </View>
            </View>

            {/* Operational Metrics in Clean Neutral Tiles (#F3F3F1) */}
            <View style={styles.metricsRow}>
              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle },
                ]}
              >
                <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>Trips today</Text>
                {loadingAnalytics ? (
                  <ActivityIndicator size="small" color={colors.brand.primary} />
                ) : (
                  <Text style={[styles.metricValue, { color: colors.text.primary }]}>
                    {analytics.dailyTrips}
                  </Text>
                )}
              </View>

              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle },
                ]}
              >
                <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>Total trips</Text>
                {loadingAnalytics ? (
                  <ActivityIndicator size="small" color={colors.brand.primary} />
                ) : (
                  <Text style={[styles.metricValue, { color: colors.text.primary }]}>
                    {analytics.totalTrips}
                  </Text>
                )}
              </View>

              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle },
                ]}
              >
                <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>Requests nearby</Text>
                <Text style={[styles.metricValue, { color: colors.text.primary }]}>
                  {nearbyRequests.length}
                </Text>
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[
                styles.primaryActionButton,
                { backgroundColor: colors.brand.primary },
                !isOnline && styles.disabledButton,
              ]}
              activeOpacity={0.85}
              disabled={!isOnline}
              onPress={onViewRequests}
              accessibilityRole="button"
              accessibilityLabel="View Active Ride Requests"
            >
              <Text style={[styles.primaryActionText, { color: colors.brand.onGoldText }]}>
                {nearbyRequests.length > 0
                  ? `View ${nearbyRequests.length} Active Requests`
                  : "View Active Requests"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Floating Operational Header
  floatingHeader: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 20,
  },
  availabilityPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availabilityText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginRight: 4,
  },
  pillSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  topRightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  badgePill: {
    position: "absolute",
    top: -2,
    right: -2,
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
  },

  // Recenter FAB
  recenterWrap: {
    position: "absolute",
    right: spacing.md,
    bottom: PANEL_HEIGHTS.COMPACT + 16,
    zIndex: 15,
  },
  recenterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },

  // Driver Map Marker Styles
  driverPulseOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E8E6E1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  driverPulseInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  passengerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  // Dispatch Offer Card (Prominent actionable offer)
  dispatchOfferCard: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: PANEL_HEIGHTS.COMPACT + 8,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: spacing.md,
    zIndex: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  dispatchHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  dispatchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dispatchBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#262626",
    letterSpacing: 0.5,
  },
  dispatchModeText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  dispatchLocations: {
    marginVertical: spacing.xs,
  },
  dispatchPointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pointTrack: {
    width: 1.5,
    height: 12,
    marginLeft: 3.2,
    marginVertical: 2,
  },
  pointText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    flex: 1,
  },
  dispatchFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "#E8E6E1",
  },
  dispatchActionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  declineButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  declineButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
  },
  acceptButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
  },

  // Retractable White Bottom Sheet
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  dragHandleArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  handleHitbox: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  collapsedStrip: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: spacing.xs,
  },
  statusDotSmall: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 8,
  },
  collapsedStatusText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  sheetContent: {
    paddingTop: 4,
    paddingBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statusTextCol: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  statusTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  statusSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 1,
  },
  onlineStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  onlineBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  metricTile: {
    flex: 1,
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  primaryActionButton: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.45,
    elevation: 0,
  },
  primaryActionText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
});

export default DriverHome;
