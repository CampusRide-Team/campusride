import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import RideBooking from '../models/RideBooking.js';
import DriverTrip from '../models/DriverTrip.js';
import DispatchOffer from '../models/DispatchOffer.js';
import DISPATCH_CONFIG from '../config/dispatchConfig.js';
import routingService, { calculateGeodesicDistanceMeters } from './routingService.js';
import { createSoloTrip, createSharedTrip, insertBookingIntoSharedTrip } from './tripService.js';
import { serializeTripStop } from './tripDtoService.js';
import { dispatchRideStartToContacts } from './notificationDeliveryService.js';

const persistOffers = async ({ booking, candidates, offerType, tripId = null, detourMetrics = null }) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + DISPATCH_CONFIG.DISPATCH_OFFER_TTL_MS);
  const dispatchRoundId = crypto.randomUUID();
  await DispatchOffer.updateMany(
    { bookingId: booking._id, status: 'pending' },
    { $set: { status: 'superseded', respondedAt: now } }
  );
  const pickupCoords = booking.pickup.coordinates?.coordinates || booking.pickup.coordinates;
  const dropoffCoords = booking.dropoff.coordinates?.coordinates || booking.dropoff.coordinates;
  if (!candidates.length) return [];
  const docs = await DispatchOffer.insertMany(candidates.map((driver) => ({
    bookingId: booking._id,
    driverId: driver._id,
    tripId,
    dispatchRoundId,
    rideMode: booking.rideMode,
    offerType,
    pickup: { name: booking.pickup.name, coordinates: pickupCoords },
    dropoff: { name: booking.dropoff.name, coordinates: dropoffCoords },
    routeMetrics: booking.route ? {
      distanceMeters: booking.route.distanceMeters,
      durationSeconds: booking.route.durationSeconds
    } : undefined,
    detourMetrics,
    expiresAt
  })));
  return docs;
};

const offerPayload = (offer, passenger = null) => ({
  offerId: offer._id,
  bookingId: offer.bookingId,
  tripId: offer.tripId || null,
  rideMode: offer.rideMode,
  offerType: offer.offerType,
  pickup: offer.pickup,
  dropoff: offer.dropoff,
  routeMetrics: offer.routeMetrics || null,
  detourMetrics: offer.detourMetrics || null,
  expiresAt: offer.expiresAt
  ,passenger: passenger ? { id: passenger._id, fullName: passenger.fullName, avatarUri: passenger.avatarUri || null } : null
});

/**
 * Finds eligible approved drivers for Solo Ride dispatch.
 * Invariant: Driver must be role=driver, approved, online, fresh heartbeat,
 * with valid coordinates, and NOT operating an active DriverTrip.
 */
export const findEligibleDrivers = async ({
  coordinates,
  maxDistance = DISPATCH_CONFIG.CANDIDATE_SEARCH_RADIUS_METERS
} = {}) => {
  const freshnessThreshold = new Date(Date.now() - DISPATCH_CONFIG.DRIVER_HEARTBEAT_FRESHNESS_MS);

  // 1. Identify drivers currently busy with active or dispatched physical trips
  const activeTrips = await DriverTrip.find({
    status: { $in: ['dispatched', 'active'] }
  }).select('driverId');
  const busyDriverIds = activeTrips.map(t => t.driverId);

  // 2. Query available candidate drivers
  const query = {
    role: 'driver',
    approvalStatus: 'approved',
    isOnline: true,
    lastSeen: { $gte: freshnessThreshold },
    _id: { $nin: busyDriverIds },
    'currentLocation.coordinates': { $exists: true, $not: { $size: 0 } }
  };

  const candidates = await User.find(query).select(
    'fullName phoneNumber vehicleModel vehicleLicensePlate currentLocation ratings avatarUri driverProfile'
  );

  // 3. Filter and sort candidates by distance if pickup coordinates are provided
  if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
    const candidatesWithDistance = [];
    for (const driver of candidates) {
      const driverCoords = driver.currentLocation?.coordinates;
      if (Array.isArray(driverCoords) && driverCoords.length === 2) {
        const distanceMeters = calculateGeodesicDistanceMeters(coordinates, driverCoords);
        if (distanceMeters <= maxDistance) {
          candidatesWithDistance.push({
            driver,
            distanceMeters
          });
        }
      }
    }

    candidatesWithDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return candidatesWithDistance.map(item => item.driver);
  }

  return candidates;
};

