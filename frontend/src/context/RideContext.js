import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { getPersistentSocket, disconnectSocket } from '../api/socketHelper';
import { useAuth } from './AuthContext';
import { bookingService } from '../api/services/bookingService';
import { ratingService } from '../api/services/ratingService';

export const RIDE_STATES = {
  IDLE: 'IDLE',
  SELECTING_DESTINATION: 'SELECTING_DESTINATION',
  REVIEWING_OFFERS: 'REVIEWING_OFFERS',
  SCHEDULED: 'SCHEDULED',
  MATCHING_DISPATCH: 'MATCHING_DISPATCH',
  NO_DRIVER: 'NO_DRIVER',
  DRIVER_EN_ROUTE_PICKUP: 'DRIVER_EN_ROUTE_PICKUP',
  DRIVER_AT_PICKUP: 'DRIVER_AT_PICKUP',
  TRIP_IN_TRANSIT: 'TRIP_IN_TRANSIT',
  TRIP_COMPLETED: 'TRIP_COMPLETED',
  CANCELLED_TERMINAL: 'CANCELLED_TERMINAL',
};

const RideContext = createContext(null);

export const RideProvider = ({ children }) => {
  const { isLoggedIn, token: authToken, user } = useAuth() || {};

  const [rideStep, setRideStep] = useState(RIDE_STATES.IDLE);
  const [activeBooking, setActiveBooking] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);
  const [activeDriver, setActiveDriver] = useState(null);
  const [driverTelemetry, setDriverTelemetry] = useState(null);
  const [stops, setStops] = useState([]);
  const [currentStop, setCurrentStop] = useState(null);
  const [routePolyline, setRoutePolyline] = useState(null);

  // Selected Locations for Booking Flow
  const [pickupLocation, setPickupLocation] = useState(null); // { name, coordinates: [lng, lat] }
  const [dropoffLocation, setDropoffLocation] = useState(null); // { name, coordinates: [lng, lat] }
  const [selectedRideMode, setSelectedRideMode] = useState('solo'); // 'solo' | 'shared'
  const [cancellationReason, setCancellationReason] = useState(null);
  const [isDropoffArrived, setIsDropoffArrived] = useState(false);
  const [stopsAheadCount, setStopsAheadCount] = useState(null);

  // Connection & Error State
  const [connectionStatus, setConnectionStatus] = useState('ONLINE'); // 'ONLINE' | 'OFFLINE' | 'RECONNECTING'
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const socketRef = useRef(null);
  const activeTripIdRef = useRef(null);
  activeTripIdRef.current = activeTripId;

  const reconcileCurrentRide = useCallback(async () => {
    if (!isLoggedIn || !authToken || (user?.role && !['passenger', 'student'].includes(user.role))) return;
    try {
      const result = await bookingService.getCurrentBooking();
      const booking = result?.data;
      if (!booking) {
        setActiveBooking((previous) => {
          if (previous?.status === 'pending') setRideStep(RIDE_STATES.NO_DRIVER);
          return null;
        });
        return;
      }
      setActiveBooking(booking);
      setPickupLocation(booking.pickup ? { ...booking.pickup, coordinates: booking.pickup.coordinates?.coordinates || booking.pickup.coordinates } : null);
      setDropoffLocation(booking.dropoff ? { ...booking.dropoff, coordinates: booking.dropoff.coordinates?.coordinates || booking.dropoff.coordinates } : null);
      const tripId = booking.driverTripId || null;
      setActiveTripId(tripId);
      activeTripIdRef.current = tripId;
      if (booking.driverId && typeof booking.driverId === 'object') setActiveDriver(booking.driverId);
      if (booking.currentTrip?.tripStops) {
        setStops(booking.currentTrip.tripStops);
        setCurrentStop(booking.currentTrip.tripStops.find((stop) => !['completed', 'cancelled', 'skipped'].includes(stop.status)) || null);
      }
      const nextState = booking.status === 'pending'
        ? RIDE_STATES.MATCHING_DISPATCH
        : booking.status === 'driver_assigned'
          ? RIDE_STATES.DRIVER_EN_ROUTE_PICKUP
          : booking.status === 'arrived_at_pickup'
            ? RIDE_STATES.DRIVER_AT_PICKUP
            : booking.status === 'in_progress'
              ? RIDE_STATES.TRIP_IN_TRANSIT
              : RIDE_STATES.IDLE;
      setRideStep(nextState);
      if (tripId && socketRef.current?.connected) socketRef.current.emit('trip:join', { tripId });
    } catch (recoveryError) {
      console.warn('[RideContext] Current ride recovery failed:', recoveryError?.message);
    }
  }, [isLoggedIn, authToken, user?.role]);

  useEffect(() => {
    if (!isLoggedIn || !authToken) return undefined;
    reconcileCurrentRide();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') reconcileCurrentRide();
    });
    return () => subscription.remove();
  }, [isLoggedIn, authToken, reconcileCurrentRide]);

  // 1. Centralized Socket Subscription Management (Authenticated Only)
  useEffect(() => {
    let isMounted = true;
    let cleanupSocket = null;

    // Guard: Do not attempt socket connection for unauthenticated sessions
    if (!isLoggedIn || !authToken) {
      if (socketRef.current) {
        disconnectSocket();
        socketRef.current = null;
      }
      setConnectionStatus('OFFLINE');
      return;
    }

    async function initSocket() {
      try {
        const socket = await getPersistentSocket();
        if (!isMounted || !socket) return;
        socketRef.current = socket;

        // Socket Connection Lifecycle
        const handleConnect = () => {
          if (!isMounted) return;
          setConnectionStatus('ONLINE');
          setError(null);
          // Re-join active trip room on reconnect
          if (activeTripIdRef.current) {
            socket.emit('trip:join', { tripId: activeTripIdRef.current });
          }
          reconcileCurrentRide();
        };

        const handleDisconnect = () => {
          if (!isMounted) return;
          setConnectionStatus('OFFLINE');
        };

        const handleConnectError = (err) => {
          if (!isMounted) return;
          setConnectionStatus('RECONNECTING');
        };

        // Ride Lifecycle Events
        const handleRideAssigned = (data) => {
          if (!isMounted) return;
          console.log('[RideContext] 🎉 ride:assigned received:', data);

          const tripId = data.driverTripId || data.tripId || null;
          if (tripId) {
            setActiveTripId(tripId);
            activeTripIdRef.current = tripId;
            socket.emit('trip:join', { tripId });
          }

          if (data.driver) {
            setActiveDriver({
              id: data.driver._id || data.driver.id || data.driverId,
              fullName: data.driver.fullName || data.driver.name || null,
              phoneNumber: data.driver.phoneNumber || '',
              rating: data.driver.rating ?? null,
              avatarUri: data.driver.avatarUri || data.driver.avatar || null,
              vehicleModel: data.driver.vehicleModel || data.driver.vehicle?.model || null,
              vehicleColor: data.driver.vehicleColor || data.driver.vehicle?.color || '',
              vehicleLicensePlate: data.driver.vehicleLicensePlate || data.driver.vehicle?.licensePlate || null,
              currentLocation: data.driver.currentLocation || null,
            });
          }

          setRideStep(RIDE_STATES.DRIVER_EN_ROUTE_PICKUP);
        };

        const handleTelemetry = (data) => {
          if (!isMounted) return;
          if (data?.coordinates && Array.isArray(data.coordinates)) {
            setDriverTelemetry({
              coordinates: data.coordinates, // [lng, lat]
              heading: data.heading || 0,
              speed: data.speed || 0,
              timestamp: data.timestamp || new Date(),
            });
          }
        };

        const handleStopUpdate = (data) => {
          if (!isMounted) return;
          console.log('[RideContext] 📍 trip:stop_update received:', data);
          const targetStatus = data?.targetStatus || data?.stop?.status;
          const stopType = data?.stop?.stopType;

          if (targetStatus === 'arrived' || targetStatus === 'arrived_at_pickup') {
            if (stopType === 'dropoff') {
              setIsDropoffArrived(true);
            } else {
              setRideStep(RIDE_STATES.DRIVER_AT_PICKUP);
            }
          } else if (targetStatus === 'completed' && stopType === 'pickup') {
            setIsDropoffArrived(false);
            setRideStep(RIDE_STATES.TRIP_IN_TRANSIT);
          } else if (targetStatus === 'completed' && stopType === 'dropoff') {
            // Dropoff stop completed at trip level:
            // Update stop info only. MUST NOT independently enter Section 7.
            // Section 7 entry is exclusively governed by private authoritative 'ride:completed'.
            setIsDropoffArrived(true);
          }

          if (data?.stop) {
            setCurrentStop(data.stop);
          }

          if (data?.stopsAheadCount !== undefined && data.stopsAheadCount !== null) {
            setStopsAheadCount(Number(data.stopsAheadCount));
          }
        };

        const handleRouteUpdated = (data) => {
          if (!isMounted) return;
          console.log('[RideContext] 🛣️ trip:route-updated received:', data);
          if (data?.stopsAheadCount !== undefined && data.stopsAheadCount !== null) {
            setStopsAheadCount(Number(data.stopsAheadCount));
          }
        };

        const handleStatusChange = (data) => {
          if (!isMounted) return;
          console.log('[RideContext] ⚡ trip:status_change received:', data);
          const status = data?.status;
          if (status === 'active' || status === 'in_progress') {
            setRideStep(RIDE_STATES.TRIP_IN_TRANSIT);
          } else if (status === 'cancelled') {
            setRideStep(RIDE_STATES.CANCELLED_TERMINAL);
          }
          // Note: status === 'completed' on trip level does NOT independently transition passenger.
          // Private 'ride:completed' is the authoritative Passenger booking-completion boundary.
        };

        const handleRideCancelled = (data) => {
          if (!isMounted) return;
          console.log('[RideContext] 🛑 ride:cancelled received:', data);
          if (activeTripIdRef.current && socketRef.current) {
            socketRef.current.emit('trip:leave', { tripId: activeTripIdRef.current });
            activeTripIdRef.current = null;
          }
          setActiveBooking(null);
          setActiveTripId(null);
          setActiveDriver(null);
          setDriverTelemetry(null);

          const safeReason = typeof data?.reason === 'string' && data.reason.trim().length > 0
            ? data.reason.trim()
            : 'The driver had to cancel this ride request.';

          setCancellationReason(safeReason);
          setError(safeReason);
          setRideStep(RIDE_STATES.CANCELLED_TERMINAL);
        };

        const handleBookingStatusChanged = (data) => {
          if (!isMounted) return;
          if (['cancelled_timeout', 'failed_no_drivers'].includes(data?.status)) {
            setActiveBooking(null);
            setActiveTripId(null);
            setRideStep(RIDE_STATES.NO_DRIVER);
          } else if (['cancelled', 'emergency_cancelled'].includes(data?.status)) {
            handleRideCancelled(data);
          }
        };

        const handleScheduledActivation = () => {
          if (!isMounted) return;
          setRideStep(RIDE_STATES.MATCHING_DISPATCH);
          reconcileCurrentRide();
        };

        const handleRideCompleted = (data) => {
          if (!isMounted) return;
          console.log('[RideContext] 🏁 ride:completed received:', data);
          // Shared Isolation: Leave trip room immediately upon receiving individual completion
          if (activeTripIdRef.current && socketRef.current) {
            socketRef.current.emit('trip:leave', { tripId: activeTripIdRef.current });
            activeTripIdRef.current = null;
          }
          const completedTimestamp = data?.completedAt || null;
          setActiveBooking((prev) => {
            if (!prev) {
              return { _id: data?.bookingId, completedAt: completedTimestamp, status: 'completed' };
            }
            return {
              ...prev,
              completedAt: completedTimestamp || prev.completedAt || null,
              status: 'completed',
            };
          });
          setIsDropoffArrived(true);
          setRideStep(RIDE_STATES.TRIP_COMPLETED);
        };

        // Attach listeners cleanly
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);

        socket.on('ride:assigned', handleRideAssigned);
        socket.on('rideAccepted', handleRideAssigned);
        socket.on('driver:telemetry', handleTelemetry);
        socket.on('trip:stop_update', handleStopUpdate);
        socket.on('trip:route-updated', handleRouteUpdated);
        socket.on('trip:route_updated', handleRouteUpdated);
        socket.on('trip:status_change', handleStatusChange);
        socket.on('ride:cancelled', handleRideCancelled);
        socket.on('ride:completed', handleRideCompleted);
        socket.on('booking:status_changed', handleBookingStatusChanged);
        socket.on('booking:scheduled_activated', handleScheduledActivation);

        cleanupSocket = () => {
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
          socket.off('connect_error', handleConnectError);

          socket.off('ride:assigned', handleRideAssigned);
          socket.off('rideAccepted', handleRideAssigned);
          socket.off('driver:telemetry', handleTelemetry);
          socket.off('trip:stop_update', handleStopUpdate);
          socket.off('trip:route-updated', handleRouteUpdated);
          socket.off('trip:route_updated', handleRouteUpdated);
          socket.off('trip:status_change', handleStatusChange);
          socket.off('ride:cancelled', handleRideCancelled);
          socket.off('ride:completed', handleRideCompleted);
          socket.off('booking:status_changed', handleBookingStatusChanged);
          socket.off('booking:scheduled_activated', handleScheduledActivation);
        };
      } catch (err) {
        console.error('[RideContext] Socket initialization error:', err);
      }
    }

    initSocket();

    return () => {
      isMounted = false;
      if (cleanupSocket) cleanupSocket();
    };
  }, [isLoggedIn, authToken, reconcileCurrentRide]);

  // 2. Action Dispatchers
  const startDestinationSearch = useCallback(() => {
    setRideStep(RIDE_STATES.SELECTING_DESTINATION);
  }, []);

  const selectDestination = useCallback((destination) => {
    setDropoffLocation(destination);
    setRideStep(RIDE_STATES.REVIEWING_OFFERS);
  }, []);

  const selectPickup = useCallback((pickup) => {
    setPickupLocation(pickup);
  }, []);

  const createBooking = useCallback(async (payload) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await bookingService.createBooking({
        pickup: payload.pickup || pickupLocation,
        dropoff: payload.dropoff || dropoffLocation,
        rideMode: payload.rideMode || selectedRideMode,
        scheduledTime: payload.scheduledTime || null,
        notes: payload.notes || '',
        routeRequestKey: payload.routeRequestKey || null,
      });

      if (result?.success && result?.data) {
        if (result.data.status === 'scheduled') {
          setActiveBooking(null);
          setRideStep(RIDE_STATES.SCHEDULED);
          return result.data;
        }
        setActiveBooking(result.data);
        // RACE PROTECTION: Assignment must win if ride:assigned arrived before HTTP returned
        setRideStep((prevStep) => {
          const assignedOrLater = [
            RIDE_STATES.DRIVER_EN_ROUTE_PICKUP,
            RIDE_STATES.DRIVER_AT_PICKUP,
            RIDE_STATES.TRIP_IN_TRANSIT,
            RIDE_STATES.TRIP_COMPLETED,
          ];
          if (assignedOrLater.includes(prevStep)) {
            return prevStep; // Assignment won the race
          }
          return RIDE_STATES.MATCHING_DISPATCH;
        });
        return result.data;
      } else {
        throw new Error(result?.error?.message || 'Failed to create booking');
      }
    } catch (err) {
      setError(err.message || 'Booking creation failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [pickupLocation, dropoffLocation, selectedRideMode]);

  const cancelActiveBooking = useCallback(async (reason = 'Cancelled by passenger') => {
    try {
      setIsLoading(true);
      if (activeBooking?._id) {
        await bookingService.cancelBooking(activeBooking._id, reason);
      }
      if (activeTripId && socketRef.current) {
        socketRef.current.emit('trip:leave', { tripId: activeTripId });
      }
      setActiveBooking(null);
      setActiveTripId(null);
      setActiveDriver(null);
      setRideStep(RIDE_STATES.REVIEWING_OFFERS);
    } catch (err) {
      console.error('[RideContext] Cancellation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeBooking, activeTripId]);

  const submitReview = useCallback(async (ratingScore, comment = '') => {
    try {
      setIsLoading(true);
      setError(null);
      if (activeBooking?._id) {
        const result = await ratingService.submitRating({
          bookingId: activeBooking._id,
          driverId: activeDriver?.id || activeBooking?.driverId,
          score: ratingScore,
          comment: String(comment).trim(),
        });
        return result;
      }
      return null;
    } catch (err) {
      console.error('[RideContext] Rating submission error:', err);
      const isAlreadyRated = err?.message?.includes('RATING_ALREADY_EXISTS') ||
                            err?.response?.data?.error?.code === 'RATING_ALREADY_EXISTS';
      if (isAlreadyRated) {
        return { success: true, message: 'Already rated' };
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeBooking, activeDriver]);

  const resetRide = useCallback(() => {
    if (activeTripId && socketRef.current) {
      socketRef.current.emit('trip:leave', { tripId: activeTripId });
    }
    activeTripIdRef.current = null;
    setRideStep(RIDE_STATES.IDLE);
    setActiveBooking(null);
    setActiveTripId(null);
    setActiveDriver(null);
    setDriverTelemetry(null);
    setStops([]);
    setCurrentStop(null);
    setPickupLocation(null);
    setDropoffLocation(null);
    setRoutePolyline([]);
    setIsDropoffArrived(false);
    setStopsAheadCount(null);
    setError(null);
    setIsLoading(false);
  }, [activeTripId]);

  return (
    <RideContext.Provider
      value={{
        rideStep,
        setRideStep,
        activeBooking,
        activeTripId,
        activeDriver,
        driverTelemetry,
        stops,
        currentStop,
        isDropoffArrived,
        stopsAheadCount,
        routePolyline,
        setRoutePolyline,
        pickupLocation,
        setPickupLocation,
        dropoffLocation,
        setDropoffLocation,
        selectedRideMode,
        setSelectedRideMode,
        cancellationReason,
        setCancellationReason,
        connectionStatus,
        error,
        isLoading,
        startDestinationSearch,
        selectDestination,
        selectPickup,
        createBooking,
        cancelActiveBooking,
        submitReview,
        resetRide,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};

export default RideContext;
