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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "../../components/maps/MapLibreCompat";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";  
import api from "../../api/axios";
import { getPersistentSocket } from "../../api/socketHelper";
import routingService from "../../api/services/routingService";
import { trimRouteToProgress } from "../../utils/routeProgress";

const { width } = Dimensions.get("window");
const useDefenseSimulatorTelemetry = process.env.EXPO_PUBLIC_DEFENSE_SIMULATION === "true";

const DriverNavigation = ({
  onBack,
  onTripCompleted,
  onArrive,
  onCancelNoPenalty,
  onChangeTab,
  rideData,
  passenger,
}) => {
  const { theme, darkModeEnabled } = useTheme();  
  
  const initialData = rideData || passenger || {};
  const [currentRideData, setCurrentRideData] = useState(initialData);
  const [isFetchingRide, setIsFetchingRide] = useState(true);

  // 🔑 Guaranteed ID Extraction supporting Trip ID and Booking ID
  const rideId = 
    currentRideData?.bookingId ||
    currentRideData?._id || 
    currentRideData?.id || 
    currentRideData?.rideId;

  const tripId = 
    currentRideData?.driverTripId ||
    currentRideData?.tripId ||
    (currentRideData?.tripStops ? currentRideData?._id : null) ||
    rideId;

  // 🔑 Force fresh backend fetch on mount to guarantee populated details
  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      try {
        let tripDataFetched = false;
        if (tripId) {
          try {
            const tripRes = await api.get(`/trips/${tripId}`);
            if (isMounted && tripRes.data?.success && tripRes.data?.data) {
              setCurrentRideData(prev => ({ ...prev, ...tripRes.data.data }));
              tripDataFetched = true;
            }
          } catch (tripErr) {
            try {
              const activeRes = await api.get("/trips/active");
              if (isMounted && activeRes.data?.success && activeRes.data?.data) {
                setCurrentRideData(prev => ({ ...prev, ...activeRes.data.data }));
                tripDataFetched = true;
              }
            } catch (activeErr) {}
          }
        }

        if (rideId && !tripDataFetched) {
          try {
            const response = await api.get(`/rides/${rideId}`);
            if (isMounted && response.data?.success && response.data?.data) {
              setCurrentRideData(prev => ({ ...prev, ...response.data.data }));
            }
          } catch (rideErr) {
            console.warn("Failed to fetch ride details:", rideErr.message);
          }
        }
      } catch (error) {
        console.error("Failed to populate ride details:", error.message);
      } finally {
        if (isMounted) setIsFetchingRide(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [rideId, tripId]);

  // Derive sorted authoritative stops manifest
  const sortedStops = useMemo(() => {
    if (Array.isArray(currentRideData?.tripStops) && currentRideData.tripStops.length > 0) {
      return [...currentRideData.tripStops].sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));
    }
    // Fallback for simple solo ride object
    return [
      {
        _id: 'pickup_fallback',
        stopId: 'pickup_fallback',
        stopType: 'pickup',
        location: currentRideData?.pickupLocationCoordinates || currentRideData?.pickupCoordinates || { name: currentRideData?.pickupLocation || currentRideData?.pickup || "Campus Pickup Point" },
        coordinates: currentRideData?.pickupLocationCoordinates || currentRideData?.pickupCoordinates,
        name: currentRideData?.pickupLocation || currentRideData?.pickup?.name || "Location unavailable",
        passengerName: currentRideData?.passenger?.fullName || currentRideData?.passengerName || "Campus Passenger",
        status: (currentRideData?.status === 'arrived_at_pickup' || currentRideData?.status === 'arrived') ? 'arrived' : (['in_progress', 'active', 'completed'].includes(currentRideData?.status) ? 'completed' : 'pending'),
        sequenceOrder: 0
      },
      {
        _id: 'dropoff_fallback',
        stopId: 'dropoff_fallback',
        stopType: 'dropoff',
        location: currentRideData?.dropoffCoordinates || currentRideData?.destinationCoordinates || { name: currentRideData?.dropoffLocation || currentRideData?.destination || "Campus Destination" },
        coordinates: currentRideData?.dropoffCoordinates || currentRideData?.destinationCoordinates,
        name: currentRideData?.dropoffLocation || currentRideData?.dropoff?.name || "Location unavailable",
        passengerName: currentRideData?.passenger?.fullName || currentRideData?.passengerName || "Campus Passenger",
        status: currentRideData?.status === 'completed' ? 'completed' : 'pending',
        sequenceOrder: 1
      }
    ];
  }, [currentRideData]);

  // Current actionable stop
  const activeStop = useMemo(() => {
    return sortedStops.find(s => s.status !== 'completed' && s.status !== 'cancelled' && s.status !== 'skipped') || sortedStops[sortedStops.length - 1];
  }, [sortedStops]);

  const isAtStop = activeStop?.status === 'arrived';
  const isPickup = activeStop?.stopType === 'pickup';
  const allStopsCompleted = sortedStops.every(s => s.status === 'completed' || s.status === 'cancelled' || s.status === 'skipped');

  // Derive initial status
  const getInitialStatus = () => {
    if (allStopsCompleted) return "completed";
    if (isAtStop) return "arrived";
    if (activeStop && !isPickup) return "in_progress";
    return "accepted";
  };

  const [rideStatus, setRideStatus] = useState(getInitialStatus());
  const [secondsWaiting, setSecondsWaiting] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [remainingRouteCoordinates, setRemainingRouteCoordinates] = useState([]);
  const [driverHeading, setDriverHeading] = useState(0);
  const mapRef = useRef(null);
  const routeProgressSegmentRef = useRef(0);

  useEffect(() => {
    routeProgressSegmentRef.current = 0;
    setRemainingRouteCoordinates(routeCoordinates);
  }, [routeCoordinates]);

  // Sync rideStatus when stops update
  useEffect(() => {
    const nextStatus = getInitialStatus();
    setRideStatus(nextStatus);
  }, [allStopsCompleted, isAtStop, isPickup, activeStop]);

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

  const activeTargetCoords = useMemo(() => {
    if (activeStop?.coordinates || activeStop?.location) {
      const parsed = parseCoordinates(activeStop.coordinates || activeStop.location, NaN, NaN);
      return Number.isFinite(parsed.latitude) && Number.isFinite(parsed.longitude) ? parsed : null;
    }
    return null;
  }, [activeStop]);

  const [driverCoords, setDriverCoords] = useState({ latitude: 5.6508, longitude: -0.1870 });

  useEffect(() => {
    if (routeCoordinates.length < 2 || rideStatus === 'completed') {
      if (rideStatus === 'completed') setRemainingRouteCoordinates([]);
      return;
    }
    const progress = trimRouteToProgress(routeCoordinates, driverCoords, {
      previousSegmentIndex: routeProgressSegmentRef.current,
    });
    routeProgressSegmentRef.current = progress.segmentIndex;
    setRemainingRouteCoordinates(progress.coordinates);
  }, [driverCoords.latitude, driverCoords.longitude, rideStatus, routeCoordinates]);

  // 🔑 Passenger Info for current stop
  const targetPassengerName = activeStop?.passenger?.fullName || activeStop?.passengerName || currentRideData?.passenger?.fullName || currentRideData?.passengerName || "Campus Passenger";
  const targetLocText = activeStop?.name || activeStop?.location?.name || "Location unavailable";
  const passengerPhone = activeStop?.passenger?.phoneNumber || currentRideData?.passenger?.phoneNumber || currentRideData?.passengerPhone || null;

  useEffect(() => {
    let cancelled = false;
    const loadDriverRoute = async () => {
      if (!driverCoords || !activeTargetCoords) return;
      try {
        const response = await routingService.getRoute(
          driverCoords.longitude,
          driverCoords.latitude,
          activeTargetCoords.longitude,
          activeTargetCoords.latitude,
        );
        const geometry = response?.data?.geometry?.coordinates;
        if (!cancelled && response?.success && response.data?.estimateOnly !== true && Array.isArray(geometry) && geometry.length >= 3) {
          setRouteCoordinates(geometry.map(([longitude, latitude]) => ({ longitude, latitude })));
        } else if (!cancelled) {
          setRouteCoordinates([]);
        }
      } catch (_error) {
        if (!cancelled) setRouteCoordinates([]);
      }
    };
    loadDriverRoute();
    return () => { cancelled = true; };
  }, [activeStop?.stopId, activeTargetCoords?.latitude, activeTargetCoords?.longitude]);

  // Real-time GPS Location, Room Joining & Live Telemetry socket streaming
  useEffect(() => {
    let positionSubscription = null;
    let socketInstance = null;
    let isMounted = true;

    const handleDriverTelemetry = (data) => {
      if (!useDefenseSimulatorTelemetry || !isMounted) return;
      const activeTripId = tripId || currentRideData?._id;
      if (data?.tripId?.toString() !== activeTripId?.toString()) return;
      if (!Array.isArray(data?.coordinates) || data.coordinates.length !== 2) return;
      const [longitude, latitude] = data.coordinates.map(Number);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      setDriverCoords({ latitude, longitude });
      if (Number.isFinite(Number(data.heading))) setDriverHeading(Number(data.heading));
    };

    const initTracking = async () => {
      try {
        socketInstance = await getPersistentSocket();

        const activeTripId = tripId || currentRideData?._id;
        if (socketInstance && socketInstance.connected && activeTripId) {
          socketInstance.emit("trip:join", { tripId: activeTripId });
        }

        if (socketInstance) {
          socketInstance.on("driver:telemetry", handleDriverTelemetry);
        }

        // Listen for dynamic route updates (e.g. pool joins)
        const handleRouteUpdated = (data) => {
          if (!isMounted) return;
          console.log("📍 Multi-stop route updated for driver:", data);
          if (data?.stops) {
            setCurrentRideData(prev => ({
              ...prev,
              tripStops: data.stops,
              activePassengerCount: data.activePassengerCount ?? prev.activePassengerCount,
              reservedPassengerCount: data.reservedPassengerCount ?? prev.reservedPassengerCount,
            }));
          }
        };

        const handleStopUpdate = (data) => {
          if (!isMounted) return;
          if (data?.stop) {
            setCurrentRideData(prev => {
              const currentStops = prev.tripStops || [];
              const updatedStops = currentStops.map(s => 
                (s._id === data.stop._id || s.stopId === data.stop.stopId || s.sequenceOrder === data.stop.sequenceOrder)
                  ? { ...s, ...data.stop }
                  : s
              );
              return {
                ...prev,
                tripStops: updatedStops,
                activePassengerCount: data.activePassengerCount ?? prev.activePassengerCount,
              };
            });
          }
        };

        const handleStatusChange = (data) => {
          if (!isMounted) return;
          if (data?.status === 'completed') {
            setRideStatus('completed');
          }
        };

        socketInstance.on("trip:route-updated", handleRouteUpdated);
        socketInstance.on("trip:stop_update", handleStopUpdate);
        socketInstance.on("trip:status_change", handleStatusChange);

        if (useDefenseSimulatorTelemetry) return;

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        let initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const liveLat = initialLoc.coords.latitude;
        const liveLng = initialLoc.coords.longitude;

        const initCoords = { latitude: liveLat, longitude: liveLng };

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

            if (socketInstance && socketInstance.connected && activeTripId) {
              socketInstance.emit("driver:telemetry", {
                tripId: activeTripId,
                coordinates: [coords.longitude, coords.latitude],
                heading: location.coords.heading || 0,
                speed: location.coords.speed ? (location.coords.speed * 3.6) : 0,
                timestamp: new Date()
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
      isMounted = false;
      if (positionSubscription) positionSubscription.remove();
      if (socketInstance) {
        const activeTripId = tripId || currentRideData?._id;
        if (activeTripId) {
          socketInstance.emit("trip:leave", { tripId: activeTripId });
        }
        socketInstance.off("trip:route-updated");
        socketInstance.off("trip:stop_update");
        socketInstance.off("trip:status_change");
        socketInstance.off("driver:telemetry", handleDriverTelemetry);
      }
    };
  }, [rideId, tripId, activeTargetCoords?.latitude, activeTargetCoords?.longitude]);

  useEffect(() => {
    let interval = null;
    if (isAtStop) {
      interval = setInterval(() => {
        setSecondsWaiting((prev) => prev + 1);
      }, 1000);
    } else {
      setSecondsWaiting(0);
    }
    return () => clearInterval(interval);
  }, [isAtStop]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRecenterMap = () => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(remainingRouteCoordinates.length > 0 ? remainingRouteCoordinates : [driverCoords, activeTargetCoords], {
        edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
        animated: true,
      });
    }
  };

  // 🚀 Physical Stop Milestone Execution
  const handlePrimaryAction = async () => {
    const activeTripId = tripId || currentRideData?._id;
    if (!activeTripId) {
      Alert.alert("Error", "Invalid trip reference.");
      return;
    }

    if (!activeStop) {
      Alert.alert("Complete", "All stops have been completed.");
      return;
    }

    try {
      setIsSubmitting(true);
      const driverLocation = [driverCoords.longitude, driverCoords.latitude];
      const stopId = activeStop._id || activeStop.stopId;

      if (!isAtStop) {
        // Step A: Mark Arrived at Stop
        const stopRes = await api.post(`/trips/${activeTripId}/stops/${stopId}/execute`, {
          targetStatus: "arrived",
          driverLocation,
        });

        if (stopRes.data?.success) {
          setCurrentRideData(prev => {
            const currentStops = prev.tripStops || [];
            const updated = currentStops.map(s => 
              (s._id === stopId || s.stopId === stopId) ? { ...s, status: 'arrived' } : s
            );
            return { ...prev, tripStops: updated };
          });
        }
      } else {
        // Step B: Complete Stop (Boarding or Drop-off)
        const stopRes = await api.post(`/trips/${activeTripId}/stops/${stopId}/execute`, {
          targetStatus: "completed",
          driverLocation,
        });

        if (stopRes.data?.success) {
          const result = stopRes.data.data;
          if (result?.trip?.status === 'completed') {
            setRideStatus("completed");
            if (onTripCompleted) {
              onTripCompleted(result.trip);
            } else if (onArrive) {
              onArrive();
            }
          } else {
            setCurrentRideData(prev => ({
              ...prev,
              tripStops: result?.trip?.tripStops || prev.tripStops,
              activePassengerCount: result?.trip?.activePassengerCount ?? prev.activePassengerCount,
              reservedPassengerCount: result?.trip?.reservedPassengerCount ?? prev.reservedPassengerCount,
            }));
            handleRecenterMap();
          }
        }
      }
    } catch (error) {
      Alert.alert("Milestone Error", error.response?.data?.error?.message || error.message || "Failed to update trip milestone.");
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

  const isSharedTrip = currentRideData?.tripType === 'shared' || sortedStops.length > 2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <StatusBar style={theme.statusBar} />

      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.tabBarBorder }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.headerButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitleText, { color: theme.iconColor }]}>
          {isSharedTrip
            ? `Shared Pool • ${currentRideData.activePassengerCount || 0}/${currentRideData.maxCapacity || 3} Onboard`
            : isAtStop
            ? "At Pickup Station"
            : !isPickup
            ? routeCoordinates.length > 0 ? "In Transit to Drop-off" : "Route unavailable"
            : routeCoordinates.length > 0 ? "Navigating to Pickup" : "Route unavailable"}
        </Text>
        <TouchableOpacity onPress={handleRecenterMap} activeOpacity={0.7} style={styles.headerButton}>
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.iconColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapViewportContainer}>
        <MapView
          key={`${activeTargetCoords?.latitude || 'unknown'}-${activeTargetCoords?.longitude || 'unknown'}`}
          ref={mapRef}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : null}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: activeTargetCoords?.latitude || driverCoords.latitude,
            longitude: activeTargetCoords?.longitude || driverCoords.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
          showsCompass={false}
          showsPointsOfInterest={false}
          showsBuildings={false}
        >
          {remainingRouteCoordinates.length > 0 && (
            <Polyline coordinates={remainingRouteCoordinates} strokeColor="#2563EB" strokeWidth={5} />
          )}

          <Marker coordinate={driverCoords} anchor={{ x: 0.5, y: 0.5 }} flat={true}>
            <View style={[styles.driverLocatorCircle, { backgroundColor: theme.iconColor, borderColor: theme.background }]}>
              <MaterialCommunityIcons name="navigation" size={18} color="#FFFFFF" style={{ transform: [{ rotate: `${driverHeading}deg` }] }} />
            </View>
          </Marker>

          {activeTargetCoords ? <Marker coordinate={activeTargetCoords} anchor={{ x: 0.5, y: 1.0 }}>
            <View style={styles.pickupMarkerContainer}>
              <View style={[styles.pickupLabelBadge, { backgroundColor: theme.iconColor }, !isPickup && styles.dropoffBadgeVariant]}>
                <Text style={[styles.pickupLabelText, { color: !isPickup ? "#1E3A8A" : "#FFFFFF" }]}>
                  {isPickup ? "PICKUP" : "DROP-OFF"}
                </Text>
              </View>
              <View style={[styles.pickupPinNode, { backgroundColor: theme.iconColor }, !isPickup && styles.dropoffPinVariant]}>
                <View style={[styles.pickupPinInnerNode, { backgroundColor: theme.background }]} />
              </View>
            </View>
          </Marker> : null}
        </MapView>

        {/* Passenger & Multi-Stop Manifest Card */}
        <View style={[styles.passengerSheet, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
          <View style={styles.profileMasterRow}>
            <View style={styles.avatarContainerMock}>
              <Text style={styles.avatarEmojiMock}>👩‍🎓</Text>
            </View>

            <View style={styles.identityTextBlock}>
              <Text style={[styles.passengerNameText, { color: theme.mainText }]} numberOfLines={1}>
                {targetPassengerName}
              </Text>
              <View style={styles.subLocationRow}>
                <MaterialCommunityIcons name="routes" size={14} color={theme.subText} />
                <Text style={[styles.subLocationLabel, { color: theme.subText }]} numberOfLines={1}>
                  {targetLocText}
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

          {/* Stop Timeline for Multi-Stop Trips */}
          {isSharedTrip && (
            <View style={styles.manifestContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.manifestScroll}>
                {sortedStops.map((stop, idx) => {
                  const isCur = (stop._id === activeStop?._id || stop.stopId === activeStop?.stopId);
                  const isDone = stop.status === 'completed';
                  return (
                    <View 
                      key={stop._id || stop.stopId || idx} 
                      style={[
                        styles.manifestPill, 
                        { backgroundColor: theme.background, borderColor: isCur ? theme.iconColor : theme.borderColor },
                        isCur && { borderWidth: 1.5 }
                      ]}
                    >
                      <View style={[styles.manifestStopDot, { backgroundColor: isDone ? '#16a34a' : isCur ? '#2563EB' : '#94A3B8' }]} />
                      <Text style={[styles.manifestStopText, { color: theme.mainText, fontWeight: isCur ? '800' : '600' }]} numberOfLines={1}>
                        #{idx + 1} {stop.stopType === 'pickup' ? 'Pick' : 'Drop'}: {stop.passengerName?.split(' ')[0] || 'Passenger'}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {isAtStop ? (
            <View style={[styles.timerTrackingBanner, { backgroundColor: theme.iconWrap, borderColor: theme.tabBarBorder }]}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.iconColor} />
              <Text style={[styles.timerTrackingLabel, { color: theme.iconColor }]}>
                Waiting for {targetPassengerName}: <Text style={[styles.timerCountdownValue, { color: theme.iconColor }]}>{formatTime(secondsWaiting)}</Text>
              </Text>
            </View>
          ) : !isPickup ? (
            <View style={[styles.transitTrackingBanner, { backgroundColor: theme.iconWrap, borderColor: theme.tabBarBorder }]}>
              <MaterialCommunityIcons name="rocket-launch" size={16} color={theme.iconColor} />
              <Text style={[styles.transitTextContent, { color: theme.iconColor }]}>
                Navigating to drop-off station for {targetPassengerName}.
              </Text>
            </View>
          ) : (
            <View style={[styles.instructionNoteBanner, { backgroundColor: theme.background, borderColor: theme.borderColor }]}>
              <MaterialCommunityIcons name="information" size={16} color={theme.iconColor} />
              <Text style={[styles.instructionTextContent, { color: theme.subText }]}>
                In-app navigation active. Follow route to pickup location.
              </Text>
            </View>
          )}

          <View style={styles.actionButtonsStack}>
            <TouchableOpacity
              style={[
                styles.primaryActionButton,
                { backgroundColor: theme.iconColor },
                isAtStop && styles.startTripButtonVariant,
                !isPickup && isAtStop && styles.endTripButtonVariant,
              ]}
              activeOpacity={0.85}
              onPress={handlePrimaryAction}
              disabled={isSubmitting || allStopsCompleted}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.primaryButtonText, isAtStop && !isPickup ? { color: "#FFFFFF" } : isAtStop ? { color: "#1E3A8A" } : {}]}>
                  {allStopsCompleted
                    ? "Trip Completed 🏁"
                    : !isAtStop
                    ? `Arrived at ${isPickup ? 'Pickup' : 'Drop-off'} ✓`
                    : `${isPickup ? 'Board' : 'Complete Drop-off for'} ${targetPassengerName} ➔`}
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
  headerTitleText: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  identityTextBlock: { flex: 1, justifyContent: "center", marginLeft: 16 },
  instructionNoteBanner: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 16, padding: 12 },
  instructionTextContent: { flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  mapViewportContainer: { flex: 1, position: "relative" },
  passengerNameText: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  passengerSheet: { borderRadius: 16, borderWidth: 1, bottom: 16, left: 16, padding: 18, position: "absolute", right: 16 },
  pickupLabelBadge: { borderRadius: 8, marginBottom: -2, paddingHorizontal: 10, paddingVertical: 4, zIndex: 10 },
  pickupLabelText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  pickupMarkerContainer: { alignItems: "center", justifyContent: "center" },
  pickupPinInnerNode: { borderRadius: 4, height: 8, width: 8 },
  pickupPinNode: { alignItems: "center", borderColor: "#FFFFFF", borderRadius: 12, borderWidth: 2, height: 24, justifyContent: "center", width: 24 },
  primaryActionButton: { alignItems: "center", borderRadius: 16, height: 56, justifyContent: "center" },
  primaryButtonText: { fontSize: 16, fontWeight: "800" },
  profileMasterRow: { alignItems: "center", flexDirection: "row", marginBottom: 12 },
  startTripButtonVariant: { backgroundColor: "#A3E635" },
  subLocationLabel: { fontSize: 14, fontWeight: "700", width: width * 0.34 },
  subLocationRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  timerAlertBannerVariant: { borderColor: "#FCA5A5", backgroundColor: "#FEE2E2" },
  timerAlertLabelVariant: { color: "#EF4444" },
  timerCountdownValue: { fontWeight: "800" },
  timerTrackingBanner: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 16, padding: 12 },
  timerTrackingLabel: { fontSize: 14, fontWeight: "700" },
  transitTrackingBanner: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 16, padding: 12 },
  transitTextContent: { flex: 1, fontSize: 14, fontWeight: "600" },
  manifestContainer: { marginBottom: 12 },
  manifestScroll: { flexDirection: "row", gap: 8 },
  manifestPill: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  manifestStopDot: { width: 8, height: 8, borderRadius: 4 },
  manifestStopText: { fontSize: 12, fontWeight: "600" },
});

export default DriverNavigation;
