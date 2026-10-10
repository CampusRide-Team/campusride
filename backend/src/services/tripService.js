import mongoose from 'mongoose';
import crypto from 'crypto';
import DriverTrip from '../models/DriverTrip.js';
import RideBooking from '../models/RideBooking.js';
import User from '../models/User.js';
import DISPATCH_CONFIG from '../config/dispatchConfig.js';
import routingService, { calculateGeodesicDistanceMeters } from './routingService.js';
import { validateBookingTransition, validateStopOrdering } from './bookingService.js';

/**
 * Creates a Solo DriverTrip from a pending RideBooking.
 * Strictly guarantees maxCapacity = 1, tripType = 'solo', and atomic booking claim.
 * When enforceSingleActiveTrip is true, atomically serializes on the driver record and prevents
 * a single driver from accepting multiple trips concurrently.
 */
export const createSoloTrip = async (driverId, bookingId, { enforceSingleActiveTrip = false } = {}) => {
  // Verify driver is approved and not suspended
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'driver' || (driver.approvalStatus !== 'approved' && driver.isApproved !== true)) {
    throw new Error('Driver is not verified or authorized to accept trips');
  }

  const session = await mongoose.startSession();
  try {
    let result = null;
    await session.withTransaction(async () => {
      // 1. Acquire transaction lock on the driver document to serialize concurrent acceptances for this driver
      await User.findOneAndUpdate(
        { _id: driver._id },
        { $set: { lastSeen: new Date() } },
        { session }
      );

      // 2. Concurrency check: If single active trip is enforced, verify driver has no active trip
      if (enforceSingleActiveTrip) {
        const existingActiveTrip = await DriverTrip.findOne({
          driverId: driver._id,
          status: { $in: ['dispatched', 'active'] }
        }).session(session);

        if (existingActiveTrip) {
          throw new Error('DRIVER_ALREADY_HAS_ACTIVE_TRIP: Driver cannot accept multiple trips concurrently');
        }
      }

      // 3. Atomically claim the booking within the transaction
      const booking = await RideBooking.findOneAndUpdate(
        { _id: bookingId, status: 'pending' },
        { 
          $set: { 
            status: 'driver_assigned',
            driverId: driver._id,
            dispatchedAt: new Date()
          } 
        },
        { returnDocument: 'after', session }
      );

      if (!booking) {
        throw new Error('BOOKING_ALREADY_CLAIMED');
      }

      const pickupStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;
      const dropoffStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;

      const initialStops = [
        {
          stopId: pickupStopId,
          bookingId: booking._id,
          passengerId: booking.passengerId,
          stopType: 'pickup',
          coordinates: booking.pickup.coordinates,
          name: booking.pickup.name,
          sequenceOrder: 1,
          status: 'pending'
        },
        {
          stopId: dropoffStopId,
          bookingId: booking._id,
          passengerId: booking.passengerId,
          stopType: 'dropoff',
          coordinates: booking.dropoff.coordinates,
          name: booking.dropoff.name,
          sequenceOrder: 2,
          status: 'pending'
        }
      ];

      validateStopOrdering(initialStops);

      const [trip] = await DriverTrip.create(
        [{
          driverId: driver._id,
          tripType: 'solo',
          status: 'dispatched',
          maxCapacity: 1,
          activePassengerCount: 1,
          reservedPassengerCount: 1,
          tripStops: initialStops,
          currentRoute: booking.route ? { distanceMeters: booking.route.distanceMeters, durationSeconds: booking.route.durationSeconds, calculatedAt: booking.route.calculatedAt, routeVersion: 1 } : undefined,
          startedAt: new Date()
        }],
        { session }
      );

      // Link booking to driverTrip
      booking.driverTripId = trip._id;
      await booking.save({ session });

      result = { trip, booking };
    });

    return result;
  } catch (error) {
    if (error.message && error.message.includes('Transactions are not supported')) {
      // Fallback for standalone MongoDB environments without replica set
      if (enforceSingleActiveTrip) {
        const existingActiveTrip = await DriverTrip.findOne({
          driverId: driver._id,
          status: { $in: ['dispatched', 'active'] }
        });
        if (existingActiveTrip) {
          throw new Error('DRIVER_ALREADY_HAS_ACTIVE_TRIP: Driver cannot accept multiple trips concurrently');
        }
      }

      const booking = await RideBooking.findOneAndUpdate(
        { _id: bookingId, status: 'pending' },
        { 
          $set: { 
            status: 'driver_assigned',
            driverId: driver._id,
            dispatchedAt: new Date()
          } 
        },
        { returnDocument: 'after' }
      );
      if (!booking) throw new Error('BOOKING_ALREADY_CLAIMED');

      if (enforceSingleActiveTrip) {
        const secondCheck = await DriverTrip.findOne({
          driverId: driver._id,
          status: { $in: ['dispatched', 'active'] }
        });
        if (secondCheck) {
          await RideBooking.findByIdAndUpdate(bookingId, {
            $set: { status: 'pending', driverId: null, dispatchedAt: null }
          });
          throw new Error('DRIVER_ALREADY_HAS_ACTIVE_TRIP: Driver cannot accept multiple trips concurrently');
        }
      }

      const pickupStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;
      const dropoffStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;
      const initialStops = [
        {
          stopId: pickupStopId,
          bookingId: booking._id,
          passengerId: booking.passengerId,
          stopType: 'pickup',
          coordinates: booking.pickup.coordinates,
          name: booking.pickup.name,
          sequenceOrder: 1,
          status: 'pending'
        },
        {
          stopId: dropoffStopId,
          bookingId: booking._id,
          passengerId: booking.passengerId,
          stopType: 'dropoff',
          coordinates: booking.dropoff.coordinates,
          name: booking.dropoff.name,
          sequenceOrder: 2,
          status: 'pending'
        }
      ];
      validateStopOrdering(initialStops);
      const trip = await DriverTrip.create({
        driverId: driver._id,
        tripType: 'solo',
        status: 'dispatched',
        maxCapacity: 1,
        activePassengerCount: 1,
        reservedPassengerCount: 1,
        tripStops: initialStops,
        currentRoute: booking.route ? { distanceMeters: booking.route.distanceMeters, durationSeconds: booking.route.durationSeconds, calculatedAt: booking.route.calculatedAt, routeVersion: 1 } : undefined,
        startedAt: new Date()
      });
      booking.driverTripId = trip._id;
      await booking.save();
      return { trip, booking };
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Creates a new Shared DriverTrip from an initial pending RideBooking.
 * Initializes with activePassengerCount = 0, reservedPassengerCount = 1, and maxCapacity = chosenSharedCapacity.
 */
export const createSharedTrip = async (driverId, bookingId, { enforceSingleActiveTrip = false } = {}) => {
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'driver' || (driver.approvalStatus !== 'approved' && driver.isApproved !== true)) {
    throw new Error('Driver is not verified or authorized to accept trips');
  }

  const chosenCapacity = driver.driverProfile?.capacity?.chosenSharedCapacity || DISPATCH_CONFIG.DEFAULT_SHARED_CAPACITY;
  if (chosenCapacity < DISPATCH_CONFIG.MIN_SHARED_CAPACITY) {
    throw new Error(`DRIVER_CAPACITY_INVALID: Driver shared capacity (${chosenCapacity}) must be at least ${DISPATCH_CONFIG.MIN_SHARED_CAPACITY}`);
  }

  const session = await mongoose.startSession();
  try {
    let result = null;
    await session.withTransaction(async () => {
      // 1. Transaction lock on driver
      await User.findOneAndUpdate(
        { _id: driver._id },
        { $set: { lastSeen: new Date() } },
        { session }
      );

      // 2. Concurrency check: If single active trip is enforced, ensure driver has no existing active trip
      if (enforceSingleActiveTrip) {
        const existingActiveTrip = await DriverTrip.findOne({
          driverId: driver._id,
          status: { $in: ['dispatched', 'active'] }
        }).session(session);

        if (existingActiveTrip) {
          throw new Error('DRIVER_ALREADY_HAS_ACTIVE_TRIP: Driver cannot accept multiple trips concurrently');
        }
      }

      // 3. Atomically claim booking
      const booking = await RideBooking.findOneAndUpdate(
        { _id: bookingId, status: 'pending' },
        {
          $set: {
            status: 'driver_assigned',
            driverId: driver._id,
            dispatchedAt: new Date()
          }
        },
        { returnDocument: 'after', session }
      );

      if (!booking) {
        throw new Error('BOOKING_ALREADY_CLAIMED');
      }

      const pickupStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;
      const dropoffStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;

      const initialStops = [
        {
          stopId: pickupStopId,
          bookingId: booking._id,
          passengerId: booking.passengerId,
          stopType: 'pickup',
          coordinates: booking.pickup.coordinates,
          name: booking.pickup.name,
          sequenceOrder: 1,
          status: 'pending'
        },
        {
          stopId: dropoffStopId,
          bookingId: booking._id,
          passengerId: booking.passengerId,
          stopType: 'dropoff',
          coordinates: booking.dropoff.coordinates,
          name: booking.dropoff.name,
          sequenceOrder: 2,
          status: 'pending'
        }
      ];

      validateStopOrdering(initialStops);

      const [trip] = await DriverTrip.create(
        [{
          driverId: driver._id,
          tripType: 'shared',
          status: 'dispatched',
          maxCapacity: chosenCapacity,
          activePassengerCount: 0,
          reservedPassengerCount: 1,
          tripStops: initialStops,
          currentRoute: booking.route ? { distanceMeters: booking.route.distanceMeters, durationSeconds: booking.route.durationSeconds, calculatedAt: booking.route.calculatedAt, routeVersion: 1 } : undefined,
          startedAt: new Date()
        }],
        { session }
      );

      booking.driverTripId = trip._id;
      await booking.save({ session });

      result = { trip, booking };
    });

    return result;
  } catch (error) {
    if (error.message && error.message.includes('Transactions are not supported')) {
      if (enforceSingleActiveTrip) {
        const existingActiveTrip = await DriverTrip.findOne({
          driverId: driver._id,
          status: { $in: ['dispatched', 'active'] }
        });
        if (existingActiveTrip) {
          throw new Error('DRIVER_ALREADY_HAS_ACTIVE_TRIP: Driver cannot accept multiple trips concurrently');
        }
      }

      const booking = await RideBooking.findOneAndUpdate(
        { _id: bookingId, status: 'pending' },
        {
          $set: {
            status: 'driver_assigned',
            driverId: driver._id,
            dispatchedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );
      if (!booking) throw new Error('BOOKING_ALREADY_CLAIMED');

      const pickupStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;
      const dropoffStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;

      const initialStops = [
        {
          stopId: pickupStopId,
          bookingId: booking._id,
          passengerId: booking.passengerId,
          stopType: 'pickup',
          coordinates: booking.pickup.coordinates,
          name: booking.pickup.name,
          sequenceOrder: 1,
          status: 'pending'
        },
        {
          stopId: dropoffStopId,
          bookingId: booking._id,
          passengerId: booking.passengerId,
          stopType: 'dropoff',
          coordinates: booking.dropoff.coordinates,
          name: booking.dropoff.name,
          sequenceOrder: 2,
          status: 'pending'
        }
      ];
      validateStopOrdering(initialStops);

      const trip = await DriverTrip.create({
        driverId: driver._id,
        tripType: 'shared',
        status: 'dispatched',
        maxCapacity: chosenCapacity,
        activePassengerCount: 0,
        reservedPassengerCount: 1,
        tripStops: initialStops,
        currentRoute: booking.route ? { distanceMeters: booking.route.distanceMeters, durationSeconds: booking.route.durationSeconds, calculatedAt: booking.route.calculatedAt, routeVersion: 1 } : undefined,
        startedAt: new Date()
      });

      booking.driverTripId = trip._id;
      await booking.save();

      return { trip, booking };
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Inserts an additional passenger booking into an existing active/dispatched Shared DriverTrip.
 * Revalidates driver ownership, trip eligibility, capacity, and dynamic route insertion atomically.
 */
export const insertBookingIntoSharedTrip = async (driverId, tripId, bookingId, { driverLocation = null } = {}) => {
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'driver' || (driver.approvalStatus !== 'approved' && driver.isApproved !== true)) {
    throw new Error('Driver is not verified or authorized to accept trips');
  }

  const session = await mongoose.startSession();
  try {
    let result = null;
    await session.withTransaction(async () => {
      // 1. Fetch trip and verify ownership & state
      const trip = await DriverTrip.findById(tripId).session(session);
      if (!trip) {
        throw new Error('TRIP_NOT_FOUND: DriverTrip does not exist');
      }

      if (trip.driverId.toString() !== driver._id.toString()) {
        throw new Error('FORBIDDEN: Driver does not own this trip');
      }

      if (trip.tripType !== 'shared') {
        throw new Error('INVALID_TRIP_TYPE: Cannot pool into a non-shared trip');
      }

      if (!['dispatched', 'active'].includes(trip.status)) {
        throw new Error(`TRIP_NOT_ACTIVE: Trip is in state [${trip.status}] and cannot accept new passengers`);
      }

      // 2. Verify remaining capacity
      if (trip.reservedPassengerCount >= trip.maxCapacity) {
        throw new Error('TRIP_CAPACITY_EXCEEDED: No remaining seats on this shared trip');
      }

      // 3. Fetch booking and verify pending status
      const booking = await RideBooking.findOne({ _id: bookingId, status: 'pending' }).session(session);
      if (!booking) {
        throw new Error('BOOKING_ALREADY_CLAIMED: Booking is no longer pending');
      }

      // 4. Construct new stops and revalidate dynamic route insertion
      const pickupStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;
      const dropoffStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;

      const newPickup = {
        stopId: pickupStopId,
        bookingId: booking._id,
        passengerId: booking.passengerId,
        stopType: 'pickup',
        coordinates: booking.pickup.coordinates,
        name: booking.pickup.name,
        sequenceOrder: 0,
        status: 'pending'
      };

      const newDropoff = {
        stopId: dropoffStopId,
        bookingId: booking._id,
        passengerId: booking.passengerId,
        stopType: 'dropoff',
        coordinates: booking.dropoff.coordinates,
        name: booking.dropoff.name,
        sequenceOrder: 0,
        status: 'pending'
      };

      const driverCoords = driverLocation || driver.currentLocation?.coordinates;
      const insertion = routingService.evaluateRouteInsertion({
        existingStops: trip.tripStops,
        newPickup,
        newDropoff,
        driverCoords,
        constraints: {
          maxAdditionalDistanceMeters: DISPATCH_CONFIG.MAX_ADDITIONAL_DISTANCE_METERS,
          maxAdditionalRideTimeSeconds: DISPATCH_CONFIG.MAX_ADDITIONAL_RIDE_TIME_SECONDS
        }
      });

      if (!insertion.valid) {
        throw new Error(`ROUTE_INSERTION_REJECTED: ${insertion.reason || 'Detour limits exceeded'}`);
      }

      // 5. Atomically claim booking
      const claimedBooking = await RideBooking.findOneAndUpdate(
        { _id: bookingId, status: 'pending' },
        {
          $set: {
            status: 'driver_assigned',
            driverId: driver._id,
            driverTripId: trip._id,
            dispatchedAt: new Date()
          }
        },
        { returnDocument: 'after', session }
      );

      if (!claimedBooking) {
        throw new Error('BOOKING_ALREADY_CLAIMED');
      }

      // 6. Atomically update DriverTrip stops and increment reservedPassengerCount
      const updatedTrip = await DriverTrip.findOneAndUpdate(
        {
          _id: trip._id,
          status: { $in: ['dispatched', 'active'] },
          reservedPassengerCount: { $lt: trip.maxCapacity }
        },
        {
          $set: { tripStops: insertion.bestStops },
          $inc: { reservedPassengerCount: 1 }
        },
        { returnDocument: 'after', session }
      );

      if (!updatedTrip) {
        throw new Error('TRIP_CAPACITY_EXCEEDED: Capacity was claimed by another passenger concurrently');
      }

      result = {
        trip: updatedTrip,
        booking: claimedBooking,
        detourMetrics: insertion.detourMetrics
      };
    });

    return result;
  } catch (error) {
    if (error.message && error.message.includes('Transactions are not supported')) {
      const trip = await DriverTrip.findById(tripId);
      if (!trip) throw new Error('TRIP_NOT_FOUND: DriverTrip does not exist');
      if (trip.driverId.toString() !== driver._id.toString()) throw new Error('FORBIDDEN: Driver does not own this trip');
      if (trip.tripType !== 'shared') throw new Error('INVALID_TRIP_TYPE: Cannot pool into a non-shared trip');
      if (!['dispatched', 'active'].includes(trip.status)) throw new Error(`TRIP_NOT_ACTIVE: Trip is in state [${trip.status}]`);
      if (trip.reservedPassengerCount >= trip.maxCapacity) throw new Error('TRIP_CAPACITY_EXCEEDED: No remaining seats on this shared trip');

      const pickupStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;
      const dropoffStopId = `stop-${crypto.randomBytes(4).toString('hex')}`;

      const booking = await RideBooking.findById(bookingId);
      if (!booking || booking.status !== 'pending') throw new Error('BOOKING_ALREADY_CLAIMED');

      const newPickup = {
        stopId: pickupStopId,
        bookingId: booking._id,
        passengerId: booking.passengerId,
        stopType: 'pickup',
        coordinates: booking.pickup.coordinates,
        name: booking.pickup.name,
        sequenceOrder: 0,
        status: 'pending'
      };

      const newDropoff = {
        stopId: dropoffStopId,
        bookingId: booking._id,
        passengerId: booking.passengerId,
        stopType: 'dropoff',
        coordinates: booking.dropoff.coordinates,
        name: booking.dropoff.name,
        sequenceOrder: 0,
        status: 'pending'
      };

      const driverCoords = driverLocation || driver.currentLocation?.coordinates;
      const insertion = routingService.evaluateRouteInsertion({
        existingStops: trip.tripStops,
        newPickup,
        newDropoff,
        driverCoords
      });

      if (!insertion.valid) {
        throw new Error(`ROUTE_INSERTION_REJECTED: ${insertion.reason || 'Detour limits exceeded'}`);
      }

      const claimedBooking = await RideBooking.findOneAndUpdate(
        { _id: bookingId, status: 'pending' },
        {
          $set: {
            status: 'driver_assigned',
            driverId: driver._id,
            driverTripId: trip._id,
            dispatchedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );
      if (!claimedBooking) throw new Error('BOOKING_ALREADY_CLAIMED');

      const updatedTrip = await DriverTrip.findOneAndUpdate(
        {
          _id: trip._id,
          status: { $in: ['dispatched', 'active'] },
          reservedPassengerCount: { $lt: trip.maxCapacity }
        },
        {
          $set: { tripStops: insertion.bestStops },
          $inc: { reservedPassengerCount: 1 }
        },
        { returnDocument: 'after' }
      );

      if (!updatedTrip) {
        await RideBooking.findByIdAndUpdate(bookingId, {
          $set: { status: 'pending', driverId: null, driverTripId: null, dispatchedAt: null }
        });
        throw new Error('TRIP_CAPACITY_EXCEEDED: Capacity was claimed by another passenger concurrently');
      }

      return {
        trip: updatedTrip,
        booking: claimedBooking,
        detourMetrics: insertion.detourMetrics
      };
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Atomic claim of a pending booking by a driver
 */
export const claimBookingAtomic = async (driverId, bookingId) => {
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'driver' || (driver.approvalStatus !== 'approved' && driver.isApproved !== true)) {
    throw new Error('Driver is not verified or authorized to accept trips');
  }

  const booking = await RideBooking.findOneAndUpdate(
    { _id: bookingId, status: 'pending' },
    { 
      $set: { 
        status: 'driver_assigned', 
        driverId: driver._id,
        dispatchedAt: new Date()
      } 
    },
    { returnDocument: 'after' }
  );

  if (!booking) {
    throw new Error('BOOKING_ALREADY_CLAIMED');
  }

  return booking;
};

/**
 * Executes a milestone status change on an individual TripStop within a DriverTrip
 */
export const executeTripStop = async ({
  driverId,
  tripId,
  stopId,
  targetStatus,
  driverLocation = null,
  enforceProximity = true
}) => {
  const trip = await DriverTrip.findById(tripId);
  if (!trip) {
    throw new Error('DriverTrip not found');
  }

  if (trip.driverId.toString() !== driverId.toString()) {
    throw new Error('FORBIDDEN: Driver does not own this trip');
  }

  const stop = trip.tripStops.find(s => s.stopId === stopId);
  if (!stop) {
    throw new Error('TripStop not found in this trip');
  }

  // Idempotency & Terminal State Invariant: Cannot execute transitions on already terminal stops
  const TERMINAL_STOP_STATUSES = ['completed', 'cancelled', 'skipped'];
  if (TERMINAL_STOP_STATUSES.includes(stop.status)) {
    throw new Error(`STOP_ALREADY_TERMINAL: TripStop [${stopId}] is already in terminal state [${stop.status}]`);
  }

  if (stop.status === targetStatus) {
    throw new Error(`STOP_ALREADY_IN_STATE: TripStop [${stopId}] is already in status [${targetStatus}]`);
  }

  // Causality Invariant: Dropoff cannot execute before Pickup is completed
  if (stop.stopType === 'dropoff') {
    const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup' && s.bookingId.toString() === stop.bookingId.toString());
    if (pickupStop && pickupStop.status !== 'completed') {
      throw new Error('STOP_ORDER_VIOLATION: Cannot execute dropoff before pickup is completed');
    }
  }

  // Milestone Proximity Guard (75m for pickup, 100m for dropoff)
  if (enforceProximity && driverLocation && Array.isArray(driverLocation) && driverLocation.length === 2) {
    const stopCoords = stop.coordinates.coordinates;
    const distanceMeters = calculateGeodesicDistanceMeters(driverLocation, stopCoords);

    const maxAllowedRadius = stop.stopType === 'pickup' 
      ? DISPATCH_CONFIG.PICKUP_ARRIVAL_RADIUS_METERS 
      : DISPATCH_CONFIG.DROPOFF_COMPLETION_RADIUS_METERS;

    if (distanceMeters > maxAllowedRadius) {
      throw new Error(`TOO_FAR_FROM_STOP: Driver is ${distanceMeters}m away (Maximum allowed radius is ${maxAllowedRadius}m)`);
    }
  }

  stop.status = targetStatus;
  const now = new Date();

  if (targetStatus === 'arrived') {
    stop.arrivedAt = now;
  } else if (targetStatus === 'completed') {
    stop.departedAt = now;
  }

  // Synchronize corresponding RideBooking status
  const booking = await RideBooking.findById(stop.bookingId);
  if (booking) {
    if (stop.stopType === 'pickup') {
      if (targetStatus === 'arrived') {
        validateBookingTransition(booking.status, 'arrived_at_pickup');
        booking.status = 'arrived_at_pickup';
      } else if (targetStatus === 'completed') {
        validateBookingTransition(booking.status, 'in_progress');
        booking.status = 'in_progress';

        // Increment active passenger count for shared trips (or initialize)
        if (trip.tripType === 'shared') {
          trip.activePassengerCount = trip.activePassengerCount + 1;
        }
      }
    } else if (stop.stopType === 'dropoff') {
      if (targetStatus === 'completed') {
        validateBookingTransition(booking.status, 'completed');
        booking.status = 'completed';
        booking.completedAt = now;

        // Decrement active passenger count on trip
        trip.activePassengerCount = Math.max(0, trip.activePassengerCount - 1);
        // Decrement reserved passenger count on shared trip
        if (trip.tripType === 'shared') {
          trip.reservedPassengerCount = Math.max(0, trip.reservedPassengerCount - 1);
        }
      }
    }
    await booking.save();
  }

  // Update physical trip status: dispatched -> active when pickup completes
  if (trip.status === 'dispatched' && stop.stopType === 'pickup' && targetStatus === 'completed') {
    trip.status = 'active';
  }

  // Check if all stops completed and no passengers remain onboard
  const allCompleted = trip.tripStops.every(s => ['completed', 'cancelled', 'skipped'].includes(s.status));
  if (allCompleted && trip.activePassengerCount === 0 && (trip.tripType === 'solo' || trip.reservedPassengerCount === 0)) {
    trip.status = 'completed';
    trip.completedAt = now;
  }

  await trip.save();

  return { trip, stop, booking };
};
