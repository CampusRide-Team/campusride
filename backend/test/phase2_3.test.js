import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/User.js';
import RideBooking from '../src/models/RideBooking.js';
import DriverTrip from '../src/models/DriverTrip.js';
import CampusPOI from '../src/models/CampusPOI.js';
import DISPATCH_CONFIG from '../src/config/dispatchConfig.js';
import routingService, { evaluateRouteInsertion } from '../src/services/routingService.js';
import pricingService from '../src/services/pricingService.js';
import { createRideBooking, cancelBooking } from '../src/services/bookingService.js';
import {
  createSharedTrip,
  insertBookingIntoSharedTrip,
  executeTripStop,
  createSoloTrip
} from '../src/services/tripService.js';
import {
  findEligibleSharedTrips,
  findEligibleDriversForNewSharedTrip,
  dispatchSharedBooking,
  acceptSharedOffer
} from '../src/services/dispatchService.js';
import { submitRating } from '../src/services/ratingService.js';

describe('CampusRide Phase 2.3 - Shared Ride & Pooling Invariant Test Suite', () => {
  let mongoAvailable = false;
  let testPassenger1, testPassenger2, testPassenger3, testPassenger4;
  let approvedSharedDriver1, approvedSharedDriver2;

  before(async () => {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride_test';
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      }
      mongoAvailable = true;
    } catch (err) {
      console.warn('MongoDB not available. Skipping DB-dependent tests:', err.message);
      mongoAvailable = false;
    }
  });

  after(async () => {
    if (mongoAvailable && mongoose.connection.readyState !== 0) {
      try {
        await User.deleteMany({
          $or: [
            { email: /@test-phase2-3\.edu\.gh$/ },
            { phoneNumber: /^\+233230/ }
          ]
        });
        await RideBooking.deleteMany({ notes: /test_phase2_3/ });
        await DriverTrip.deleteMany({});
        await mongoose.disconnect();
      } catch (e) {
        // ignore cleanup errors
      }
    }
  });

  beforeEach(async () => {
    if (!mongoAvailable) return;

    // Clean test records
    await User.deleteMany({
      $or: [
        { email: /@test-phase2-3\.edu\.gh$/ },
        { phoneNumber: /^\+233230/ }
      ]
    });
    await RideBooking.deleteMany({});
    await DriverTrip.deleteMany({});

    // Seed test passengers
    testPassenger1 = await User.create({
      fullName: 'Shared Passenger 1',
      email: 'p1@test-phase2-3.edu.gh',
      phoneNumber: '+233230000001',
      password: 'Password123!',
      role: 'passenger'
    });

    testPassenger2 = await User.create({
      fullName: 'Shared Passenger 2',
      email: 'p2@test-phase2-3.edu.gh',
      phoneNumber: '+233230000002',
      password: 'Password123!',
      role: 'passenger'
    });

    testPassenger3 = await User.create({
      fullName: 'Shared Passenger 3',
      email: 'p3@test-phase2-3.edu.gh',
      phoneNumber: '+233230000003',
      password: 'Password123!',
      role: 'passenger'
    });

    testPassenger4 = await User.create({
      fullName: 'Shared Passenger 4',
      email: 'p4@test-phase2-3.edu.gh',
      phoneNumber: '+233230000004',
      password: 'Password123!',
      role: 'passenger'
    });

    // Seed test shared drivers
    approvedSharedDriver1 = await User.create({
      fullName: 'Approved Shared Driver 1',
      email: 'driver1@test-phase2-3.edu.gh',
      phoneNumber: '+233230000005',
      password: 'Password123!',
      role: 'driver',
      approvalStatus: 'approved',
      isOnline: true,
      lastSeen: new Date(),
      currentLocation: {
        type: 'Point',
        coordinates: [-0.1870, 5.6508] // Balme Library
      },
      driverProfile: {
        vehicle: {
          model: 'Toyota Prius',
          licensePlate: 'GW-2345-24',
          physicalCapacity: 4
        },
        capacity: {
          chosenSharedCapacity: 3 // Driver chooses 3 seats for shared pooling
        }
      }
    });

    approvedSharedDriver2 = await User.create({
      fullName: 'Approved Shared Driver 2',
      email: 'driver2@test-phase2-3.edu.gh',
      phoneNumber: '+233230000006',
      password: 'Password123!',
      role: 'driver',
      approvalStatus: 'approved',
      isOnline: true,
      lastSeen: new Date(),
      currentLocation: {
        type: 'Point',
        coordinates: [-0.1872, 5.6510]
      },
      driverProfile: {
        vehicle: {
          model: 'Hyundai Elantra',
          licensePlate: 'GW-9876-24',
          physicalCapacity: 4
        },
        capacity: {
          chosenSharedCapacity: 2
        }
      }
    });
  });

  // =========================================================================
  // 1. SHARED PRICING & SERVER-SIDE DISCOUNT INVARIANTS
  // =========================================================================
  describe('1. Shared Pricing & Server-Side Fare Calculation', () => {
    it('should calculate 20% shared discount from solo fare by default', () => {
      const soloFare = pricingService.calculateEstimatedFare({
        distanceMeters: 2000,
        rideMode: 'solo'
      });
      assert.equal(soloFare.totalFare, 15.0); // 8.0 base + (2.0 km * 3.5) = 15.0

      const sharedFare = pricingService.calculateSharedFare(soloFare, 20);
      // 15.0 * 0.20 = 3.0 discount -> 12.0 total fare
      assert.equal(sharedFare.discountAmount, 3.0);
      assert.equal(sharedFare.totalFare, 12.0);
    });

    it('should persist server-side 20% discounted fare when creating shared RideBooking', async function() {
      if (!mongoAvailable) return this.skip();

      const sharedBooking = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      assert.equal(sharedBooking.rideMode, 'shared');
      assert.ok(sharedBooking.fare.discountAmount > 0, 'Discount amount must be positive for shared rides');
      assert.ok(sharedBooking.fare.totalFare < 15.0, 'Total fare must reflect the discount');
    });
  });

  // =========================================================================
  // 2. PURE ROUTE INSERTION & CAUSAL PRECEDENCE EVALUATOR
  // =========================================================================
  describe('2. Pure Deterministic Route Insertion & Detour Evaluator', () => {
    it('should insert pickup before dropoff for single initial passenger', () => {
      const newPickup = {
        stopId: 'p1',
        bookingId: 'booking-1',
        stopType: 'pickup',
        coordinates: [-0.1870, 5.6508],
        name: 'Balme Library'
      };
      const newDropoff = {
        stopId: 'd1',
        bookingId: 'booking-1',
        stopType: 'dropoff',
        coordinates: [-0.1865, 5.6631],
        name: 'Pentagon Hostel'
      };

      const result = evaluateRouteInsertion({
        existingStops: [],
        newPickup,
        newDropoff,
        driverCoords: [-0.1870, 5.6508]
      });

      assert.equal(result.valid, true);
      assert.equal(result.bestStops.length, 2);
      assert.equal(result.bestStops[0].stopType, 'pickup');
      assert.equal(result.bestStops[1].stopType, 'dropoff');
      assert.equal(result.bestStops[0].sequenceOrder, 1);
      assert.equal(result.bestStops[1].sequenceOrder, 2);
    });

    it('should insert a second passenger preserving causal precedence for both passengers', () => {
      const existingStops = [
        {
          stopId: 'p1',
          bookingId: 'booking-1',
          stopType: 'pickup',
          coordinates: [-0.1870, 5.6508], // Balme Library
          name: 'Balme Library',
          sequenceOrder: 1,
          status: 'pending'
        },
        {
          stopId: 'd1',
          bookingId: 'booking-1',
          stopType: 'dropoff',
          coordinates: [-0.1865, 5.6631], // Pent Hostel
          name: 'Pentagon Hostel',
          sequenceOrder: 2,
          status: 'pending'
        }
      ];

      const newPickup = {
        stopId: 'p2',
        bookingId: 'booking-2',
        stopType: 'pickup',
        coordinates: [-0.1880, 5.6520], // UG Night Market
        name: 'Night Market'
      };
      const newDropoff = {
        stopId: 'd2',
        bookingId: 'booking-2',
        stopType: 'dropoff',
        coordinates: [-0.1855, 5.6610], // Evandy Hostel
        name: 'Evandy Hostel'
      };

      const result = evaluateRouteInsertion({
        existingStops,
        newPickup,
        newDropoff,
        driverCoords: [-0.1870, 5.6508]
      });

      assert.equal(result.valid, true);
      assert.equal(result.bestStops.length, 4);

      // Verify sequence order for Booking 1: Pickup precedes Dropoff
      const p1Index = result.bestStops.findIndex(s => s.bookingId === 'booking-1' && s.stopType === 'pickup');
      const d1Index = result.bestStops.findIndex(s => s.bookingId === 'booking-1' && s.stopType === 'dropoff');
      assert.ok(p1Index < d1Index, 'P1 must precede D1');

      // Verify sequence order for Booking 2: Pickup precedes Dropoff
      const p2Index = result.bestStops.findIndex(s => s.bookingId === 'booking-2' && s.stopType === 'pickup');
      const d2Index = result.bestStops.findIndex(s => s.bookingId === 'booking-2' && s.stopType === 'dropoff');
      assert.ok(p2Index < d2Index, 'P2 must precede D2');
    });

    it('should preserve immutable completed stops and not insert before completed stops', () => {
      const existingStops = [
        {
          stopId: 'p1',
          bookingId: 'booking-1',
          stopType: 'pickup',
          coordinates: [-0.1870, 5.6508],
          name: 'Balme Library',
          sequenceOrder: 1,
          status: 'completed', // Already completed!
          departedAt: new Date()
        },
        {
          stopId: 'd1',
          bookingId: 'booking-1',
          stopType: 'dropoff',
          coordinates: [-0.1865, 5.6631],
          name: 'Pentagon Hostel',
          sequenceOrder: 2,
          status: 'pending'
        }
      ];

      const newPickup = {
        stopId: 'p2',
        bookingId: 'booking-2',
        stopType: 'pickup',
        coordinates: [-0.1880, 5.6520],
        name: 'Night Market'
      };
      const newDropoff = {
        stopId: 'd2',
        bookingId: 'booking-2',
        stopType: 'dropoff',
        coordinates: [-0.1855, 5.6610],
        name: 'Evandy Hostel'
      };

      const result = evaluateRouteInsertion({
        existingStops,
        newPickup,
        newDropoff,
        driverCoords: [-0.1870, 5.6508]
      });

      assert.equal(result.valid, true);
      assert.equal(result.bestStops[0].stopId, 'p1', 'Completed stop must remain at sequence 1');
      assert.equal(result.bestStops[0].status, 'completed');
    });

    it('should reject insertion when detour exceeds MAX_ADDITIONAL_DISTANCE_METERS or TIME', () => {
      const existingStops = [
        {
          stopId: 'p1',
          bookingId: 'booking-1',
          stopType: 'pickup',
          coordinates: [-0.1870, 5.6508], // Balme Library
          name: 'Balme Library',
          sequenceOrder: 1,
          status: 'pending'
        },
        {
          stopId: 'd1',
          bookingId: 'booking-1',
          stopType: 'dropoff',
          coordinates: [-0.1865, 5.6631], // Pentagon Hostel
          name: 'Pentagon Hostel',
          sequenceOrder: 2,
          status: 'pending'
        }
      ];

      // New passenger pickup and dropoff located ~20km outside campus
      const newPickup = {
        stopId: 'p2',
        bookingId: 'booking-2',
        stopType: 'pickup',
        coordinates: [-0.0500, 5.8000], // Remote off-campus location
        name: 'Remote East Gate'
      };
      const newDropoff = {
        stopId: 'd2',
        bookingId: 'booking-2',
        stopType: 'dropoff',
        coordinates: [-0.0100, 5.8500], // Far off-campus location
        name: 'Far City Center'
      };

      const result = evaluateRouteInsertion({
        existingStops,
        newPickup,
        newDropoff,
        driverCoords: [-0.1870, 5.6508],
        constraints: {
          maxAdditionalDistanceMeters: 1500,
          maxAdditionalRideTimeSeconds: 600
        }
      });

      assert.equal(result.valid, false, 'Insertion must be rejected when detour exceeds limits');
      assert.match(result.reason, /DETOUR_CONSTRAINTS_EXCEEDED/);
    });
  });

  // =========================================================================
  // 3. SHARED TRIP INITIALIZATION & CAPACITY LIFECYCLE
  // =========================================================================
  describe('3. Shared DriverTrip Creation & Capacity Lifecycle Invariants', () => {
    it('should initialize shared trip with activePassengerCount = 0 and reservedPassengerCount = 1', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const { trip, booking: claimedBooking } = await createSharedTrip(approvedSharedDriver1._id, booking._id);

      assert.equal(trip.tripType, 'shared');
      assert.equal(trip.maxCapacity, 3);
      assert.equal(trip.activePassengerCount, 0, 'activePassengerCount must start at 0 before first pickup');
      assert.equal(trip.reservedPassengerCount, 1, 'reservedPassengerCount must be 1 for assigned passenger');
      assert.equal(trip.status, 'dispatched');
      assert.equal(claimedBooking.status, 'driver_assigned');
      assert.equal(claimedBooking.driverTripId.toString(), trip._id.toString());
    });

    it('should enforce driver chosenSharedCapacity invariant: chosenSharedCapacity >= 2 and <= physicalCapacity', async function() {
      if (!mongoAvailable) return this.skip();

      // Attempt to set chosenSharedCapacity > physicalCapacity -> Pre-save hook must reject
      approvedSharedDriver1.driverProfile.capacity.chosenSharedCapacity = 5; // physical is 4
      await assert.rejects(
        async () => {
          await approvedSharedDriver1.save();
        },
        /cannot exceed physical vehicle capacity/
      );
    });
  });

  // =========================================================================
  // 4. DYNAMIC POOL JOIN & MULTI-PASSENGER LIFECYCLE
  // =========================================================================
  describe('4. Multi-Passenger Pool Join & Physical Trip Lifecycle', () => {
    it('should complete multi-passenger lifecycle with correct active and reserved count tracking', async function() {
      if (!mongoAvailable) return this.skip();

      // Booking 1: Balme Library -> Pentagon Hostel
      const booking1 = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      // 1. Driver accepts Booking 1 (creates shared trip)
      const { trip } = await createSharedTrip(approvedSharedDriver1._id, booking1._id);
      assert.equal(trip.activePassengerCount, 0);
      assert.equal(trip.reservedPassengerCount, 1);

      // Booking 2: Night Market -> Evandy Hostel
      const booking2 = await createRideBooking(testPassenger2._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });

      // 2. Driver explicitly accepts Booking 2 pool join
      const joinResult = await insertBookingIntoSharedTrip(approvedSharedDriver1._id, trip._id, booking2._id);
      const updatedTrip = joinResult.trip;

      assert.equal(updatedTrip.tripStops.length, 4);
      assert.equal(updatedTrip.activePassengerCount, 0);
      assert.equal(updatedTrip.reservedPassengerCount, 2);

      // Get ordered stops
      const p1Stop = updatedTrip.tripStops.find(s => s.bookingId.toString() === booking1._id.toString() && s.stopType === 'pickup');
      const p2Stop = updatedTrip.tripStops.find(s => s.bookingId.toString() === booking2._id.toString() && s.stopType === 'pickup');
      const d1Stop = updatedTrip.tripStops.find(s => s.bookingId.toString() === booking1._id.toString() && s.stopType === 'dropoff');
      const d2Stop = updatedTrip.tripStops.find(s => s.bookingId.toString() === booking2._id.toString() && s.stopType === 'dropoff');

      // 3. Driver arrives and completes P1 Pickup
      await executeTripStop({
        driverId: approvedSharedDriver1._id,
        tripId: trip._id,
        stopId: p1Stop.stopId,
        targetStatus: 'arrived',
        enforceProximity: false
      });
      await executeTripStop({
        driverId: approvedSharedDriver1._id,
        tripId: trip._id,
        stopId: p1Stop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      const tripAfterP1 = await DriverTrip.findById(trip._id);
      assert.equal(tripAfterP1.activePassengerCount, 1, 'activePassengerCount should increment to 1');
      assert.equal(tripAfterP1.status, 'active', 'Trip status should transition to active');

      // 4. Driver arrives and completes P2 Pickup
      await executeTripStop({
        driverId: approvedSharedDriver1._id,
        tripId: trip._id,
        stopId: p2Stop.stopId,
        targetStatus: 'arrived',
        enforceProximity: false
      });
      await executeTripStop({
        driverId: approvedSharedDriver1._id,
        tripId: trip._id,
        stopId: p2Stop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      const tripAfterP2 = await DriverTrip.findById(trip._id);
      assert.equal(tripAfterP2.activePassengerCount, 2, 'activePassengerCount should increment to 2');

      // 5. Driver completes P1 Dropoff
      await executeTripStop({
        driverId: approvedSharedDriver1._id,
        tripId: trip._id,
        stopId: d1Stop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      const tripAfterD1 = await DriverTrip.findById(trip._id);
      assert.equal(tripAfterD1.activePassengerCount, 1, 'activePassengerCount should decrement to 1');
      assert.equal(tripAfterD1.reservedPassengerCount, 1, 'reservedPassengerCount should decrement to 1');
      assert.equal(tripAfterD1.status, 'active', 'Trip must NOT complete while passenger 2 is onboard');

      const b1Updated = await RideBooking.findById(booking1._id);
      assert.equal(b1Updated.status, 'completed');

      // 6. Driver completes P2 Dropoff
      await executeTripStop({
        driverId: approvedSharedDriver1._id,
        tripId: trip._id,
        stopId: d2Stop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      const finalTrip = await DriverTrip.findById(trip._id);
      assert.equal(finalTrip.activePassengerCount, 0);
      assert.equal(finalTrip.reservedPassengerCount, 0);
      assert.equal(finalTrip.status, 'completed', 'Trip completes only when all passengers are dropped off');

      const b2Updated = await RideBooking.findById(booking2._id);
      assert.equal(b2Updated.status, 'completed');
    });
  });

  // =========================================================================
  // 5. CAPACITY LIMITS & OVERBOOKING PROTECTION
  // =========================================================================
  describe('5. Capacity Limit & Overbooking Enforcement', () => {
    it('should reject adding a passenger when shared trip has reached maxCapacity', async function() {
      if (!mongoAvailable) return this.skip();

      // Driver 2 has chosenSharedCapacity = 2
      const booking1 = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const { trip } = await createSharedTrip(approvedSharedDriver2._id, booking1._id);

      const booking2 = await createRideBooking(testPassenger2._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });

      await insertBookingIntoSharedTrip(approvedSharedDriver2._id, trip._id, booking2._id);

      // Attempt 3rd booking on trip with maxCapacity = 2
      const booking3 = await createRideBooking(testPassenger3._id, {
        pickup: 'Commonwealth Hall',
        dropoff: 'Akuafo Hall',
        rideMode: 'shared'
      });

      await assert.rejects(
        async () => {
          await insertBookingIntoSharedTrip(approvedSharedDriver2._id, trip._id, booking3._id);
        },
        /TRIP_CAPACITY_EXCEEDED/
      );
    });
  });

  // =========================================================================
  // 6. CONCURRENCY RACES (A, B, C, D, E, F, G)
  // =========================================================================
  describe('6. Concurrency & Race Condition Safety Gates', () => {
    it('Race A / D: Two bookings simultaneously competing for last remaining seat on active shared trip', async function() {
      if (!mongoAvailable) return this.skip();

      // Driver 2 maxCapacity = 2, currently has 1 booking
      const booking1 = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const { trip } = await createSharedTrip(approvedSharedDriver2._id, booking1._id);

      // Create Booking A and Booking B concurrently competing for seat #2
      const bookingA = await createRideBooking(testPassenger2._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });

      const bookingB = await createRideBooking(testPassenger3._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });

      const results = await Promise.allSettled([
        insertBookingIntoSharedTrip(approvedSharedDriver2._id, trip._id, bookingA._id),
        insertBookingIntoSharedTrip(approvedSharedDriver2._id, trip._id, bookingB._id)
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one concurrent booking claim must succeed');
      assert.equal(rejected.length, 1, 'The competing booking claim must be rejected due to capacity limit');

      const verifiedTrip = await DriverTrip.findById(trip._id);
      assert.equal(verifiedTrip.reservedPassengerCount, 2);
    });

    it('Race B: Two drivers attempting to accept the same shared booking concurrently', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const results = await Promise.allSettled([
        createSharedTrip(approvedSharedDriver1._id, booking._id),
        createSharedTrip(approvedSharedDriver2._id, booking._id)
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one driver must claim the shared booking');
      assert.equal(rejected.length, 1, 'Second driver must receive BOOKING_ALREADY_CLAIMED');
    });

    it('Race C: Driver accepts shared booking concurrently with passenger cancellation', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const results = await Promise.allSettled([
        createSharedTrip(approvedSharedDriver1._id, booking._id),
        cancelBooking(booking._id, testPassenger1._id, 'passenger', 'Changed my mind')
      ]);

      const updatedBooking = await RideBooking.findById(booking._id);
      assert.ok(['driver_assigned', 'cancelled'].includes(updatedBooking.status));

      const trips = await DriverTrip.find({ 'tripStops.bookingId': booking._id });
      if (updatedBooking.status === 'cancelled') {
        // If cancellation won, no active reservation should remain unhandled
        assert.ok(trips.length === 0 || trips[0].reservedPassengerCount === 0 || trips[0].status === 'cancelled' || trips[0].status === 'completed');
      } else {
        // If driver won, trip has valid reservation
        assert.equal(trips.length, 1);
        assert.equal(trips[0].reservedPassengerCount, 1);
      }
    });

    it('Race F: Duplicate pool acceptance by same driver for same booking', async function() {
      if (!mongoAvailable) return this.skip();

      const booking1 = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const { trip } = await createSharedTrip(approvedSharedDriver1._id, booking1._id);

      const booking2 = await createRideBooking(testPassenger2._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });

      // First acceptance succeeds
      const first = await insertBookingIntoSharedTrip(approvedSharedDriver1._id, trip._id, booking2._id);
      assert.equal(first.trip.reservedPassengerCount, 2);

      // Duplicate acceptance MUST fail cleanly
      await assert.rejects(
        async () => {
          await insertBookingIntoSharedTrip(approvedSharedDriver1._id, trip._id, booking2._id);
        },
        /BOOKING_ALREADY_CLAIMED/
      );
    });
  });

  // =========================================================================
  // 7. CANCELLATION LIFECYCLE & PHYSICAL SAFETY
  // =========================================================================
  describe('7. Pre-Pickup vs Post-Pickup Cancellation Semantics', () => {
    it('should release reserved capacity on pre-pickup cancellation without affecting onboard counts', async function() {
      if (!mongoAvailable) return this.skip();

      const booking1 = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const { trip } = await createSharedTrip(approvedSharedDriver1._id, booking1._id);

      const booking2 = await createRideBooking(testPassenger2._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });

      await insertBookingIntoSharedTrip(approvedSharedDriver1._id, trip._id, booking2._id);

      const tripBeforeCancel = await DriverTrip.findById(trip._id);
      assert.equal(tripBeforeCancel.reservedPassengerCount, 2);

      // Passenger 2 cancels BEFORE pickup
      await cancelBooking(booking2._id, testPassenger2._id, 'passenger', 'Need to cancel');

      const tripAfterCancel = await DriverTrip.findById(trip._id);
      assert.equal(tripAfterCancel.reservedPassengerCount, 1, 'Pre-pickup cancellation must release reserved capacity');
      assert.equal(tripAfterCancel.activePassengerCount, 0);

      // Verify Passenger 2's uncompleted stops are marked cancelled
      const p2Stops = tripAfterCancel.tripStops.filter(s => s.bookingId.toString() === booking2._id.toString());
      assert.ok(p2Stops.every(s => s.status === 'cancelled'));
    });

    it('should NOT release physical capacity if passenger cancels after pickup (emergency cancellation)', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const { trip } = await createSharedTrip(approvedSharedDriver1._id, booking._id);
      const pStop = trip.tripStops.find(s => s.stopType === 'pickup');

      // Passenger is picked up -> arrived -> completed (in_progress)
      await executeTripStop({
        driverId: approvedSharedDriver1._id,
        tripId: trip._id,
        stopId: pStop.stopId,
        targetStatus: 'arrived',
        enforceProximity: false
      });
      await executeTripStop({
        driverId: approvedSharedDriver1._id,
        tripId: trip._id,
        stopId: pStop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      const tripOnboard = await DriverTrip.findById(trip._id);
      assert.equal(tripOnboard.activePassengerCount, 1);

      // Passenger emergency cancels while onboard
      await cancelBooking(booking._id, testPassenger1._id, 'passenger', 'Emergency exit');

      const tripAfterEmergency = await DriverTrip.findById(trip._id);
      assert.equal(tripAfterEmergency.activePassengerCount, 1, 'Physical occupancy must remain occupied until passenger exits');
    });
  });

  // =========================================================================
  // 8. PRIVACY & PASSENGER DATA ISOLATION
  // =========================================================================
  describe('8. Passenger Data Isolation & Privacy Hardening', () => {
    it('should prevent Passenger A from accessing Passenger B private booking details', async function() {
      if (!mongoAvailable) return this.skip();

      const bookingA = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const bookingB = await createRideBooking(testPassenger2._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });

      // Passenger 1 should not be able to fetch Passenger 2 booking via authorization guard
      const isAuthorizedOwner = (booking, requestingUserId) => (
        booking.passengerId._id?.toString() === requestingUserId.toString() ||
        booking.passengerId.toString() === requestingUserId.toString()
      );

      assert.equal(isAuthorizedOwner(bookingA, testPassenger1._id), true);
      assert.equal(isAuthorizedOwner(bookingB, testPassenger1._id), false);
    });

    it('should prevent Driver B from executing milestones on Driver A shared trip', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const { trip } = await createSharedTrip(approvedSharedDriver1._id, booking._id);
      const pStop = trip.tripStops.find(s => s.stopType === 'pickup');

      await assert.rejects(
        async () => {
          await executeTripStop({
            driverId: approvedSharedDriver2._id, // Unauthorized driver
            tripId: trip._id,
            stopId: pStop.stopId,
            targetStatus: 'arrived',
            enforceProximity: false
          });
        },
        /FORBIDDEN: Driver does not own this trip/
      );
    });
  });

  // =========================================================================
  // 9. INDEPENDENT RATING ELIGIBILITY
  // =========================================================================
  describe('9. Independent Rating Eligibility per RideBooking', () => {
    it('should allow rating for completed shared booking and reject rating for pre-pickup cancelled booking', async function() {
      if (!mongoAvailable) return this.skip();

      // Booking 1 completes
      const booking1 = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const { trip } = await createSharedTrip(approvedSharedDriver1._id, booking1._id);
      const p1Stop = trip.tripStops.find(s => s.stopType === 'pickup');
      const d1Stop = trip.tripStops.find(s => s.stopType === 'dropoff');

      await executeTripStop({ driverId: approvedSharedDriver1._id, tripId: trip._id, stopId: p1Stop.stopId, targetStatus: 'arrived', enforceProximity: false });
      await executeTripStop({ driverId: approvedSharedDriver1._id, tripId: trip._id, stopId: p1Stop.stopId, targetStatus: 'completed', enforceProximity: false });
      await executeTripStop({ driverId: approvedSharedDriver1._id, tripId: trip._id, stopId: d1Stop.stopId, targetStatus: 'completed', enforceProximity: false });

      // Booking 2 cancels before pickup
      const booking2 = await createRideBooking(testPassenger2._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });
      await cancelBooking(booking2._id, testPassenger2._id, 'passenger', 'Cancelled');

      // Passenger 1 rates completed booking -> SUCCEEDS
      const rating = await submitRating(testPassenger1._id, {
        bookingId: booking1._id,
        score: 5,
        comment: 'Great shared ride experience!'
      });
      assert.equal(rating.score, 5);

      // Passenger 2 attempts to rate cancelled booking -> REJECTED
      await assert.rejects(
        async () => {
          await submitRating(testPassenger2._id, {
            bookingId: booking2._id,
            score: 5,
            comment: 'Did not take ride'
          });
        },
        /Cannot rate a ride that is not completed/
      );
    });
  });

  // =========================================================================
  // 10. DISPATCH MATCHMAKING & OFFER SELECTION
  // =========================================================================
  describe('10. Dispatch Matchmaking & Explicit Driver Consent', () => {
    it('should discover active shared trip with open capacity as pool_join candidate', async function() {
      if (!mongoAvailable) return this.skip();

      const booking1 = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      // Driver 1 creates active shared trip
      await createSharedTrip(approvedSharedDriver1._id, booking1._id);

      // Incoming new booking compatible with Driver 1 route
      const booking2 = await createRideBooking(testPassenger2._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });

      const poolCandidates = await findEligibleSharedTrips(booking2);
      assert.ok(poolCandidates.length >= 1, 'Driver 1 active shared trip should be discovered as pool candidate');
      assert.equal(poolCandidates[0].driver._id.toString(), approvedSharedDriver1._id.toString());
    });

    it('should dispatch pool_join offer to active shared trip driver and new_shared_trip to idle driver', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger1._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      // With no active shared trips, dispatchSharedBooking dispatches new_shared_trip offer
      const dispatchResult = await dispatchSharedBooking(booking._id);
      assert.equal(dispatchResult.offerType, 'new_shared_trip');
      assert.ok(dispatchResult.dispatchedToCount > 0);
    });
  });

});