/**
 * Dispatches a pending Solo RideBooking to eligible drivers.
 * Invariant: Must be a solo booking in pending status. Emits strictly to targeted user:{driverId} rooms.
 */
export const dispatchSoloBooking = async (bookingId, io = null) => {
  const booking = await RideBooking.findById(bookingId);
  if (!booking) {
    throw new Error('BOOKING_NOT_FOUND');
  }

  if (booking.rideMode !== 'solo') {
    throw new Error('INVALID_RIDE_MODE: Only solo bookings can be dispatched through solo dispatch service');
  }

  if (booking.status !== 'pending') {
    throw new Error(`BOOKING_NOT_PENDING: Cannot dispatch booking in status [${booking.status}]`);
  }
  const passenger = await User.findById(booking.passengerId).select('fullName avatarUri');

  const pickupCoords = booking.pickup.coordinates.coordinates || booking.pickup.coordinates;
  const eligibleDrivers = await findEligibleDrivers({
    coordinates: pickupCoords,
    maxDistance: DISPATCH_CONFIG.CANDIDATE_SEARCH_RADIUS_METERS
  });

  const offers = await persistOffers({ booking, candidates: eligibleDrivers, offerType: 'solo_trip' });

  if (io && offers.length > 0) {
    for (const offer of offers) {
      io.to(`user:${offer.driverId.toString()}`).emit('dispatch:offer', offerPayload(offer, passenger));
    }
  }

  return {
    bookingId: booking._id,
    dispatchedToCount: eligibleDrivers.length,
    candidateDriverIds: eligibleDrivers.map(d => d._id)
  };
};

/**
 * Finds active shared trips eligible for dynamic passenger pooling (pool_join).
 * Revalidates remaining capacity, driver freshness, and detour constraints.
 */
