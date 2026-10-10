import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../src/models/User.js';
import RideBooking from '../src/models/RideBooking.js';
import DriverTrip from '../src/models/DriverTrip.js';
import CampusPOI from '../src/models/CampusPOI.js';
import DISPATCH_CONFIG from '../src/config/dispatchConfig.js';

import { createRideBooking } from '../src/services/bookingService.js';
import { createSoloTrip, claimBookingAtomic, executeTripStop } from '../src/services/tripService.js';
import { findEligibleDrivers, dispatchSoloBooking, acceptSoloOffer } from '../src/services/dispatchService.js';
import routingService from '../src/services/routingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('CampusRide Phase 2.2 - Solo Dispatch, Telemetry, Stop Lifecycle & Geospatial Invariant Test Suite', () => {
  let mongoAvailable = false;
  let testPassenger = null;
  let approvedDriver1 = null;
  let approvedDriver2 = null;
  let unapprovedDriver = null;
  let offlineDriver = null;
  let staleDriver = null;

  before(async () => {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride_test';
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      mongoAvailable = true;

      // Clean test fixtures
      await User.deleteMany({ email: /@test-phase2-2\.ug\.edu\.gh$/ });
      await RideBooking.deleteMany({ 'pickup.name': /Phase 2\.2/ });
      await DriverTrip.deleteMany({});

      // 1. Passenger
      testPassenger = await User.create({
        fullName: 'Abena Test Passenger',
        email: 'passenger@test-phase2-2.ug.edu.gh',
        phoneNumber: '+233241000001',
        password: 'Password123!',
        role: 'passenger',
        approvalStatus: 'approved'
      });

      // 2. Approved Online Driver 1 (Balme Library: [-0.1870, 5.6508])
      approvedDriver1 = await User.create({
        fullName: 'Kwame Approved Driver 1',
        email: 'driver1@test-phase2-2.ug.edu.gh',
        phoneNumber: '+233241000002',
        password: 'Password123!',
        role: 'driver',
        approvalStatus: 'approved',
        isOnline: true,
        lastSeen: new Date(),
        currentLocation: {
          type: 'Point',
          coordinates: [-0.1870, 5.6508]
        },
        driverProfile: {
          vehicle: { model: 'Toyota Vitz', licensePlate: 'GW-2026-22', color: 'White', physicalCapacity: 4 },
          capacity: { chosenSharedCapacity: 3 }
        }
      });

      // 3. Approved Online Driver 2 (Night Market: [-0.1901, 5.6530])
      approvedDriver2 = await User.create({
        fullName: 'Kofi Approved Driver 2',
        email: 'driver2@test-phase2-2.ug.edu.gh',
        phoneNumber: '+233241000003',
        password: 'Password123!',
        role: 'driver',
        approvalStatus: 'approved',
        isOnline: true,
        lastSeen: new Date(),
        currentLocation: {
          type: 'Point',
          coordinates: [-0.1901, 5.6530]
        },
        driverProfile: {
          vehicle: { model: 'Hyundai i10', licensePlate: 'GR-2026-22', color: 'Silver', physicalCapacity: 4 },
          capacity: { chosenSharedCapacity: 3 }
        }
      });

      // 4. Unapproved Driver
      unapprovedDriver = await User.create({
        fullName: 'Yaw Pending Driver',
        email: 'driver-pending@test-phase2-2.ug.edu.gh',
        phoneNumber: '+233241000004',
        password: 'Password123!',
        role: 'driver',
        approvalStatus: 'pending',
        isOnline: true,
        lastSeen: new Date(),
        currentLocation: {
          type: 'Point',
          coordinates: [-0.1870, 5.6508]
        }
      });

      // 5. Offline Driver
      offlineDriver = await User.create({
        fullName: 'Esi Offline Driver',
        email: 'driver-offline@test-phase2-2.ug.edu.gh',
        phoneNumber: '+233241000005',
        password: 'Password123!',
        role: 'driver',
        approvalStatus: 'approved',
        isOnline: false,
        lastSeen: new Date(),
        currentLocation: {
          type: 'Point',
          coordinates: [-0.1870, 5.6508]
        }
      });

      // 6. Stale Heartbeat Driver (Last seen 2 minutes ago > 60s freshness threshold)
      staleDriver = await User.create({
        fullName: 'Mensa Stale Driver',
        email: 'driver-stale@test-phase2-2.ug.edu.gh',
        phoneNumber: '+233241000006',
        password: 'Password123!',
        role: 'driver',
        approvalStatus: 'approved',
        isOnline: true,
        lastSeen: new Date(Date.now() - 120000), // 2 minutes ago
        currentLocation: {
          type: 'Point',
          coordinates: [-0.1870, 5.6508]
        }
      });

    } catch (err) {
      console.warn('[Phase 2.2 Test Setup] MongoDB connection failed:', err.message);
      mongoAvailable = false;
    }
  });

  after(async () => {
    if (mongoAvailable) {
      await User.deleteMany({ email: /@test-phase2-2\.ug\.edu\.gh$/ });
      await RideBooking.deleteMany({ 'pickup.name': /Phase 2\.2/ });
      await DriverTrip.deleteMany({});
      await mongoose.disconnect();
    }
  });

  // =========================================================================
  // A. DRIVER AVAILABILITY & ELIGIBILITY INVARIANTS
  // =========================================================================
  describe('A. Driver Availability & Eligibility Filtering', () => {
    it('should include approved online drivers with fresh heartbeats and exclude unapproved, offline, and stale drivers', async function() {
      if (!mongoAvailable) return this.skip();

      const pickupCoords = [-0.1870, 5.6508];
      const eligibleDrivers = await findEligibleDrivers({ coordinates: pickupCoords, maxDistance: 5000 });

      const eligibleIds = eligibleDrivers.map(d => d._id.toString());

      assert.ok(eligibleIds.includes(approvedDriver1._id.toString()), 'Approved Driver 1 must be eligible');
      assert.ok(eligibleIds.includes(approvedDriver2._id.toString()), 'Approved Driver 2 must be eligible');

      assert.ok(!eligibleIds.includes(unapprovedDriver._id.toString()), 'Unapproved driver must NOT be eligible');
      assert.ok(!eligibleIds.includes(offlineDriver._id.toString()), 'Offline driver must NOT be eligible');
      assert.ok(!eligibleIds.includes(staleDriver._id.toString()), 'Driver with stale heartbeat must NOT be eligible');
    });

    it('should exclude a driver from candidate discovery if they already have an active/dispatched DriverTrip', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      // Driver 1 accepts booking
      const { trip } = await acceptSoloOffer(approvedDriver1._id, booking._id);
      assert.equal(trip.status, 'dispatched');

      // Now query eligible drivers again
      const eligibleDrivers = await findEligibleDrivers({ coordinates: [-0.1870, 5.6508], maxDistance: 5000 });
      const eligibleIds = eligibleDrivers.map(d => d._id.toString());

      assert.ok(!eligibleIds.includes(approvedDriver1._id.toString()), 'Driver 1 on active trip must be EXCLUDED from dispatch');
      assert.ok(eligibleIds.includes(approvedDriver2._id.toString()), 'Driver 2 without active trip must remain ELIGIBLE');

      // Cleanup trip
      await DriverTrip.deleteOne({ _id: trip._id });
      await RideBooking.deleteOne({ _id: booking._id });
    });
  });

  // =========================================================================
  // B. SOLO DISPATCH & TARGETED SOCKET OFFERS
  // =========================================================================
  describe('B. Solo Booking Dispatch & Scoped Socket Offers', () => {
    it('should dispatch pending solo booking strictly to targeted user:{driverId} rooms', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Night Market',
        rideMode: 'solo'
      });

      const emittedEvents = [];
      const mockIo = {
        to: (roomName) => ({
          emit: (eventName, payload) => {
            emittedEvents.push({ roomName, eventName, payload });
          }
        })
      };

      const result = await dispatchSoloBooking(booking._id, mockIo);

      assert.ok(result.dispatchedToCount >= 2, 'Should dispatch to at least 2 eligible drivers');
      assert.equal(emittedEvents.length, result.dispatchedToCount);

      // Verify every emit went strictly to user:{driverId} room with static event dispatch:offer
      for (const event of emittedEvents) {
        assert.match(event.roomName, /^user:/, 'Room must follow user:{userId} pattern');
        assert.equal(event.eventName, 'dispatch:offer', 'Event name must be static dispatch:offer');
        assert.equal(event.payload.bookingId.toString(), booking._id.toString());
        assert.equal(event.payload.rideMode, 'solo');
        assert.ok(event.payload.expiresAt instanceof Date);
        assert.ok(event.payload.estimatedFare > 0);
      }

      await RideBooking.deleteOne({ _id: booking._id });
    });

    it('should reject dispatch if booking is not in pending status', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Night Market',
        rideMode: 'solo'
      });

      booking.status = 'cancelled';
      await booking.save();

      await assert.rejects(
        async () => {
          await dispatchSoloBooking(booking._id);
        },
        /BOOKING_NOT_PENDING/
      );

      await RideBooking.deleteOne({ _id: booking._id });
    });
  });

  // =========================================================================
  // C. ATOMIC ACCEPTANCE & CONCURRENCY RACE CONDITION SAFETY
  // =========================================================================
  describe('C. Atomic Driver Acceptance & Concurrency Race Condition Safety', () => {
    it('should atomically allow only one driver to claim booking and deterministically reject concurrent claim (Race A: Two Drivers / Same Booking)', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      // Driver 1 and Driver 2 attempt to accept the exact same booking concurrently
      const accept1 = acceptSoloOffer(approvedDriver1._id, booking._id);
      const accept2 = acceptSoloOffer(approvedDriver2._id, booking._id);

      const results = await Promise.allSettled([accept1, accept2]);
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one driver acceptance must succeed');
      assert.equal(rejected.length, 1, 'Exactly one driver acceptance must fail');
      assert.match(rejected[0].reason.message, /BOOKING_ALREADY_CLAIMED/);

      // Verify winning booking and trip invariants
      const winningResult = fulfilled[0].value;
      const persistedBooking = await RideBooking.findById(booking._id);
      const persistedTrip = await DriverTrip.findById(winningResult.trip._id);

      assert.equal(persistedBooking.status, 'driver_assigned');
      assert.equal(persistedBooking.driverId.toString(), winningResult.trip.driverId.toString());
      assert.equal(persistedBooking.driverTripId.toString(), persistedTrip._id.toString());

      // Verify exactly ONE DriverTrip was created in the database for this booking
      const tripCount = await DriverTrip.countDocuments({ 'tripStops.bookingId': booking._id });
      assert.equal(tripCount, 1, 'Exactly one DriverTrip must exist for the booking');

      // Cleanup
      await DriverTrip.deleteOne({ _id: persistedTrip._id });
      await RideBooking.deleteOne({ _id: booking._id });
    });

    it('should prevent a single driver from concurrently accepting multiple different bookings (Race B: One Driver / Multiple Bookings)', async function() {
      if (!mongoAvailable) return this.skip();

      const bookingA = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const bookingB = await createRideBooking(testPassenger._id, {
        pickup: 'Night Market',
        dropoff: 'Akuafo Hall',
        rideMode: 'solo'
      });

      // Driver 1 attempts to accept Booking A and Booking B concurrently
      const acceptA = acceptSoloOffer(approvedDriver1._id, bookingA._id);
      const acceptB = acceptSoloOffer(approvedDriver1._id, bookingB._id);

      const results = await Promise.allSettled([acceptA, acceptB]);
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one acceptance must succeed for Driver 1');
      assert.equal(rejected.length, 1, 'Concurrent second acceptance for Driver 1 must fail deterministically');
      assert.match(rejected[0].reason.message, /DRIVER_ALREADY_HAS_ACTIVE_TRIP/);

      // Verify active DriverTrip count for Driver 1 is strictly 1
      const activeTripsDriver1 = await DriverTrip.find({
        driverId: approvedDriver1._id,
        status: { $in: ['dispatched', 'active'] }
      });
      assert.equal(activeTripsDriver1.length, 1, 'Driver 1 must have exactly 1 active/dispatched DriverTrip in the database');

      // Verify winning booking vs rejected booking state
      const winningBookingId = fulfilled[0].value.booking._id;
      const rejectedBookingId = winningBookingId.toString() === bookingA._id.toString() ? bookingB._id : bookingA._id;

      const winningBooking = await RideBooking.findById(winningBookingId);
      const rejectedBooking = await RideBooking.findById(rejectedBookingId);

      assert.equal(winningBooking.status, 'driver_assigned');
      assert.equal(winningBooking.driverId.toString(), approvedDriver1._id.toString());
      assert.ok(winningBooking.driverTripId != null);

      assert.equal(rejectedBooking.status, 'pending', 'Rejected booking must remain in valid pending state');
      assert.equal(rejectedBooking.driverId, null, 'Rejected booking must have driverId: null');
      assert.equal(rejectedBooking.driverTripId, null, 'Rejected booking must not retain an orphaned driverTripId');

      // Cleanup
      await DriverTrip.deleteMany({ driverId: approvedDriver1._id });
      await RideBooking.deleteMany({ _id: { $in: [bookingA._id, bookingB._id] } });
    });
  });

  // =========================================================================
  // D. SOLO DRIVERTRIP INVARIANTS & CAPACITY LIFECYCLE
  // =========================================================================
  describe('D. Solo DriverTrip Invariants & Capacity Lifecycle', () => {
    it('should verify solo tripType, maxCapacity = 1, activePassengerCount = 1 initially, and 0 after completion', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await acceptSoloOffer(approvedDriver1._id, booking._id);

      // Invariants at creation
      assert.equal(trip.tripType, 'solo');
      assert.equal(trip.maxCapacity, 1);
      assert.equal(trip.activePassengerCount, 1);
      assert.equal(trip.status, 'dispatched');
      assert.equal(trip.tripStops.length, 2);

      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');

      assert.equal(pickupStop.sequenceOrder, 1);
      assert.equal(dropoffStop.sequenceOrder, 2);

      // Step 1: Pickup arrived & completed (activePassengerCount stays 1, trip becomes active)
      await executeTripStop({ driverId: approvedDriver1._id, tripId: trip._id, stopId: pickupStop.stopId, targetStatus: 'arrived', enforceProximity: false });
      const pickupCompletedResult = await executeTripStop({ driverId: approvedDriver1._id, tripId: trip._id, stopId: pickupStop.stopId, targetStatus: 'completed', enforceProximity: false });

      assert.equal(pickupCompletedResult.trip.status, 'active');
      assert.equal(pickupCompletedResult.trip.activePassengerCount, 1, 'Active passenger count must remain 1 during transit');
      assert.equal(pickupCompletedResult.booking.status, 'in_progress');

      // Step 2: Dropoff completed (activePassengerCount becomes 0, trip becomes completed)
      const dropoffCompletedResult = await executeTripStop({ driverId: approvedDriver1._id, tripId: trip._id, stopId: dropoffStop.stopId, targetStatus: 'completed', enforceProximity: false });

      assert.equal(dropoffCompletedResult.trip.status, 'completed');
      assert.equal(dropoffCompletedResult.trip.activePassengerCount, 0, 'Active passenger count must drop to 0 upon dropoff');
      assert.equal(dropoffCompletedResult.booking.status, 'completed');

      // Cleanup
      await DriverTrip.deleteOne({ _id: trip._id });
      await RideBooking.deleteOne({ _id: booking._id });
    });
  });

  // =========================================================================
  // E. STOP ORDERING CAUSALITY ENFORCEMENT
  // =========================================================================
  describe('E. Stop Ordering Causality Guards', () => {
    it('should reject dropoff stop execution before pickup stop has completed', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await acceptSoloOffer(approvedDriver1._id, booking._id);
      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');

      // Attempt dropoff completion before pickup
      await assert.rejects(
        async () => {
          await executeTripStop({
            driverId: approvedDriver1._id,
            tripId: trip._id,
            stopId: dropoffStop.stopId,
            targetStatus: 'completed',
            enforceProximity: false
          });
        },
        /STOP_ORDER_VIOLATION/
      );

      // Cleanup
      await DriverTrip.deleteOne({ _id: trip._id });
      await RideBooking.deleteOne({ _id: booking._id });
    });
  });

  // =========================================================================
  // F. GEOSPATIAL GATES (75m PICKUP, 100m DROPOFF)
  // =========================================================================
  describe('F. Geospatial Distance Enforcement Gates', () => {
    it('should enforce pickup arrival within 75m and reject when > 75m', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library', // [-0.1870, 5.6508]
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await acceptSoloOffer(approvedDriver1._id, booking._id);
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');

      // Test > 75m away (Pentagon Hostel is ~1368m away) -> MUST REJECT
      await assert.rejects(
        async () => {
          await executeTripStop({
            driverId: approvedDriver1._id,
            tripId: trip._id,
            stopId: pickupStop.stopId,
            targetStatus: 'arrived',
            driverLocation: [-0.1865, 5.6631],
            enforceProximity: true
          });
        },
        /TOO_FAR_FROM_STOP/
      );

      // Test <= 75m away (identical coordinate) -> MUST SUCCEED
      const successResult = await executeTripStop({
        driverId: approvedDriver1._id,
        tripId: trip._id,
        stopId: pickupStop.stopId,
        targetStatus: 'arrived',
        driverLocation: [-0.1870, 5.6508],
        enforceProximity: true
      });

      assert.equal(successResult.stop.status, 'arrived');

      // Cleanup
      await DriverTrip.deleteOne({ _id: trip._id });
      await RideBooking.deleteOne({ _id: booking._id });
    });

    it('should enforce dropoff completion within 100m and reject when > 100m', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel', // [-0.1865, 5.6631]
        rideMode: 'solo'
      });

      const { trip } = await acceptSoloOffer(approvedDriver1._id, booking._id);
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');

      // Complete pickup
      await executeTripStop({ driverId: approvedDriver1._id, tripId: trip._id, stopId: pickupStop.stopId, targetStatus: 'arrived', enforceProximity: false });
      await executeTripStop({ driverId: approvedDriver1._id, tripId: trip._id, stopId: pickupStop.stopId, targetStatus: 'completed', enforceProximity: false });

      // Test dropoff with driver location far away at Balme Library (> 100m away) -> MUST REJECT
      await assert.rejects(
        async () => {
          await executeTripStop({
            driverId: approvedDriver1._id,
            tripId: trip._id,
            stopId: dropoffStop.stopId,
            targetStatus: 'completed',
            driverLocation: [-0.1870, 5.6508],
            enforceProximity: true
          });
        },
        /TOO_FAR_FROM_STOP/
      );

      // Test dropoff with driver location right at Pentagon Hostel -> MUST SUCCEED
      const dropoffResult = await executeTripStop({
        driverId: approvedDriver1._id,
        tripId: trip._id,
        stopId: dropoffStop.stopId,
        targetStatus: 'completed',
        driverLocation: [-0.1865, 5.6631],
        enforceProximity: true
      });

      assert.equal(dropoffResult.stop.status, 'completed');
      assert.equal(dropoffResult.trip.status, 'completed');

      // Cleanup
      await DriverTrip.deleteOne({ _id: trip._id });
      await RideBooking.deleteOne({ _id: booking._id });
    });
  });

  // =========================================================================
  // G. ROUTING ENDPOINT & GEOSPATIAL COORDINATE BOUNDS
  // =========================================================================
  describe('G. Backend Routing Service & Coordinate Validation', () => {
    it('should compute valid route between two campus points', async () => {
      const balme = [-0.1870, 5.6508];
      const pent = [-0.1865, 5.6631];

      const route = await routingService.getRoute([balme, pent]);
      assert.ok(route.distanceMeters > 0);
      assert.ok(route.durationSeconds > 0);
    });

    it('should reject route computation with fewer than 2 waypoints', async () => {
      await assert.rejects(
        async () => {
          await routingService.getRoute([[-0.1870, 5.6508]]);
        },
        /At least 2 coordinate waypoints are required/
      );
    });
  });

  // =========================================================================
  // H. IDEMPOTENCY & DUPLICATE EXECUTION REGRESSION
  // =========================================================================
  describe('H. Stop Idempotency & Terminal State Preservation', () => {
    it('should reject duplicate execution on already completed stop', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Night Market',
        rideMode: 'solo'
      });

      const { trip } = await acceptSoloOffer(approvedDriver1._id, booking._id);
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');

      await executeTripStop({ driverId: approvedDriver1._id, tripId: trip._id, stopId: pickupStop.stopId, targetStatus: 'arrived', enforceProximity: false });
      await executeTripStop({ driverId: approvedDriver1._id, tripId: trip._id, stopId: pickupStop.stopId, targetStatus: 'completed', enforceProximity: false });

      // Duplicate execution attempt on completed stop
      await assert.rejects(
        async () => {
          await executeTripStop({
            driverId: approvedDriver1._id,
            tripId: trip._id,
            stopId: pickupStop.stopId,
            targetStatus: 'completed',
            enforceProximity: false
          });
        },
        /STOP_ALREADY_TERMINAL/
      );

      // Cleanup
      await DriverTrip.deleteOne({ _id: trip._id });
      await RideBooking.deleteOne({ _id: booking._id });
    });
  });
});
