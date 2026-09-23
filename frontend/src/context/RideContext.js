import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getPersistentSocket, disconnectSocket } from '../api/socketHelper';
import { useAuth } from './AuthContext';
import { bookingService } from '../api/services/bookingService';
import { ratingService } from '../api/services/ratingService';

export const RIDE_STATES = {
  IDLE: 'IDLE',
  SELECTING_DESTINATION: 'SELECTING_DESTINATION',
  REVIEWING_OFFERS: 'REVIEWING_OFFERS',
  MATCHING_DISPATCH: 'MATCHING_DISPATCH',
  DRIVER_EN_ROUTE_PICKUP: 'DRIVER_EN_ROUTE_PICKUP',
  DRIVER_AT_PICKUP: 'DRIVER_AT_PICKUP',
  TRIP_IN_TRANSIT: 'TRIP_IN_TRANSIT',
  TRIP_COMPLETED: 'TRIP_COMPLETED',
  CANCELLED_TERMINAL: 'CANCELLED_TERMINAL',
};

const RideContext = createContext(null);

export const RideProvider = ({ children }) => {
  const { isLoggedIn, token: authToken } = useAuth() || {};

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

  // Connection & Error State
  const [connectionStatus, setConnectionStatus] = useState('ONLINE'); // 'ONLINE' | 'OFFLINE' | 'RECONNECTING'
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const socketRef = useRef(null);
  const activeTripIdRef = useRef(null);
  activeTripIdRef.current = activeTripId;

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
              fullName: data.driver.fullName || data.driver.name || 'Campus Driver',
              phoneNumber: data.driver.phoneNumber || '',
              rating: data.driver.rating || 5.0,
              avatarUri: data.driver.avatarUri || data.driver.avatar || null,
              vehicleModel: data.driver.vehicleModel || data.driver.vehicle?.model || 'Campus Vehicle',
              vehicleColor: data.driver.vehicleColor || data.driver.vehicle?.color || '',
              vehicleLicensePlate: data.driver.vehicleLicensePlate || data.driver.vehicle?.licensePlate || 'N/A',
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
            setRideStep(RIDE_STATES.DRIVER_AT_PICKUP);
          } else if (targetStatus === 'completed' && stopType === 'pickup') {
            setRideStep(RIDE_STATES.TRIP_IN_TRANSIT);
          } else if (targetStatus === 'completed' && stopType === 'dropoff') {
            setRideStep(RIDE_STATES.TRIP_COMPLETED);
          }

          if (data?.stop) {
            setCurrentStop(data.stop);
          }
        };

        const handleStatusChange = (data) => {
          if (!isMounted) return;
          console.log('[RideContext] ⚡ trip:status_change received:', data);
          const status = data?.status;
          if (status === 'active' || status === 'in_progress') {
            setRideStep(RIDE_STATES.TRIP_IN_TRANSIT);
          } else if (status === 'completed') {
            setRideStep(RIDE_STATES.TRIP_COMPLETED);
          } else if (status === 'cancelled') {
            setRideStep(RIDE_STATES.CANCELLED_TERMINAL);
          }
        };

        const handleRideCancelled = (data) => {
          if (!isMounted) return;
          console.log('[RideContext] 🛑 ride:cancelled received:', data);
          setError(data?.reason || 'Ride was cancelled');
          setRideStep(RIDE_STATES.CANCELLED_TERMINAL);
        };

        const handleRideCompleted = (data) => {
          if (!isMounted) return;
          console.log('[RideContext] 🏁 ride:completed received:', data);
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
        socket.on('trip:status_change', handleStatusChange);
        socket.on('ride:cancelled', handleRideCancelled);
        socket.on('ride:completed', handleRideCompleted);

        cleanupSocket = () => {
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
          socket.off('connect_error', handleConnectError);

          socket.off('ride:assigned', handleRideAssigned);
          socket.off('rideAccepted', handleRideAssigned);
          socket.off('driver:telemetry', handleTelemetry);
          socket.off('trip:stop_update', handleStopUpdate);
          socket.off('trip:status_change', handleStatusChange);
          socket.off('ride:cancelled', handleRideCancelled);
          socket.off('ride:completed', handleRideCompleted);
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
  }, [isLoggedIn, authToken]);

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
      });

      if (result?.success && result?.data) {
        setActiveBooking(result.data);
        setRideStep(RIDE_STATES.MATCHING_DISPATCH);
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
      setRideStep(RIDE_STATES.CANCELLED_TERMINAL);
    } catch (err) {
      console.error('[RideContext] Cancellation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeBooking, activeTripId]);

  const submitReview = useCallback(async (ratingScore, comment = '', tags = []) => {
    try {
      setIsLoading(true);
      if (activeBooking?._id) {
        await ratingService.submitRating({
          bookingId: activeBooking._id,
          driverId: activeDriver?.id || activeBooking?.driverId,
          score: ratingScore,
          comment,
          tags,
        });
      }
      resetRide();
    } catch (err) {
      console.error('[RideContext] Rating submission error:', err);
      resetRide(); // Always reset on rating dismissal
    } finally {
      setIsLoading(false);
    }
  }, [activeBooking, activeDriver]);

  const resetRide = useCallback(() => {
    if (activeTripId && socketRef.current) {
      socketRef.current.emit('trip:leave', { tripId: activeTripId });
    }
    setRideStep(RIDE_STATES.IDLE);
    setActiveBooking(null);
    setActiveTripId(null);
    setActiveDriver(null);
    setDriverTelemetry(null);
    setStops([]);
    setCurrentStop(null);
    setDropoffLocation(null);
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
        routePolyline,
        setRoutePolyline,
        pickupLocation,
        setPickupLocation,
        dropoffLocation,
        setDropoffLocation,
        selectedRideMode,
        setSelectedRideMode,
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