export const findEligibleSharedTrips = async (booking) => {
  const freshnessThreshold = new Date(Date.now() - DISPATCH_CONFIG.DRIVER_HEARTBEAT_FRESHNESS_MS);
  const pickupCoords = booking.pickup.coordinates?.coordinates || booking.pickup.coordinates;
  const dropoffCoords = booking.dropoff.coordinates?.coordinates || booking.dropoff.coordinates;

  // 1. Query active shared trips that have not reached max capacity
  const candidateTrips = await DriverTrip.find({
    tripType: 'shared',
    status: { $in: ['dispatched', 'active'] },
    $expr: { $lt: ['$reservedPassengerCount', '$maxCapacity'] }
  }).populate('driverId', 'fullName phoneNumber avatarUri isOnline lastSeen approvalStatus currentLocation driverProfile');

  const validPoolCandidates = [];

  for (const trip of candidateTrips) {
    const driver = trip.driverId;
    if (!driver || driver.approvalStatus !== 'approved' || !driver.isOnline || driver.lastSeen < freshnessThreshold) {
      continue;
    }

    const driverCoords = driver.currentLocation?.coordinates;
    if (!driverCoords || !Array.isArray(driverCoords) || driverCoords.length !== 2) {
      continue;
    }

    // Distance check: driver must be within pooling search radius of pickup
    const distanceToPickup = calculateGeodesicDistanceMeters(driverCoords, pickupCoords);
    if (distanceToPickup > DISPATCH_CONFIG.POOLING_SEARCH_RADIUS_METERS) {
      continue;
    }

    // Construct proposed stops for evaluation
    const tempPickup = {
      stopId: 'preview-pickup',
      bookingId: booking._id,
      passengerId: booking.passengerId,
      stopType: 'pickup',
      coordinates: pickupCoords,
      name: booking.pickup.name,
      sequenceOrder: 0,
      status: 'pending'
    };

    const tempDropoff = {
      stopId: 'preview-dropoff',
      bookingId: booking._id,
      passengerId: booking.passengerId,
      stopType: 'dropoff',
      coordinates: dropoffCoords,
      name: booking.dropoff.name,
      sequenceOrder: 0,
      status: 'pending'
    };

    const evaluation = routingService.evaluateRouteInsertion({
      existingStops: trip.tripStops,
      newPickup: tempPickup,
      newDropoff: tempDropoff,
      driverCoords,
      constraints: {
        maxAdditionalDistanceMeters: DISPATCH_CONFIG.MAX_ADDITIONAL_DISTANCE_METERS,
        maxAdditionalRideTimeSeconds: DISPATCH_CONFIG.MAX_ADDITIONAL_RIDE_TIME_SECONDS
      }
    });

    if (evaluation.valid) {
      validPoolCandidates.push({
        trip,
        driver,
        distanceToPickup,
        detourMetrics: evaluation.detourMetrics
      });
    }
  }

  // Rank candidate shared trips by lowest additional detour distance, then duration, then proximity
  validPoolCandidates.sort((a, b) => {
    if (a.detourMetrics.additionalDistanceMeters !== b.detourMetrics.additionalDistanceMeters) {
      return a.detourMetrics.additionalDistanceMeters - b.detourMetrics.additionalDistanceMeters;
    }
    if (a.detourMetrics.additionalDurationSeconds !== b.detourMetrics.additionalDurationSeconds) {
      return a.detourMetrics.additionalDurationSeconds - b.detourMetrics.additionalDurationSeconds;
    }
    return a.distanceToPickup - b.distanceToPickup;
  });

  return validPoolCandidates;
};

/**
 * Finds eligible idle drivers to initiate a brand new shared trip.
 */
export const findEligibleDriversForNewSharedTrip = async (booking) => {
  const pickupCoords = booking.pickup.coordinates?.coordinates || booking.pickup.coordinates;
  const freshnessThreshold = new Date(Date.now() - DISPATCH_CONFIG.DRIVER_HEARTBEAT_FRESHNESS_MS);

  const activeTrips = await DriverTrip.find({
    status: { $in: ['dispatched', 'active'] }
  }).select('driverId');
  const busyDriverIds = activeTrips.map(t => t.driverId);

  const query = {
    role: 'driver',
    approvalStatus: 'approved',
    isOnline: true,
    lastSeen: { $gte: freshnessThreshold },
    _id: { $nin: busyDriverIds },
    'driverProfile.capacity.chosenSharedCapacity': { $gte: DISPATCH_CONFIG.MIN_SHARED_CAPACITY },
    'currentLocation.coordinates': { $exists: true, $not: { $size: 0 } }
  };

  const candidates = await User.find(query).select(
    'fullName phoneNumber vehicleModel vehicleLicensePlate currentLocation ratings avatarUri driverProfile'
  );

  const candidatesWithDistance = [];
  for (const driver of candidates) {
    const driverCoords = driver.currentLocation?.coordinates;
    if (Array.isArray(driverCoords) && driverCoords.length === 2) {
      const distanceMeters = calculateGeodesicDistanceMeters(pickupCoords, driverCoords);
      if (distanceMeters <= DISPATCH_CONFIG.CANDIDATE_SEARCH_RADIUS_METERS) {
        candidatesWithDistance.push({ driver, distanceMeters });
      }
    }
  }

  candidatesWithDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return candidatesWithDistance.map(item => item.driver);
};

/**
 * Dispatches a pending Shared RideBooking.
 * Evaluates active shared trips first (pool_join offers); if none, dispatches new_shared_trip offers to idle drivers.
 */
