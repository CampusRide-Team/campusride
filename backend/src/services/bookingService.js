import RideBooking from '../models/RideBooking.js';
import DriverTrip from '../models/DriverTrip.js';
import { resolveLocation } from './poiService.js';
import routingService from './routingService.js';
import pricingService from './pricingService.js';
import DISPATCH_CONFIG from '../config/dispatchConfig.js';

export const VALID_BOOKING_TRANSITIONS = {
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
 * Creates a new RideBooking with resolved pickup/dropoff locations and structured fare estimation
 */
export const createRideBooking = async (passengerId, payload) => {
  const {
    pickup,
    dropoff,
    rideMode = 'solo',
    scheduledTime,
    notes
  } = payload;

  if (!pickup || !dropoff) {
    throw new Error('Both pickup and dropoff locations are required');
  }

  const resolvedPickup = await resolveLocation(pickup, [-0.1870, 5.6508]);
  const resolvedDropoff = await resolveLocation(dropoff, [-0.1852, 5.6595]);

  // Calculate structured route and estimated fare
  const route = await routingService.getRoute([
    resolvedPickup.coordinates.coordinates,
    resolvedDropoff.coordinates.coordinates
  ]);

  let discountAmount = payload.discountAmount || 0;
  if (rideMode === 'shared' && payload.discountAmount === undefined) {
    const soloQuote = pricingService.calculateEstimatedFare({
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      rideMode: 'solo',
      pricingModel: payload.pricingModel || 'platform_calculated',
      customBaseFare: payload.customBaseFare || null,
      customPerKmRate: payload.customPerKmRate || null,
      discountAmount: 0
    });
    const discountPercent = DISPATCH_CONFIG.SHARED_FARE_DISCOUNT_PERCENT || 20;
    discountAmount = Math.round(soloQuote.totalFare * (discountPercent / 100) * 100) / 100;
  }

  const fareBreakdown = pricingService.calculateEstimatedFare({
    distanceMeters: route.distanceMeters,
    durationSeconds: route.durationSeconds,
    rideMode,
    pricingModel: payload.pricingModel || 'platform_calculated',
    customBaseFare: payload.customBaseFare || null,
    customPerKmRate: payload.customPerKmRate || null,
    discountAmount
  });

  const newBooking = await RideBooking.create({
    passengerId,
    rideMode,
    status: 'pending',
    pickup: resolvedPickup,
    dropoff: resolvedDropoff,
    fare: fareBreakdown,
    scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
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
