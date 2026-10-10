import RideBooking from '../models/RideBooking.js';
import DriverTrip from '../models/DriverTrip.js';
import { resolveLocation } from './poiService.js';
import routingService from './routingService.js';

export const VALID_BOOKING_TRANSITIONS = {
  scheduled: ['pending', 'cancelled'],
  pending: ['driver_assigned', 'cancelled', 'cancelled_timeout', 'failed_no_drivers'],
  driver_assigned: ['arrived_at_pickup', 'cancelled'],
  arrived_at_pickup: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'emergency_cancelled']
};

/**
 * Validates whether a state transition from currentStatus to targetStatus is permitted.
 */
export const validateBookingTransition = (currentStatus, targetStatus) => {
  if (currentStatus === targetStatus) return true;
  const allowed = VALID_BOOKING_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new Error(`Invalid state transition from [${currentStatus}] to [${targetStatus}]`);
  }
  return true;
};

/**
 * Validates stop sequence causality: Pickup(B) must always have sequenceOrder < Dropoff(B)
 */
export const validateStopOrdering = (tripStops) => {
  if (!Array.isArray(tripStops)) return true;

  const pickupIndices = new Map();
  const dropoffIndices = new Map();

  for (const stop of tripStops) {
    const bookingKey = stop.bookingId.toString();
    if (stop.stopType === 'pickup') {
      pickupIndices.set(bookingKey, stop.sequenceOrder);
    } else if (stop.stopType === 'dropoff') {
      dropoffIndices.set(bookingKey, stop.sequenceOrder);
    }
  }

  for (const [bookingKey, pickupSeq] of pickupIndices.entries()) {
    if (dropoffIndices.has(bookingKey)) {
      const dropoffSeq = dropoffIndices.get(bookingKey);
      if (pickupSeq >= dropoffSeq) {
        throw new Error(`Stop ordering causality violation for booking [${bookingKey}]: Pickup sequence (${pickupSeq}) must precede Dropoff sequence (${dropoffSeq})`);
      }
    }
  }

  return true;
};

/**
 * Creates a fare-free RideBooking with resolved endpoints and an authoritative road-route summary.
 */
export const createRideBooking = async (passengerId, payload) => {
  const {
    pickup,
    dropoff,
    rideMode = 'solo',
    scheduledTime,
    notes,
    routeRequestKey
  } = payload;

  if (!pickup || !dropoff) {
    throw new Error('Both pickup and dropoff locations are required');
  }

  const parsedScheduledTime = scheduledTime ? new Date(scheduledTime) : null;
  if (parsedScheduledTime && Number.isNaN(parsedScheduledTime.getTime())) {
    throw new Error('INVALID_SCHEDULE_TIME: Scheduled time is invalid');
  }
  if (parsedScheduledTime && parsedScheduledTime.getTime() < Date.now() + 60 * 1000) {
    throw new Error('INVALID_SCHEDULE_TIME: Scheduled rides must be at least one minute in the future');
  }
  if (parsedScheduledTime && parsedScheduledTime.getTime() > Date.now() + 30 * 24 * 60 * 60 * 1000) {
    throw new Error('INVALID_SCHEDULE_TIME: Scheduled rides cannot be more than 30 days ahead');
  }

  const resolvedPickup = await resolveLocation(pickup, [-0.1870, 5.6508]);
  const resolvedDropoff = await resolveLocation(dropoff, [-0.1852, 5.6595]);
  const endpointFingerprint = routingService.getCacheKey([
    resolvedPickup.coordinates.coordinates,
    resolvedDropoff.coordinates.coordinates
  ]);
  // Older SDK 54 clients did not send a fingerprint; keep them compatible while
  // enforcing endpoint identity for all updated clients that do provide one.
  if (routeRequestKey && routeRequestKey !== endpointFingerprint) {
    throw new Error('STALE_ROUTE: The reviewed route does not match the submitted pickup and destination');
  }

  // Booking requires a real road route. The service's geodesic fallback is useful
  // diagnostic context but must never be accepted as navigable road geometry.
  const route = await routingService.getRoute([
    resolvedPickup.coordinates.coordinates,
    resolvedDropoff.coordinates.coordinates
  ]);
  const geometryCoordinates = route?.geometry?.type === 'LineString' ? route.geometry.coordinates : null;
  if (route?.estimateOnly === true || !Array.isArray(geometryCoordinates) || geometryCoordinates.length < 3) {
    throw new Error('ROAD_ROUTE_UNAVAILABLE: A verified road-following route is required to create a booking');
  }

  const newBooking = await RideBooking.create({
    passengerId,
    rideMode,
    status: parsedScheduledTime ? 'scheduled' : 'pending',
    pickup: resolvedPickup,
    dropoff: resolvedDropoff,
    route: {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      source: route.source,
      estimateOnly: false,
      calculatedAt: route.calculatedAt || new Date()
      ,endpointFingerprint
    },
    scheduledTime: parsedScheduledTime,
    expiresAt: new Date((parsedScheduledTime?.getTime() || Date.now()) + 15 * 60 * 1000)
  });

  return await RideBooking.findById(newBooking._id).populate('passengerId', 'fullName phoneNumber avatarUri');
};

/**
 * Cancels a RideBooking with explicit actor tracking and physical capacity safety
 */
export const cancelBooking = async (bookingId, cancelledByUserId, cancelledByRole, reason = 'Cancelled by user') => {
  const booking = await RideBooking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (['completed', 'cancelled', 'cancelled_timeout', 'failed_no_drivers', 'emergency_cancelled'].includes(booking.status)) {
    throw new Error(`Cannot cancel a booking that is already in terminal state [${booking.status}]`);
  }

  const isPrePickup = ['pending', 'driver_assigned', 'arrived_at_pickup'].includes(booking.status);
  const targetStatus = (booking.status === 'in_progress' && (reason.toLowerCase().includes('emergency') || cancelledByRole === 'system'))
    ? 'emergency_cancelled'
    : 'cancelled';

  validateBookingTransition(booking.status, targetStatus);

  booking.status = targetStatus;
  booking.cancellation = {
    cancelledBy: cancelledByUserId,
    cancelledByRole,
    reason,
    penaltyAmount: 0,
    cancelledAt: new Date()
  };

  await booking.save();

  // If booking is attached to a DriverTrip, synchronize trip stops and reserved capacity safely
  if (booking.driverTripId) {
    const trip = await DriverTrip.findById(booking.driverTripId);
    if (trip) {
      if (isPrePickup) {
        // Pre-pickup cancellation: mark uncompleted stops as cancelled and release reserved capacity
        for (const stop of trip.tripStops) {
          if (stop.bookingId.toString() === booking._id.toString() && !['completed', 'cancelled', 'skipped'].includes(stop.status)) {
            stop.status = 'cancelled';
          }
        }
        trip.reservedPassengerCount = Math.max(0, trip.reservedPassengerCount - 1);
        if (trip.tripType === 'solo') {
          trip.activePassengerCount = Math.max(0, trip.activePassengerCount - 1);
        }
      } else {
        // Post-pickup cancellation: passenger is physically onboard.
        // DO NOT decrement activePassengerCount or reservedPassengerCount until dropoff/exit occurs.
      }

      // Check if all stops are now terminal
      const allStopsTerminal = trip.tripStops.every(s => ['completed', 'cancelled', 'skipped'].includes(s.status));
      if (allStopsTerminal && trip.activePassengerCount === 0 && trip.reservedPassengerCount === 0) {
        trip.status = 'completed';
        trip.completedAt = new Date();
      }

      await trip.save();
    }
  }

  return booking;
};