export const dispatchSharedBooking = async (bookingId, io = null) => {
  const booking = await RideBooking.findById(bookingId);
  if (!booking) {
    throw new Error('BOOKING_NOT_FOUND');
  }

  if (booking.rideMode !== 'shared') {
    throw new Error('INVALID_RIDE_MODE: Only shared bookings can be dispatched through shared dispatch service');
  }

  if (booking.status !== 'pending') {
    throw new Error(`BOOKING_NOT_PENDING: Cannot dispatch booking in status [${booking.status}]`);
  }
  const passenger = await User.findById(booking.passengerId).select('fullName avatarUri');

  const pickupCoords = booking.pickup.coordinates.coordinates || booking.pickup.coordinates;
  const dropoffCoords = booking.dropoff.coordinates.coordinates || booking.dropoff.coordinates;

  // 1. Check for compatible active shared trips first
  const poolCandidates = await findEligibleSharedTrips(booking);

  if (poolCandidates.length > 0) {
    const bestCandidate = poolCandidates[0];
    const offers = await persistOffers({
      booking,
      candidates: [bestCandidate.driver],
      offerType: 'pool_join',
      tripId: bestCandidate.trip._id,
      detourMetrics: bestCandidate.detourMetrics
    });

    if (io && offers[0]) {
      io.to(`user:${bestCandidate.driver._id.toString()}`).emit('dispatch:offer', offerPayload(offers[0], passenger));
    }

    return {
      bookingId: booking._id,
      offerType: 'pool_join',
      dispatchedToTripId: bestCandidate.trip._id,
      dispatchedToDriverId: bestCandidate.driver._id
    };
  }

  // 2. If no active pool candidates, offer as new shared trip to idle drivers
  const idleDrivers = await findEligibleDriversForNewSharedTrip(booking);
  const offers = await persistOffers({ booking, candidates: idleDrivers, offerType: 'new_shared_trip' });

  if (io && offers.length > 0) {
    for (const offer of offers) {
      io.to(`user:${offer.driverId.toString()}`).emit('dispatch:offer', offerPayload(offer, passenger));
    }
  }

  return {
    bookingId: booking._id,
    offerType: 'new_shared_trip',
    dispatchedToCount: idleDrivers.length,
    candidateDriverIds: idleDrivers.map(d => d._id)
  };
};

/**
 * Accepts a solo dispatch offer atomically.
 */
export const acceptSoloOffer = async (driverId, bookingId, io = null) => {
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'driver' || (driver.approvalStatus !== 'approved' && driver.isApproved !== true)) {
    throw new Error('DRIVER_NOT_APPROVED: Driver is not authorized to accept dispatches');
  }

  // Check if driver already has an active DriverTrip
  const existingTrip = await DriverTrip.findOne({
    driverId: driver._id,
    status: { $in: ['dispatched', 'active'] }
  });
  if (existingTrip) {
    throw new Error('DRIVER_ALREADY_HAS_ACTIVE_TRIP: Driver cannot accept multiple trips concurrently');
  }

  const { trip, booking } = await createSoloTrip(driver._id, bookingId, { enforceSingleActiveTrip: true });

  if (io) {
    const passengerRoom = `user:${booking.passengerId.toString()}`;
    io.to(passengerRoom).emit('ride:assigned', {
      bookingId: booking._id,
      driverTripId: trip._id,
      driverId: driver._id,
      driver: {
        id: driver._id,
        fullName: driver.fullName,
        phoneNumber: driver.phoneNumber,
        avatarUri: driver.avatarUri,
        vehicle: driver.driverProfile?.vehicle || {
          model: driver.vehicleModel || 'Campus Vehicle',
          licensePlate: driver.vehicleLicensePlate || 'N/A'
        }
      }
    });

    io.to(`trip:${trip._id.toString()}`).emit('trip:status_change', {
      tripId: trip._id,
      status: 'dispatched'
    });
  }

  dispatchRideStartToContacts(booking).catch((error) => {
    console.warn(`[Trusted Contacts] Ride sharing failed for booking [${booking._id}]:`, error.message);
  });

  return { trip, booking };
};

