import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  BackHandler,
  Platform,
  Alert,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { colors, spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';
import { useAuth } from '../../context/AuthContext';
import { useRide, RIDE_STATES } from '../../context/RideContext';
import { poiService } from '../../api/services/poiService';
import { routingService } from '../../api/services/routingService';
import { bookingService } from '../../api/services/bookingService';
import { driverService } from '../../api/services/driverService';
import {
  DEFAULT_MAX_ACCURACY_METERS,
  DEFAULT_MAX_LOCATION_AGE_MS,
  classifyLocationFix,
  createGpsPickup,
  isGpsPickup,
  normalizePoiLocation,
  shouldApplyGpsPickup,
  shouldClearGpsPickupAfterFailure,
  toDeviceLocation,
} from '../../utils/locationSelection';
import {
  buildBookingPayload,
  createRouteRequestKey,
  normalizeRoadRoute,
  routeMatchesLocations,
} from '../../utils/routeSelection';
import { scheduleRideReminder } from '../../utils/scheduledRideNotifications';
import { trimRouteToProgress } from '../../utils/routeProgress';

// Child Passenger Components (Sections 1 - 5 + 6 & 7)
import PassengerMap from './PassengerMap';
import PassengerMapOverlays from './PassengerMapOverlays';
import IdleDiscoveryWorkspace from './IdleDiscoveryWorkspace';
import LocationSearchWorkspace from './LocationSearchWorkspace';
import MapPinWorkspace from './MapPinWorkspace';
import LocationConfirmationWorkspace from './LocationConfirmationWorkspace';
import RouteOptionsWorkspace from './RouteOptionsWorkspace';
import MatchingWorkspace from './MatchingWorkspace';
import NoDriverWorkspace from './NoDriverWorkspace';
import CancelRideRequestModal from './CancelRideRequestModal';
import DriverApproachWorkspace from './DriverApproachWorkspace';
import DriverArrivedWorkspace from './DriverArrivedWorkspace';
import AssignedRideCancellationModal from './AssignedRideCancellationModal';
import RideCancelledModal from './RideCancelledModal';
import ActiveTripWorkspace from './ActiveTripWorkspace';
import TripCompletionWorkspace from './TripCompletionWorkspace';
import SafetySupportSheet from './SafetySupportSheet';

// University of Ghana default campus center (USED ONLY FOR INITIAL MAP FRAMING FALLBACK)
const UG_CAMPUS_DEFAULT = {
  latitude: 5.6508,
  longitude: -0.1870,
};

export const PassengerRideShell = ({ navigation, onToggleTabBar }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const {
    pickupLocation,
    setPickupLocation,
    dropoffLocation,
    setDropoffLocation,
    selectedRideMode,
    setSelectedRideMode,
    rideStep,
    setRideStep,
    activeBooking,
    activeDriver,
    driverTelemetry,
    currentStop,
    isDropoffArrived,
    stopsAheadCount,
    connectionStatus,
    cancellationReason,
    setCancellationReason,
    createBooking,
    cancelActiveBooking,
    submitReview,
    resetRide,
    setRoutePolyline: setRideRoutePolyline,
  } = useRide();

  // Workflow Modes:
  // 'IDLE' | 'SEARCH' | 'MAP_PIN' | 'CONFIRMATION' | 'ROUTE_OPTIONS' | 'MATCHING' | 'NO_DRIVER' | 'DRIVER_APPROACH' | 'DRIVER_ARRIVED' | 'ACTIVE_TRIP' | 'TRIP_COMPLETED'
  const [workspaceMode, setWorkspaceMode] = useState('IDLE');
  const [activeEditField, setActiveEditField] = useState('destination');

  // Location & POI State
  const [userLocation, setUserLocation] = useState(null); // Strictly real GPS, never fabricated
  const [isLocating, setIsLocating] = useState(true);
  const [locationStatus, setLocationStatus] = useState('loading');
  const [locationError, setLocationError] = useState(null);
  const [campusPois, setCampusPois] = useState([]);
  const [popularPois, setPopularPois] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [departureMode, setDepartureMode] = useState('now');
  const [scheduledTime, setScheduledTime] = useState(() => new Date(Date.now() + 30 * 60 * 1000));

  // Map Pin Adjustment State
  const [candidatePinCoords, setCandidatePinCoords] = useState(null); // [lng, lat]
  const [resolvedPinName, setResolvedPinName] = useState('');
  const [isResolvingPin, setIsResolvingPin] = useState(false);

  // Section 3: Road route state
  const [routeData, setRouteData] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [remainingRouteCoordinates, setRemainingRouteCoordinates] = useState([]);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Section 4: Request & Matching State
  const [isRequesting, setIsRequesting] = useState(false);
  const [isRetryingDispatch, setIsRetryingDispatch] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);

  // Section 5: Driver Assigned & Approach State
  const [showAssignedCancelModal, setShowAssignedCancelModal] = useState(false);
  const [showDriverCancelledModal, setShowDriverCancelledModal] = useState(false);
  const hasFramedDriverRef = useRef(false);

  // Section 6: Active Trip State
  const [showSafetySheet, setShowSafetySheet] = useState(false);
  const hasFramedActiveTripRef = useRef(false);

  const mapRef = useRef(null);
  const resolveTimerRef = useRef(null);
  const pinResolveRequestIdRef = useRef(0);
  const routeRequestIdRef = useRef(0);
  const routeProgressSegmentRef = useRef(0);
  const routeAbortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const locationRequestIdRef = useRef(0);
  const pickupLocationRef = useRef(pickupLocation);
  const dropoffLocationRef = useRef(dropoffLocation);
  const pickupSelectionModeRef = useRef(
    pickupLocation && !isGpsPickup(pickupLocation) ? 'manual' : 'gps',
  );
  const workspaceModeRef = useRef(workspaceMode);
  const rideStepRef = useRef(rideStep);
  rideStepRef.current = rideStep;
  pickupLocationRef.current = pickupLocation;
  dropoffLocationRef.current = dropoffLocation;
  workspaceModeRef.current = workspaceMode;

  useEffect(() => {
    routeProgressSegmentRef.current = 0;
    setRemainingRouteCoordinates(routeCoordinates);
  }, [routeCoordinates]);

  useEffect(() => {
    if (rideStep === RIDE_STATES.TRIP_COMPLETED) {
      setRemainingRouteCoordinates([]);
      return;
    }
    if (rideStep !== RIDE_STATES.TRIP_IN_TRANSIT || !driverTelemetry?.coordinates || routeCoordinates.length < 2) {
      return;
    }
    const progress = trimRouteToProgress(routeCoordinates, driverTelemetry.coordinates, {
      previousSegmentIndex: routeProgressSegmentRef.current,
    });
    routeProgressSegmentRef.current = progress.segmentIndex;
    setRemainingRouteCoordinates(progress.coordinates);
  }, [rideStep, driverTelemetry?.coordinates?.[0], driverTelemetry?.coordinates?.[1], routeCoordinates]);

  // Responsive camera bottom margin based on sheet geometry & device safe-area insets
  const responsiveBottomPadding = Math.min(320, Math.max(250, Math.round(insets.bottom + 230)));
  const safeBottom = insets.bottom > 0 ? insets.bottom : 16;
  const mapBottomInset = workspaceMode === 'IDLE'
    ? 236
    : workspaceMode === 'MAP_PIN'
      ? 190 + safeBottom
      : workspaceMode === 'ROUTE_OPTIONS'
        ? 318 + safeBottom
        : workspaceMode === 'MATCHING'
          ? 112 + safeBottom
          : workspaceMode === 'DRIVER_APPROACH' || workspaceMode === 'DRIVER_ARRIVED'
            ? 222 + safeBottom
            : workspaceMode === 'ACTIVE_TRIP'
              ? 226 + safeBottom
              : 0;

  // 1. Initialize GPS & POI Data on Mount
  useEffect(() => {
    isMountedRef.current = true;

    async function init() {
      await Promise.allSettled([
        requestUserLocation(),
        loadCampusPOIs(),
      ]);
    }

    init();

    return () => {
      isMountedRef.current = false;
      locationRequestIdRef.current += 1;
      pinResolveRequestIdRef.current += 1;
      routeRequestIdRef.current += 1;
      routeAbortControllerRef.current?.abort();
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    };
  }, []);

  // Discovery markers are deliberately separate from assigned-trip telemetry.
  // Poll only while the passenger is selecting/reviewing a ride.
  useEffect(() => {
    const discoveryModes = new Set(['IDLE', 'SEARCH', 'CONFIRMATION', 'ROUTE_OPTIONS']);
    if (!discoveryModes.has(workspaceMode)) {
      setAvailableDrivers([]);
      return undefined;
    }
    let cancelled = false;
    const refresh = async () => {
      try {
        const result = await driverService.getActiveDriverLocations();
        if (!cancelled) setAvailableDrivers(Array.isArray(result?.data) ? result.data : []);
      } catch (error) {
        if (!cancelled) setAvailableDrivers([]);
      }
    };
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [workspaceMode]);

  // 2. Tab Bar Visibility Synchronization
  useEffect(() => {
    if (onToggleTabBar) {
      onToggleTabBar(workspaceMode === 'IDLE');
    }
  }, [workspaceMode, onToggleTabBar]);

  // 3. Synchronize RideContext rideStep to local workspaceMode
  useEffect(() => {
    if (rideStep === RIDE_STATES.DRIVER_EN_ROUTE_PICKUP) {
      setWorkspaceMode('DRIVER_APPROACH');
    } else if (rideStep === RIDE_STATES.DRIVER_AT_PICKUP) {
      setWorkspaceMode('DRIVER_ARRIVED');
    } else if (rideStep === RIDE_STATES.TRIP_IN_TRANSIT) {
      setWorkspaceMode('ACTIVE_TRIP');
    } else if (rideStep === RIDE_STATES.TRIP_COMPLETED) {
      setWorkspaceMode('TRIP_COMPLETED');
    } else if (rideStep === RIDE_STATES.CANCELLED_TERMINAL) {
      setShowDriverCancelledModal(true);
      setWorkspaceMode('ROUTE_OPTIONS');
    } else if (rideStep === RIDE_STATES.NO_DRIVER) {
      setWorkspaceMode('NO_DRIVER');
    } else if (rideStep === RIDE_STATES.REVIEWING_OFFERS && pickupLocation && dropoffLocation) {
      setWorkspaceMode('CONFIRMATION');
    } else if (rideStep === RIDE_STATES.IDLE) {
      setWorkspaceMode('IDLE');
    }
  }, [rideStep]);

  // 4. Initial Camera Framing on Driver Telemetry Received (Section 5 Approach)
  useEffect(() => {
    if (
      (rideStep === RIDE_STATES.DRIVER_EN_ROUTE_PICKUP || rideStep === RIDE_STATES.DRIVER_AT_PICKUP) &&
      driverTelemetry?.coordinates &&
      pickupLocation?.coordinates &&
      !hasFramedDriverRef.current
    ) {
      hasFramedDriverRef.current = true;
      const [dLng, dLat] = driverTelemetry.coordinates;
      const [pLng, pLat] = pickupLocation.coordinates;
      setTimeout(() => {
        mapRef.current?.fitToCoordinates([
          { latitude: dLat, longitude: dLng },
          { latitude: pLat, longitude: pLng },
        ], {
          edgePadding: { top: 72, right: 50, bottom: 40, left: 50 },
          animated: true,
        });
      }, 300);
    }
    if (rideStep === RIDE_STATES.IDLE || rideStep === RIDE_STATES.REVIEWING_OFFERS) {
      hasFramedDriverRef.current = false;
    }
  }, [rideStep, driverTelemetry, pickupLocation, responsiveBottomPadding]);

  // 5. Initial Camera Framing on Section 6 Active Trip Entry (Vehicle + Destination ONCE)
  useEffect(() => {
    if (
      rideStep === RIDE_STATES.TRIP_IN_TRANSIT &&
      dropoffLocation?.coordinates &&
      !hasFramedActiveTripRef.current
    ) {
      hasFramedActiveTripRef.current = true;
      if (driverTelemetry?.coordinates) {
        const [dLng, dLat] = driverTelemetry.coordinates;
        const [destLng, destLat] = dropoffLocation.coordinates;
        setTimeout(() => {
          mapRef.current?.fitToCoordinates([
            { latitude: dLat, longitude: dLng },
            { latitude: destLat, longitude: destLng },
          ], {
            edgePadding: { top: 80, right: 50, bottom: 40, left: 50 },
            animated: true,
          });
        }, 300);
      } else {
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            latitude: dropoffLocation.coordinates[1],
            longitude: dropoffLocation.coordinates[0],
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }, 300);
      }
    }
    if (rideStep === RIDE_STATES.IDLE || rideStep === RIDE_STATES.REVIEWING_OFFERS) {
      hasFramedActiveTripRef.current = false;
    }
  }, [rideStep, driverTelemetry, dropoffLocation, responsiveBottomPadding]);

  // 6. Section 7 Trip Completed Camera Framing (Destination Focused)
  useEffect(() => {
    if (rideStep === RIDE_STATES.TRIP_COMPLETED && dropoffLocation?.coordinates) {
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: dropoffLocation.coordinates[1],
          longitude: dropoffLocation.coordinates[0],
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        });
      }, 300);
    }
  }, [rideStep, dropoffLocation]);

  // 5. Android Hardware Back Button Handling
  useEffect(() => {
    const handleHardwareBack = () => {
      if (isRequesting || isCancellingBooking) {
        // Prevent destructive back navigation while mutations are in-flight
        return true;
      }
      if (showDriverCancelledModal) {
        setShowDriverCancelledModal(false);
        if (setCancellationReason) setCancellationReason(null);
        setRideStep(RIDE_STATES.REVIEWING_OFFERS);
        setWorkspaceMode('ROUTE_OPTIONS');
        return true;
      }
      if (showCancelModal) {
        setShowCancelModal(false);
        return true;
      }
      if (showAssignedCancelModal) {
        setShowAssignedCancelModal(false);
        return true;
      }
      if (showSafetySheet) {
        setShowSafetySheet(false);
        return true;
      }
      if (workspaceMode === 'DRIVER_APPROACH' || workspaceMode === 'DRIVER_ARRIVED') {
        setShowAssignedCancelModal(true);
        return true;
      }
      if (workspaceMode === 'ACTIVE_TRIP' || workspaceMode === 'TRIP_COMPLETED') {
        return true; // Active trip and completion lifecycle states, hardware back suspended
      }
      if (workspaceMode === 'MATCHING' || workspaceMode === 'NO_DRIVER') {
        setShowCancelModal(true);
        return true;
      }
      if (workspaceMode === 'ROUTE_OPTIONS') {
        setWorkspaceMode('CONFIRMATION');
        return true;
      }
      if (workspaceMode === 'MAP_PIN') {
        setWorkspaceMode('SEARCH');
        return true;
      }
      if (workspaceMode === 'CONFIRMATION') {
        setWorkspaceMode('SEARCH');
        return true;
      }
      if (workspaceMode === 'SEARCH') {
        Keyboard.dismiss();
        setWorkspaceMode('IDLE');
        return true;
      }
      return false; // Default Android back behavior in IDLE
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => backHandler.remove();
  }, [workspaceMode, showCancelModal, showAssignedCancelModal, showDriverCancelledModal, isRequesting, isCancellingBooking]);

  // 4. Request GPS Position
  const invalidateRoute = useCallback(() => {
    routeRequestIdRef.current += 1;
    routeAbortControllerRef.current?.abort();
    routeAbortControllerRef.current = null;
    setRouteData(null);
    setRouteCoordinates([]);
    setRouteError(null);
    setIsRoutingLoading(false);
    if (setRideRoutePolyline) setRideRoutePolyline([]);
  }, [setRideRoutePolyline]);

  const applyGpsFix = useCallback((position, provisional = false) => {
    const deviceLocation = toDeviceLocation(position, provisional);
    setUserLocation(deviceLocation);

    if (shouldApplyGpsPickup(pickupLocationRef.current, pickupSelectionModeRef.current)) {
      const nextPickup = createGpsPickup(deviceLocation);
      const currentCoordinates = pickupLocationRef.current?.coordinates;
      const changed = !Array.isArray(currentCoordinates)
        || currentCoordinates[0] !== nextPickup.coordinates[0]
        || currentCoordinates[1] !== nextPickup.coordinates[1];
      pickupLocationRef.current = nextPickup;
      setPickupLocation(nextPickup);
      if (changed) invalidateRoute();
    }

    if (workspaceModeRef.current === 'IDLE' && pickupSelectionModeRef.current === 'gps') {
      mapRef.current?.animateToRegion({
        latitude: deviceLocation.latitude,
        longitude: deviceLocation.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      });
    }

    return deviceLocation;
  }, [invalidateRoute, setPickupLocation]);

  const clearUnverifiedGpsPickup = useCallback(() => {
    if (shouldClearGpsPickupAfterFailure(pickupLocationRef.current)) {
      pickupLocationRef.current = null;
      setPickupLocation(null);
      invalidateRoute();
    }
  }, [invalidateRoute, setPickupLocation]);

  const requestUserLocation = async () => {
    const requestId = locationRequestIdRef.current + 1;
    locationRequestIdRef.current = requestId;
    let usableCachedFix = null;

    try {
      setIsLocating(true);
      setLocationStatus('loading');
      setLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (!isMountedRef.current || requestId !== locationRequestIdRef.current) return;
        clearUnverifiedGpsPickup();
        setLocationStatus('permission_denied');
        setLocationError('Location permission is off. Choose a pickup manually or enable location access.');
        // Fallback ONLY for initial camera framing - never populate authoritative state
        if (mapRef.current && workspaceModeRef.current === 'IDLE') {
          mapRef.current.animateToRegion({
            ...UG_CAMPUS_DEFAULT,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        }
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (!isMountedRef.current || requestId !== locationRequestIdRef.current) return;
        clearUnverifiedGpsPickup();
        setLocationStatus('services_disabled');
        setLocationError('Device location is disabled. Turn on GPS or choose a pickup manually.');
        return;
      }

      const cachedPosition = await Location.getLastKnownPositionAsync({
        maxAge: DEFAULT_MAX_LOCATION_AGE_MS,
        requiredAccuracy: DEFAULT_MAX_ACCURACY_METERS,
      });
      const cachedClassification = classifyLocationFix(cachedPosition);
      if (cachedClassification.usable && isMountedRef.current && requestId === locationRequestIdRef.current) {
        usableCachedFix = cachedPosition;
        applyGpsFix(cachedPosition, true);
        setLocationStatus('provisional');
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      if (!isMountedRef.current || requestId !== locationRequestIdRef.current) return;
      const classification = classifyLocationFix(position);
      if (!classification.usable) {
        if (usableCachedFix) {
          setLocationStatus('ready');
          setLocationError(null);
          return;
        }
        clearUnverifiedGpsPickup();
        setLocationStatus(classification.reason === 'inaccurate' ? 'inaccurate' : 'error');
        setLocationError(
          classification.reason === 'inaccurate'
            ? 'GPS accuracy is too low to confirm pickup. Move outdoors or choose a pickup manually.'
            : 'Could not verify your current location. Choose a pickup manually.',
        );
        return;
      }

      applyGpsFix(position, false);
      setLocationStatus('ready');
      setLocationError(null);
    } catch (err) {
      console.warn('[PassengerRideShell] GPS location error:', err);
      if (!isMountedRef.current || requestId !== locationRequestIdRef.current) return;
      if (usableCachedFix) {
        setLocationStatus('ready');
        setLocationError(null);
        return;
      }
      clearUnverifiedGpsPickup();
      setLocationStatus('error');
      setLocationError('Could not get a reliable GPS fix. Retry or choose a pickup manually.');
      // Framing fallback only
      if (mapRef.current && workspaceModeRef.current === 'IDLE') {
        mapRef.current.animateToRegion({
          ...UG_CAMPUS_DEFAULT,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });
      }
    } finally {
      if (isMountedRef.current && requestId === locationRequestIdRef.current) setIsLocating(false);
    }
  };

  // 5. Load Campus POIs & Popular Shortcuts
  const loadCampusPOIs = async () => {
    try {
      const [allPoiRes, popularRes] = await Promise.all([
        poiService.getAllPOIs(25),
        poiService.getPopularPOIs(8),
      ]);

      if (!isMountedRef.current) return;

      if (allPoiRes && allPoiRes.success && Array.isArray(allPoiRes.data)) {
        setCampusPois(allPoiRes.data);
      }

      if (popularRes && popularRes.success && Array.isArray(popularRes.data)) {
        setPopularPois(popularRes.data);
      } else if (allPoiRes?.data) {
        setPopularPois(allPoiRes.data.slice(0, 6));
      }
    } catch (err) {
      console.warn('[PassengerRideShell] Error loading POIs:', err);
    }
  };

  // 6. Section 3 Route Calculation
  const fetchRoute = useCallback(async (pickup, dropoff) => {
    const requestKey = createRouteRequestKey(pickup, dropoff);
    if (!requestKey) {
      setRouteError('Pickup and destination coordinates are invalid.');
      return;
    }

    routeAbortControllerRef.current?.abort();
    const controller = new AbortController();
    routeAbortControllerRef.current = controller;
    const requestId = routeRequestIdRef.current + 1;
    routeRequestIdRef.current = requestId;

    try {
      setIsRoutingLoading(true);
      setRouteError(null);
      setRouteData(null);
      setRouteCoordinates([]);
      if (setRideRoutePolyline) setRideRoutePolyline([]);

      const [pLng, pLat] = pickup.coordinates;
      const [dLng, dLat] = dropoff.coordinates;

      const res = await routingService.getRoute(pLng, pLat, dLng, dLat, { signal: controller.signal });
      if (
        requestId !== routeRequestIdRef.current
        || requestKey !== createRouteRequestKey(pickupLocationRef.current, dropoffLocationRef.current)
      ) return;

      if (res && res.success && res.data) {
        const coords = normalizeRoadRoute(res.data);
        if (!coords || res.data.estimateOnly === true) {
          setRouteError('A road-following route is unavailable. Please retry.');
          return;
        }

        setRouteData({ ...res.data, requestKey });
        setRouteCoordinates(coords);
        if (setRideRoutePolyline) {
          setRideRoutePolyline(coords);
        }

        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 72, right: 40, bottom: 40, left: 40 },
            animated: true,
          });
        }, 200);
      } else {
        setRouteError('Could not calculate a road-following route.');
      }
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || controller.signal.aborted) return;
      console.warn('[PassengerRideShell] Routing error:', err);
      if (requestId === routeRequestIdRef.current) {
        setRouteError(err?.message || 'Failed to calculate a road-following route.');
      }
    } finally {
      if (requestId === routeRequestIdRef.current) {
        routeAbortControllerRef.current = null;
        setIsRoutingLoading(false);
      }
    }
  }, [setRideRoutePolyline]);

  // 7. Map Recenter Action
  const handleRecenter = useCallback(() => {
    if (!mapRef.current) return;
    if (workspaceMode === 'ACTIVE_TRIP') {
      if (driverTelemetry?.coordinates && dropoffLocation?.coordinates) {
        const [dLng, dLat] = driverTelemetry.coordinates;
        const [destLng, destLat] = dropoffLocation.coordinates;
        mapRef.current.fitToCoordinates([
          { latitude: dLat, longitude: dLng },
          { latitude: destLat, longitude: destLng },
        ], {
          edgePadding: { top: 100, right: 50, bottom: responsiveBottomPadding, left: 50 },
          animated: true,
        });
        return;
      }
      if (dropoffLocation?.coordinates) {
        mapRef.current.animateToRegion({
          latitude: dropoffLocation.coordinates[1],
          longitude: dropoffLocation.coordinates[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        return;
      }
    } else if (workspaceMode === 'TRIP_COMPLETED') {
      if (dropoffLocation?.coordinates) {
        mapRef.current.animateToRegion({
          latitude: dropoffLocation.coordinates[1],
          longitude: dropoffLocation.coordinates[0],
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        });
        return;
      }
    } else if (
      (workspaceMode === 'DRIVER_APPROACH' || workspaceMode === 'DRIVER_ARRIVED') &&
      driverTelemetry?.coordinates &&
      pickupLocation?.coordinates
    ) {
      const [dLng, dLat] = driverTelemetry.coordinates;
      const [pLng, pLat] = pickupLocation.coordinates;
      mapRef.current.fitToCoordinates([
        { latitude: dLat, longitude: dLng },
        { latitude: pLat, longitude: pLng },
      ], {
        edgePadding: { top: 90, right: 50, bottom: responsiveBottomPadding, left: 50 },
        animated: true,
      });
      return;
    } else if (
      (workspaceMode === 'CONFIRMATION' || workspaceMode === 'ROUTE_OPTIONS' || workspaceMode === 'MATCHING' || workspaceMode === 'NO_DRIVER') &&
      pickupLocation?.coordinates &&
      dropoffLocation?.coordinates
    ) {
      mapRef.current.fitToCoordinates([
        { latitude: pickupLocation.coordinates[1], longitude: pickupLocation.coordinates[0] },
        { latitude: dropoffLocation.coordinates[1], longitude: dropoffLocation.coordinates[0] },
      ], {
        edgePadding: { top: 90, right: 40, bottom: responsiveBottomPadding, left: 40 },
        animated: true,
      });
      return;
    }

    if (userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      });
    } else {
      mapRef.current.animateToRegion({
        ...UG_CAMPUS_DEFAULT,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
    }
  }, [workspaceMode, driverTelemetry, dropoffLocation, pickupLocation, userLocation, responsiveBottomPadding]);

  // 8. Location Selection Handlers (Section 2)
  const handleStartSearch = (field = 'destination') => {
    setActiveEditField(field);
    setWorkspaceMode('SEARCH');
  };

  const handleSelectPopularPoi = async (poi) => {
    const formattedDropoff = normalizePoiLocation(poi);
    if (!formattedDropoff) return;
    invalidateRoute();
    setDropoffLocation(formattedDropoff);
    poiService.saveRecentLocation(formattedDropoff).catch(() => {});

    if (pickupLocation?.coordinates && formattedDropoff.coordinates) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates([
          { latitude: pickupLocation.coordinates[1], longitude: pickupLocation.coordinates[0] },
          { latitude: formattedDropoff.coordinates[1], longitude: formattedDropoff.coordinates[0] },
        ], {
          edgePadding: { top: 90, right: 40, bottom: responsiveBottomPadding, left: 40 },
          animated: true,
        });
      }, 200);
    }
    setWorkspaceMode('CONFIRMATION');
  };

  const handleSelectLocation = (field, location) => {
    invalidateRoute();
    if (field === 'pickup') {
      const manualPickup = { ...location, source: location.source || 'poi' };
      pickupSelectionModeRef.current = 'manual';
      pickupLocationRef.current = manualPickup;
      setPickupLocation(manualPickup);
    } else {
      setDropoffLocation(location);
    }

    const otherLocation = field === 'pickup' ? dropoffLocation : pickupLocation;
    if (otherLocation && otherLocation.coordinates) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates([
          {
            latitude: field === 'pickup' ? location.coordinates[1] : otherLocation.coordinates[1],
            longitude: field === 'pickup' ? location.coordinates[0] : otherLocation.coordinates[0],
          },
          {
            latitude: field === 'pickup' ? otherLocation.coordinates[1] : location.coordinates[1],
            longitude: field === 'pickup' ? otherLocation.coordinates[0] : location.coordinates[0],
          },
        ], {
          edgePadding: { top: 90, right: 40, bottom: responsiveBottomPadding, left: 40 },
          animated: true,
        });
      }, 200);
      setWorkspaceMode('CONFIRMATION');
    } else {
      setActiveEditField(field === 'pickup' ? 'destination' : 'pickup');
    }
  };

  const handleSwapLocations = useCallback(() => {
    if (!pickupLocation && !dropoffLocation) return;
    const tempPickup = pickupLocation;
    const tempDropoff = dropoffLocation;
    setPickupLocation(tempDropoff);
    setDropoffLocation(tempPickup);
    invalidateRoute();
  }, [pickupLocation, dropoffLocation, invalidateRoute, setPickupLocation, setDropoffLocation]);

  // 9. Map Pin Mode Handlers
  const handleInitiateMapPin = (field) => {
    setActiveEditField(field);
    const existing = field === 'pickup' ? pickupLocation : dropoffLocation;
    const initialCoords = existing?.coordinates || [
      userLocation?.longitude || UG_CAMPUS_DEFAULT.longitude,
      userLocation?.latitude || UG_CAMPUS_DEFAULT.latitude,
    ];

    setCandidatePinCoords(initialCoords);
    setResolvedPinName(existing?.name || 'Pinned location');
    setWorkspaceMode('MAP_PIN');

    mapRef.current?.animateToRegion({
      latitude: initialCoords[1],
      longitude: initialCoords[0],
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    });
  };

  const handleMapPinRegionChange = () => {
    setIsResolvingPin(true);
  };

  const handleMapPinRegionChangeComplete = useCallback((region) => {
    const coords = [region.longitude, region.latitude];
    setCandidatePinCoords(coords);
    const requestId = pinResolveRequestIdRef.current + 1;
    pinResolveRequestIdRef.current = requestId;

    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);

    resolveTimerRef.current = setTimeout(async () => {
      try {
        const resolved = await poiService.resolveLocationCoordinates(region.longitude, region.latitude, 250);
        if (requestId !== pinResolveRequestIdRef.current || workspaceModeRef.current !== 'MAP_PIN') return;
        if (resolved?.success && resolved.data?.name) {
          const nearbyName = resolved.data.nearbyPoi?.name;
          setResolvedPinName(
            resolved.data.isExactPoi
              ? resolved.data.name
              : nearbyName
                ? `Pinned location — near ${nearbyName}`
                : resolved.data.name
          );
        } else {
          setResolvedPinName('Pinned location');
        }
      } catch (e) {
        if (requestId !== pinResolveRequestIdRef.current || workspaceModeRef.current !== 'MAP_PIN') return;
        setResolvedPinName('Pinned location');
      } finally {
        if (requestId === pinResolveRequestIdRef.current && workspaceModeRef.current === 'MAP_PIN') {
          setIsResolvingPin(false);
        }
      }
    }, 700);
  }, []);

  const handleConfirmPinLocation = async () => {
    if (!candidatePinCoords) return;

    const resolved = {
      name: resolvedPinName || 'Pinned location',
      coordinates: candidatePinCoords,
      source: 'map_pin',
      verified: true,
    };

    poiService.saveRecentLocation(resolved).catch(() => {});

    if (activeEditField === 'pickup') {
      pickupSelectionModeRef.current = 'manual';
      pickupLocationRef.current = resolved;
      setPickupLocation(resolved);
    } else {
      setDropoffLocation(resolved);
    }
    invalidateRoute();

    const otherLocation = activeEditField === 'pickup' ? dropoffLocation : pickupLocation;
    if (otherLocation && otherLocation.coordinates) {
      setWorkspaceMode('CONFIRMATION');
    } else {
      setWorkspaceMode('SEARCH');
      setActiveEditField(activeEditField === 'pickup' ? 'destination' : 'pickup');
    }
  };

  const handleCancelPinSelection = () => {
    pinResolveRequestIdRef.current += 1;
    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    setIsResolvingPin(false);
    setWorkspaceMode('SEARCH');
  };

  const handleUseCurrentLocation = async () => {
    pickupSelectionModeRef.current = 'gps';
    if (userLocation?.verified && classifyLocationFix(userLocation).usable) {
      const gpsPickup = createGpsPickup(userLocation);
      pickupLocationRef.current = gpsPickup;
      setPickupLocation(gpsPickup);
      invalidateRoute();
      setLocationError(null);
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      });
      if (dropoffLocation?.coordinates) setWorkspaceMode('CONFIRMATION');
      else setActiveEditField('destination');
      return;
    }

    await requestUserLocation();
    if (isGpsPickup(pickupLocationRef.current)) {
      if (dropoffLocation?.coordinates) setWorkspaceMode('CONFIRMATION');
      else setActiveEditField('destination');
    }
  };

  // 10. Location Confirmation -> Section 3 Route Options
  const handleConfirmLocations = () => {
    setWorkspaceMode('ROUTE_OPTIONS');
    setRideStep(RIDE_STATES.REVIEWING_OFFERS);
    fetchRoute(pickupLocation, dropoffLocation);
  };

  // 11. Section 4 Ride Request Dispatch Handlers
  const handleRequestRide = async () => {
    if (!pickupLocation || !dropoffLocation) return;
    if (isGpsPickup(pickupLocation)) {
      const gpsFix = {
        latitude: pickupLocation.coordinates?.[1],
        longitude: pickupLocation.coordinates?.[0],
        accuracy: pickupLocation.gps?.accuracyMeters,
        timestamp: pickupLocation.gps?.capturedAt ? new Date(pickupLocation.gps.capturedAt).getTime() : NaN,
      };
      if (!classifyLocationFix(gpsFix).usable) {
        await requestUserLocation();
        const refreshedPickup = pickupLocationRef.current;
        if (!refreshedPickup || !isGpsPickup(refreshedPickup)) {
          Alert.alert('Pickup unavailable', 'Choose a manual pickup or retry GPS before requesting a ride.');
          return;
        }
        Alert.alert('Pickup refreshed', 'Your current location changed. Review the updated route before requesting.');
        fetchRoute(refreshedPickup, dropoffLocationRef.current);
        return;
      }
    }
    if (!routeMatchesLocations(routeData, pickupLocation, dropoffLocation) || routeCoordinates.length < 3) {
      Alert.alert('Route Changed', 'Please wait for an updated road route before booking.');
      fetchRoute(pickupLocation, dropoffLocation);
      return;
    }
    try {
      setIsRequesting(true);
      const bookingPayload = buildBookingPayload({
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        rideMode: selectedRideMode,
        route: routeData,
      });
      if (departureMode === 'scheduled') bookingPayload.scheduledTime = scheduledTime.toISOString();
      const booking = await createBooking(bookingPayload);

      if (booking && booking._id) {
        if (booking.status === 'scheduled') {
          scheduleRideReminder(booking).catch((error) => {
            console.warn('[Scheduling] Device reminder could not be registered:', error?.message);
          });
          Alert.alert(
            'Ride scheduled',
            `CampusRide will start looking for a driver at ${new Date(booking.scheduledTime).toLocaleString()}.`,
            [
              { text: 'Done', style: 'cancel' },
              { text: 'View scheduled rides', onPress: () => navigation?.navigate('ScheduledRides') },
            ],
          );
          setDropoffLocation(null);
          setRouteData(null);
          setRouteCoordinates([]);
          setDepartureMode('now');
          setRideStep(RIDE_STATES.IDLE);
          setWorkspaceMode('IDLE');
          return;
        }
        // Race check: if assignment already occurred via socket, assignment wins
        if (rideStepRef.current === RIDE_STATES.DRIVER_EN_ROUTE_PICKUP) {
          return;
        }

        setWorkspaceMode('MATCHING');
      }
    } catch (err) {
      console.error('[PassengerRideShell] Request ride error:', err);
      Alert.alert('Request Failed', err?.message || 'Could not place your ride request. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  // 12. Redispatch / Try Again (Section 4 Zero Driver Recovery)
  const handleTryAgain = async () => {
    const bookingId = activeBooking?._id;
    if (!bookingId) {
      handleRequestRide();
      return;
    }

    try {
      setIsRetryingDispatch(true);
      setWorkspaceMode('MATCHING');
      const dispatchRes = await bookingService.dispatchBooking(bookingId);
      if (rideStepRef.current === RIDE_STATES.DRIVER_EN_ROUTE_PICKUP) {
        return; // Assignment won while redispatching
      }
      if (dispatchRes && dispatchRes.data && dispatchRes.data.dispatchedToCount === 0) {
        setTimeout(() => {
          if (rideStepRef.current !== RIDE_STATES.DRIVER_EN_ROUTE_PICKUP) {
            setWorkspaceMode('NO_DRIVER');
          }
        }, 1200);
      }
    } catch (err) {
      console.warn('[PassengerRideShell] Redispatch error:', err);
      setWorkspaceMode('NO_DRIVER');
    } finally {
      setIsRetryingDispatch(false);
    }
  };

  // 13. Cancellation Handlers (Preserves Journey Configuration on Cancel)
  const handleConfirmCancel = async () => {
    try {
      setIsCancellingBooking(true);
      await cancelActiveBooking('Cancelled by passenger');
      setShowCancelModal(false);
      // Recovery principle: Return directly to ROUTE_OPTIONS with route and locations preserved
      setWorkspaceMode('ROUTE_OPTIONS');
    } catch (err) {
      console.warn('[PassengerRideShell] Cancel error:', err);
      setShowCancelModal(false);
      setWorkspaceMode('ROUTE_OPTIONS');
    } finally {
      setIsCancellingBooking(false);
    }
  };

  const handleConfirmAssignedCancel = async () => {
    try {
      setIsCancellingBooking(true);
      await cancelActiveBooking('Cancelled by passenger after driver assignment');
      setShowAssignedCancelModal(false);
      // Recovery principle: Return directly to ROUTE_OPTIONS with route and locations preserved
      setWorkspaceMode('ROUTE_OPTIONS');
    } catch (err) {
      console.warn('[PassengerRideShell] Assigned cancel error:', err);
      setShowAssignedCancelModal(false);
      setWorkspaceMode('ROUTE_OPTIONS');
    } finally {
      setIsCancellingBooking(false);
    }
  };

  const handleDismissDriverCancelled = () => {
    setShowDriverCancelledModal(false);
    if (setCancellationReason) setCancellationReason(null);
    setRideStep(RIDE_STATES.REVIEWING_OFFERS);
    setWorkspaceMode('ROUTE_OPTIONS');
  };

  const handleCompletedRideDone = useCallback(() => {
    invalidateRoute();
    setRemainingRouteCoordinates([]);
    resetRide();
    navigation?.navigate('ActivityTab');
  }, [invalidateRoute, navigation, resetRide]);


  // 15. Road distance and ETA presentation
  const distanceMeters = Number(routeData?.distanceMeters) || 0;
  const durationSeconds = Number(routeData?.durationSeconds) || 0;
  const routeDistanceLabel = distanceMeters >= 1000
    ? `${(distanceMeters / 1000).toFixed(1)} km`
    : `${Math.round(distanceMeters)} m`;
  const routeEtaLabel = routeData?.formattedETA || (durationSeconds > 0 ? `${Math.ceil(durationSeconds / 60)} mins` : '');
  const hasCurrentRoadRoute = routeMatchesLocations(routeData, pickupLocation, dropoffLocation)
    && routeCoordinates.length >= 3
    && routeData?.estimateOnly !== true;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.brand.baseBackground }]}>
      <StatusBar
        barStyle={workspaceMode === 'SEARCH' && theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* 1. PERSISTENT MAP CANVAS (Never unmounted across Sections 1–7) */}
      <PassengerMap
        ref={mapRef}
        userLocation={userLocation}
        isLocating={isLocating}
        pois={campusPois}
        selectedPoi={campusPois.find((poi) => String(poi._id || poi.id) === String(dropoffLocation?.poiId || pickupLocation?.poiId)) || null}
        pickupLocation={pickupLocation}
        dropoffLocation={dropoffLocation}
        driverTelemetry={driverTelemetry}
        availableDrivers={availableDrivers}
        routeCoordinates={rideStep === RIDE_STATES.TRIP_IN_TRANSIT || rideStep === RIDE_STATES.TRIP_COMPLETED
          ? remainingRouteCoordinates
          : routeCoordinates}
        isMapPinMode={workspaceMode === 'MAP_PIN'}
        hideUserLocation={workspaceMode === 'ACTIVE_TRIP' || workspaceMode === 'TRIP_COMPLETED'}
        hideDriverMarker={workspaceMode === 'TRIP_COMPLETED'}
        hidePickupMarker={workspaceMode === 'IDLE' || workspaceMode === 'ACTIVE_TRIP' || workspaceMode === 'TRIP_COMPLETED'}
        showScrim={workspaceMode === 'TRIP_COMPLETED'}
        onMapPinRegionChange={handleMapPinRegionChange}
        onMapPinRegionChangeComplete={handleMapPinRegionChangeComplete}
        onSelectPoi={(poi) => handleSelectPopularPoi(poi)}
        mapBottomInset={mapBottomInset}
        showPointsOfInterest={[
          'IDLE',
          'MAP_PIN',
          'CONFIRMATION',
          'ROUTE_OPTIONS',
          'MATCHING',
          'DRIVER_APPROACH',
          'DRIVER_ARRIVED',
          'ACTIVE_TRIP',
        ].includes(workspaceMode)}
      />

      {/* 2. PERSISTENT MAP OVERLAYS (Avatar & Recenter FAB) */}
      <PassengerMapOverlays
        user={user}
        onPressProfile={() => navigation?.navigate('ProfileTab')}
        onPressRecenter={handleRecenter}
        showTopBar={workspaceMode === 'IDLE'}
        showRecenter={workspaceMode === 'IDLE' || workspaceMode === 'MAP_PIN' || workspaceMode === 'CONFIRMATION'}
        recenterBottomOffset={
          workspaceMode === 'IDLE'
            ? mapBottomInset + 16
            : workspaceMode === 'MAP_PIN'
            ? mapBottomInset + 16
            : workspaceMode === 'ROUTE_OPTIONS'
            ? responsiveBottomPadding
            : workspaceMode === 'MATCHING' || workspaceMode === 'NO_DRIVER'
            ? 250
            : workspaceMode === 'DRIVER_APPROACH' || workspaceMode === 'DRIVER_ARRIVED'
            ? 280
            : workspaceMode === 'ACTIVE_TRIP'
            ? 200
            : 240
        }
      />

      {(workspaceMode === 'MAP_PIN' || workspaceMode === 'ROUTE_OPTIONS') && (
        <TouchableOpacity
          style={[
            styles.mapPinBackButton,
            {
              top: insets.top + spacing.xs,
              backgroundColor: theme.colors.surface.elevated,
              borderColor: theme.colors.border.subtle,
            },
          ]}
          onPress={workspaceMode === 'MAP_PIN' ? handleCancelPinSelection : () => setWorkspaceMode('CONFIRMATION')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={workspaceMode === 'MAP_PIN' ? 'Back to location search' : 'Back to location confirmation'}
        >
          <CRIcon name="arrow-back" size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
      )}

      {workspaceMode === 'MATCHING' && (
        <MatchingWorkspace
          rideMode={selectedRideMode}
          onPressCancelRequest={() => setShowCancelModal(true)}
          onPressEditPickup={() => handleStartSearch('pickup')}
          bottomInset={safeBottom}
        />
      )}

      {/* 2b. Section 6 Safety FAB (Top-Right Map Overlay) */}
      {workspaceMode === 'ACTIVE_TRIP' && (
        <View style={[styles.activeTripTopBar, { top: insets.top + spacing.xs }]} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.safetyFab, { backgroundColor: theme.colors.surface.elevated, borderColor: theme.colors.border.subtle }]}
            onPress={() => setShowSafetySheet(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Safety and Support"
          >
            <CRIcon name="shield-checkmark" size={20} color={theme.colors.brand.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* 3. DYNAMIC RIDE WORKSPACE (Transforms around the persistent map) */}
      <View
        style={[
          styles.workspaceContainer,
          workspaceMode === 'SEARCH' && styles.searchWorkspaceFullHeight,
          workspaceMode === 'TRIP_COMPLETED' && styles.completedWorkspaceFullHeight,
          {
            paddingBottom: workspaceMode === 'IDLE' || workspaceMode === 'MATCHING' ? 0 : safeBottom,
            backgroundColor: workspaceMode === 'MATCHING' || workspaceMode === 'IDLE'
              ? 'transparent'
              : theme.colors.brand.baseBackground,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Section 1: Idle Discovery */}
        {workspaceMode === 'IDLE' && (
          <IdleDiscoveryWorkspace
            pickupLocationName={pickupLocation?.name}
            isLocating={isLocating}
            locationError={locationError}
            onPressPickup={() => handleStartSearch('pickup')}
            popularPois={popularPois}
            onPressSearch={() => handleStartSearch('destination')}
            onSelectPopularPoi={handleSelectPopularPoi}
            onPressAddLocation={() => navigation?.navigate('AddLocation')}
          />
        )}

        {/* Section 2: Location Search */}
        {workspaceMode === 'SEARCH' && (
          <LocationSearchWorkspace
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            initialActiveField={activeEditField}
            onSelectLocation={handleSelectLocation}
            onInitiateMapPin={handleInitiateMapPin}
            onUseCurrentLocation={handleUseCurrentLocation}
            onSwapLocations={handleSwapLocations}
            isLocating={isLocating}
            locationError={locationError}
            onPressBack={() => {
              Keyboard.dismiss();
              setWorkspaceMode('IDLE');
            }}
            style={{ paddingTop: insets.top + spacing.xs }}
          />
        )}

        {/* Section 2: Manual Map Pin Adjustment */}
        {workspaceMode === 'MAP_PIN' && (
          <MapPinWorkspace
            targetField={activeEditField}
            resolvedLocationName={resolvedPinName}
            candidateCoords={candidatePinCoords}
            isResolving={isResolvingPin}
            onConfirmPinLocation={handleConfirmPinLocation}
          />
        )}

        {/* Section 2: Location Confirmation */}
        {workspaceMode === 'CONFIRMATION' && (
          <LocationConfirmationWorkspace
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            onConfirmLocations={handleConfirmLocations}
            onAdjustOnMap={() => handleInitiateMapPin('destination')}
            onEditPickup={() => handleStartSearch('pickup')}
            onEditDestination={() => handleStartSearch('destination')}
            onPressBack={() => setWorkspaceMode('SEARCH')}
          />
        )}

        {/* Section 3: Route Options & Ride Configuration */}
        {workspaceMode === 'ROUTE_OPTIONS' && (
          <RouteOptionsWorkspace
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            isRoutingLoading={isRoutingLoading}
            routeError={routeError}
            routeEstimateOnly={routeData?.estimateOnly === true}
            distanceLabel={routeDistanceLabel}
            etaLabel={routeEtaLabel}
            selectedRideMode={selectedRideMode}
            canRequestRide={hasCurrentRoadRoute}
            onSelectRideMode={(mode) => setSelectedRideMode(mode)}
            onRequestRide={handleRequestRide}
            departureMode={departureMode}
            scheduledTime={scheduledTime}
            onChangeDepartureMode={setDepartureMode}
            onChangeScheduledTime={setScheduledTime}
            isRequesting={isRequesting}
            onRetryRoute={() => fetchRoute(pickupLocation, dropoffLocation)}
            onPressBack={() => setWorkspaceMode('CONFIRMATION')}
          />
        )}

        {/* Section 4: Ride Request & Matching */}
        {/* Section 4: Zero Driver Recovery */}
        {workspaceMode === 'NO_DRIVER' && (
          <NoDriverWorkspace
            onPressTryAgain={handleTryAgain}
            onPressCancelRequest={() => setShowCancelModal(true)}
            isRetrying={isRetryingDispatch}
            pickupLocationName={pickupLocation?.name || 'Pickup'}
          />
        )}

        {/* Section 5: Driver En Route Approach */}
        {workspaceMode === 'DRIVER_APPROACH' && (
          <DriverApproachWorkspace
            driver={activeDriver}
            pickupLocationName={pickupLocation?.name || 'Pickup'}
            rideMode={selectedRideMode}
            onPressCancelRide={() => setShowAssignedCancelModal(true)}
          />
        )}

        {/* Section 5: Driver Arrived at Pickup */}
        {workspaceMode === 'DRIVER_ARRIVED' && (
          <DriverArrivedWorkspace
            driver={activeDriver}
            pickupLocationName={pickupLocation?.name}
            rideMode={selectedRideMode}
            onPressCancelRide={() => setShowAssignedCancelModal(true)}
          />
        )}

        {/* Section 6: Active Trip in Transit */}
        {workspaceMode === 'ACTIVE_TRIP' && (
          <ActiveTripWorkspace
            driver={activeDriver}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            rideMode={selectedRideMode}
            isDropoffArrived={isDropoffArrived}
            stopsAheadCount={stopsAheadCount}
            connectionStatus={connectionStatus}
            onPressSafety={() => setShowSafetySheet(true)}
          />
        )}

        {/* Section 7: Trip Completion, Summary & Rating */}
        {workspaceMode === 'TRIP_COMPLETED' && (
          <TripCompletionWorkspace
            booking={activeBooking}
            driver={activeDriver}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            rideMode={selectedRideMode}
            onSubmitRating={submitReview}
            onDone={handleCompletedRideDone}
          />
        )}
      </View>

      {/* 4. Pre-Assignment Cancellation Confirmation Modal (Section 4) */}
      <CancelRideRequestModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmCancel={handleConfirmCancel}
        isCancelling={isCancellingBooking}
      />

      {/* 5. Post-Assignment Cancellation Confirmation Modal (Section 5) */}
      <AssignedRideCancellationModal
        visible={showAssignedCancelModal}
        onClose={() => setShowAssignedCancelModal(false)}
        onConfirmCancel={handleConfirmAssignedCancel}
        isCancelling={isCancellingBooking}
      />

      {/* 6. Driver/Backend Cancellation Product Recovery Modal */}
      <RideCancelledModal
        visible={showDriverCancelledModal}
        onDismiss={handleDismissDriverCancelled}
        reason={cancellationReason}
      />

      {/* 7. Section 6 Safety & Support Sheet Modal */}
      <SafetySupportSheet
        visible={showSafetySheet}
        onClose={() => setShowSafetySheet(false)}
        activeBooking={activeBooking}
        activeDriver={activeDriver}
        pickupLocation={pickupLocation}
        dropoffLocation={dropoffLocation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.baseBackground,
  },
  workspaceContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  searchWorkspaceFullHeight: {
    top: 0,
    bottom: 0,
  },
  completedWorkspaceFullHeight: {
    top: 0,
    bottom: 0,
  },
  mapPinBackButton: {
    position: 'absolute',
    left: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  activeTripTopBar: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 10,
  },
  safetyFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PassengerRideShell;