/**
 * Accepts a shared dispatch offer atomically (either a new shared trip or a pool addition to an existing trip).
 * Revalidates capacity, driver ownership, booking state, and dynamic route insertion on acceptance.
 */
export const acceptSharedOffer = async (driverId, bookingId, { tripId = null, io = null, driverLocation = null } = {}) => {
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'driver' || (driver.approvalStatus !== 'approved' && driver.isApproved !== true)) {
    throw new Error('DRIVER_NOT_APPROVED: Driver is not authorized to accept dispatches');
  }

  let tripResult = null;

  if (tripId) {
    // 1. Explicit Driver Acceptance of Pool Join into existing trip
    tripResult = await insertBookingIntoSharedTrip(driver._id, tripId, bookingId, { driverLocation });
  } else {
    // 2. Acceptance of New Shared Trip
    const existingTrip = await DriverTrip.findOne({
      driverId: driver._id,
      status: { $in: ['dispatched', 'active'] }
    });
    if (existingTrip) {
      throw new Error('DRIVER_ALREADY_HAS_ACTIVE_TRIP: Driver cannot accept multiple trips concurrently');
    }

    tripResult = await createSharedTrip(driver._id, bookingId, { enforceSingleActiveTrip: true });
  }

  const { trip, booking } = tripResult;

  if (io) {
    // Audience-Aware Notification:
    // 1. Private notification to assigned passenger
    const passengerRoom = `user:${booking.passengerId.toString()}`;
    io.to(passengerRoom).emit('ride:assigned', {
      bookingId: booking._id,
      driverTripId: trip._id,
      driverId: driver._id,
      driver: {
        id: driver._id,
        fullName: driver.fullName,
        phoneNumber: driver.phoneNumber,
        avatarUri: driver.avatarUri,
        vehicle: driver.driverProfile?.vehicle || {
          model: driver.vehicleModel || 'Campus Vehicle',
          licensePlate: driver.vehicleLicensePlate || 'N/A'
        }
      }
    });

    // 2. Complete authorized route manifest to driver trip room
    io.to(`user:${driver._id.toString()}`).emit('trip:route-updated', {
      tripId: trip._id,
      stops: trip.tripStops.map((stop) => serializeTripStop(stop, { includePassengerContact: false })),
      activePassengerCount: trip.activePassengerCount,
      reservedPassengerCount: trip.reservedPassengerCount
    });

    // 3. Sanitized route updates sent strictly to private user rooms for each passenger
    const uniquePassengerIds = [...new Set(trip.tripStops.map(s => s.passengerId.toString()))];
    for (const pId of uniquePassengerIds) {
      const passengerBookingStops = trip.tripStops.filter(s => s.passengerId.toString() === pId);
      const myPickup = passengerBookingStops.find(s => s.stopType === 'pickup');
      const myDropoff = passengerBookingStops.find(s => s.stopType === 'dropoff');

      // Count stops ahead of passenger pickup
      let stopsAheadOfPickup = 0;
      if (myPickup) {
        stopsAheadOfPickup = trip.tripStops.filter(s => s.sequenceOrder < myPickup.sequenceOrder && !['completed', 'cancelled', 'skipped'].includes(s.status)).length;
      }

      io.to(`user:${pId}`).emit('trip:route-updated', {
        tripId: trip._id,
        bookingId: myPickup?.bookingId || myDropoff?.bookingId,
        pickup: myPickup ? { name: myPickup.name, status: myPickup.status } : null,
        dropoff: myDropoff ? { name: myDropoff.name, status: myDropoff.status } : null,
        stopsAheadCount: stopsAheadOfPickup,
        activePassengerCount: trip.activePassengerCount
      });
    }
  }

  dispatchRideStartToContacts(booking).catch((error) => {
    console.warn(`[Trusted Contacts] Ride sharing failed for booking [${booking._id}]:`, error.message);
  });

  return tripResult;
};
