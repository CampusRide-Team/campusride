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
import Rating from '../src/models/Rating.js';

import { 
  seedCampusPOIs, 
  searchPOIs, 
  findNearestPOI, 
  resolveLocation, 
  CANONICAL_CAMPUS_POIS 
} from '../src/services/poiService.js';
import routingService, { calculateGeodesicDistanceMeters } from '../src/services/routingService.js';
import pricingService from '../src/services/pricingService.js';
import { 
  validateBookingTransition, 
  validateStopOrdering, 
  createRideBooking, 
  cancelBooking 
} from '../src/services/bookingService.js';
import { 
  createSoloTrip, 
  claimBookingAtomic, 
  executeTripStop 
} from '../src/services/tripService.js';
import { submitRating } from '../src/services/ratingService.js';
import { 
  protect, 
  requireRole, 
  requirePassenger, 
  requireApprovedDriver, 
  requireAdmin 
} from '../src/middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('CampusRide Phase 2.1 - Automated Invariant & Security Verification Suite', () => {
  let mongoAvailable = false;
  let testPassenger = null;
  let testDriver = null;
  let unapprovedDriver = null;
  let testAdmin = null;

  before(async () => {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride_test';
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      mongoAvailable = true;

      // Clean test fixture database
      await User.deleteMany({ email: /@test-phase2-1\.ug\.edu\.gh$/ });
      await RideBooking.deleteMany({ 'pickup.name': /Test Location/ });
      await DriverTrip.deleteMany({});
      await Rating.deleteMany({});

      // Create test users
      testPassenger = await User.create({
        fullName: 'Kwame Test Passenger',
        email: 'passenger@test-phase2-1.ug.edu.gh',
        phoneNumber: '+233240000001',
        password: 'Password123!',
        role: 'passenger',
        approvalStatus: 'approved'
      });

      testDriver = await User.create({
        fullName: 'Kofi Test Driver Approved',
        email: 'driver-approved@test-phase2-1.ug.edu.gh',
        phoneNumber: '+233240000002',
        password: 'Password123!',
        role: 'driver',
        approvalStatus: 'approved',
        driverProfile: {
          vehicle: { model: 'Toyota Vitz', licensePlate: 'GW-1234-24', color: 'Silver', physicalCapacity: 4 },
          capacity: { chosenSharedCapacity: 3 }
        }
      });

      unapprovedDriver = await User.create({
        fullName: 'Ama Test Driver Pending',
        email: 'driver-pending@test-phase2-1.ug.edu.gh',
        phoneNumber: '+233240000003',
        password: 'Password123!',
        role: 'driver',
        approvalStatus: 'pending',
        driverProfile: {
          vehicle: { model: 'Hyundai i10', licensePlate: 'GR-5678-24', color: 'Blue', physicalCapacity: 4 },
          capacity: { chosenSharedCapacity: 3 }
        }
      });

      testAdmin = await User.create({
        fullName: 'Platform Admin',
        email: 'admin@test-phase2-1.ug.edu.gh',
        phoneNumber: '+233240000004',
        password: 'Password123!',
        role: 'admin',
        approvalStatus: 'approved'
      });

    } catch (err) {
      console.warn('[Test Setup] MongoDB connection failed; running unit tests only.', err.message);
      mongoAvailable = false;
    }
  });

  after(async () => {
    try {
      if (mongoAvailable) {
        await User.deleteMany({ email: /@test-phase2-1\.ug\.edu\.gh$/ });
        await RideBooking.deleteMany({ 'pickup.name': /Test Location/ });
        await DriverTrip.deleteMany({});
        await Rating.deleteMany({});
      }
      await mongoose.disconnect();
    } catch (err) {
      // Ignore cleanup error
    }
  });

  // =========================================================================
  // 1. ROUTING & GEODESIC MATH INVARIANTS
  // =========================================================================
  describe('1. Routing Service & Geodesic Distance Calculations', () => {
    it('should correctly calculate geodesic distance between Balme Library and Pent Hostel (~1.37km)', () => {
      const balme = [-0.1870, 5.6508];
      const pent = [-0.1865, 5.6631];
      const distance = calculateGeodesicDistanceMeters(balme, pent);
      
      assert.ok(distance > 1300 && distance < 1450, `Distance should be ~1368m, got ${distance}`);
    });

    it('should return zero meters for identical coordinates', () => {
      const point = [-0.1870, 5.6508];
      const distance = calculateGeodesicDistanceMeters(point, point);
      assert.equal(distance, 0);
    });

    it('should provide fallback routing calculation when OSRM is offline', async () => {
      const balme = [-0.1870, 5.6508];
      const pent = [-0.1865, 5.6631];
      const route = await routingService.getRoute([balme, pent]);

      assert.ok(route.distanceMeters > 1300, 'Calculated distance must exceed 1300m');
      assert.ok(route.durationSeconds > 0, 'Duration seconds must be positive');
      assert.ok(route.calculatedAt instanceof Date, 'calculatedAt must be a Date');
    });
  });

  // =========================================================================
  // 2. STATE MACHINE & STOP CAUSALITY INVARIANTS
  // =========================================================================
  describe('2. Booking State Machine & Stop Ordering Causality', () => {
    it('should allow valid sequential booking transitions', () => {
      assert.doesNotThrow(() => validateBookingTransition('pending', 'driver_assigned'));
      assert.doesNotThrow(() => validateBookingTransition('driver_assigned', 'arrived_at_pickup'));
      assert.doesNotThrow(() => validateBookingTransition('arrived_at_pickup', 'in_progress'));
      assert.doesNotThrow(() => validateBookingTransition('in_progress', 'completed'));
      assert.doesNotThrow(() => validateBookingTransition('pending', 'cancelled'));
    });

    it('should reject invalid illegal state transitions', () => {
      assert.throws(
        () => validateBookingTransition('pending', 'completed'),
        /Invalid state transition from \[pending\] to \[completed\]/
      );
      assert.throws(
        () => validateBookingTransition('completed', 'pending'),
        /Invalid state transition/
      );
      assert.throws(
        () => validateBookingTransition('driver_assigned', 'completed'),
        /Invalid state transition/
      );
    });

    it('should validate valid stop ordering (Pickup before Dropoff)', () => {
      const bookingId = new mongoose.Types.ObjectId();
      const validStops = [
        { bookingId, stopType: 'pickup', sequenceOrder: 1 },
        { bookingId, stopType: 'dropoff', sequenceOrder: 2 }
      ];
      assert.doesNotThrow(() => validateStopOrdering(validStops));
    });

    it('should reject invalid stop ordering (Dropoff before Pickup)', () => {
      const bookingId = new mongoose.Types.ObjectId();
      const invalidStops = [
        { bookingId, stopType: 'dropoff', sequenceOrder: 1 },
        { bookingId, stopType: 'pickup', sequenceOrder: 2 }
      ];
      assert.throws(
        () => validateStopOrdering(invalidStops),
        /Stop ordering causality violation/
      );
    });
  });

  // =========================================================================
  // 3. RBAC & AUTHENTICATION MIDDLEWARE INVARIANTS
  // =========================================================================
  describe('3. RBAC Middleware & Guard Enforcement', () => {
    it('requirePassenger should permit passenger and reject driver', () => {
      const passengerReq = { user: { role: 'passenger' } };
      const driverReq = { user: { role: 'driver' } };
      let calledNext = false;
      const res = {
        status: (code) => ({
          json: (data) => ({ code, data })
        })
      };

      requirePassenger(passengerReq, res, () => { calledNext = true; });
      assert.equal(calledNext, true, 'Passenger should pass requirePassenger');

      let errorResponse = null;
      const fakeRes = {
        status: (code) => ({
          json: (body) => { errorResponse = { code, body }; }
        })
      };
      requirePassenger(driverReq, fakeRes, () => {});
      assert.equal(errorResponse.code, 403, 'Driver must be rejected with 403 by requirePassenger');
    });

    it('requireApprovedDriver should permit approved driver and reject unapproved/pending driver', () => {
      const approvedDriver = { user: { role: 'driver', approvalStatus: 'approved', isApproved: true } };
      const pendingDriver = { user: { role: 'driver', approvalStatus: 'pending', isApproved: false } };
      
      let calledApproved = false;
      const dummyRes = {
        status: (code) => ({ json: (d) => ({ code, d }) })
      };

      requireApprovedDriver(approvedDriver, dummyRes, () => { calledApproved = true; });
      assert.equal(calledApproved, true, 'Approved driver should pass requireApprovedDriver');

      let rejectedResponse = null;
      const rejectRes = {
        status: (code) => ({
          json: (body) => { rejectedResponse = { code, body }; }
        })
      };
      requireApprovedDriver(pendingDriver, rejectRes, () => {});
      assert.equal(rejectedResponse.code, 403, 'Pending driver must be rejected with 403');
      assert.equal(rejectedResponse.body.error.code, 'PENDING_APPROVAL');
    });

    it('requireAdmin should permit admin and reject non-admin', () => {
      const adminReq = { user: { role: 'admin' } };
      const passengerReq = { user: { role: 'passenger' } };

      let adminPassed = false;
      const dummyRes = {
        status: (code) => ({ json: (d) => ({ code, d }) })
      };
      requireAdmin(adminReq, dummyRes, () => { adminPassed = true; });
      assert.equal(adminPassed, true, 'Admin should pass requireAdmin');

      let rejectedResponse = null;
      const rejectRes = {
        status: (code) => ({
          json: (body) => { rejectedResponse = { code, body }; }
        })
      };
      requireAdmin(passengerReq, rejectRes, () => {});
      assert.equal(rejectedResponse.code, 403, 'Passenger must be rejected by requireAdmin');
    });
  });

  // =========================================================================
  // 4. DATABASE INTEGRATION & CONCURRENCY TESTS
  // =========================================================================
  describe('4. Database End-to-End Canonical Invariant Tests', () => {
    it('should seed 15 canonical Campus POIs idempotently with development_estimate provenance', async function() {
      if (!mongoAvailable) return this.skip();

      const seedResult = await seedCampusPOIs();
      assert.equal(seedResult.total, CANONICAL_CAMPUS_POIS.length, `Should have ${CANONICAL_CAMPUS_POIS.length} canonical POIs`);
      
      const balmePOI = await CampusPOI.findOne({ name: 'Balme Library' });
      assert.ok(balmePOI, 'Balme Library POI must exist');
      assert.equal(balmePOI.category, 'library');
      assert.equal(balmePOI.campusZone, 'Central');
      assert.equal(balmePOI.coordinates.type, 'Point');
      assert.equal(balmePOI.coordinateProvenance?.type, 'development_estimate');
    });

    it('should enforce Driver Capacity Invariant: chosenSharedCapacity <= physicalCapacity', async function() {
      if (!mongoAvailable) return this.skip();

      // Attempt creating driver with chosenSharedCapacity (5) > physicalCapacity (4)
      await assert.rejects(
        async () => {
          await User.create({
            fullName: 'Illegal Capacity Driver',
            email: 'illegal-driver@test-phase2-1.ug.edu.gh',
            phoneNumber: '+233240000099',
            password: 'Password123!',
            role: 'driver',
            driverProfile: {
              vehicle: { model: 'Toyota Yaris', licensePlate: 'GW-9999-24', color: 'White', physicalCapacity: 4 },
              capacity: { chosenSharedCapacity: 5 } // VIOLATION
            }
          });
        },
        /cannot exceed physical vehicle capacity/i
      );
    });

    it('should create RideBooking with resolved POI coordinates and fare estimation', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      assert.ok(booking._id, 'Booking ID should be created');
      assert.equal(booking.status, 'pending');
      assert.equal(booking.rideMode, 'solo');
      assert.equal(booking.pickup.name, 'Balme Library');
      assert.equal(booking.dropoff.name, 'Pentagon Hostel');
      assert.ok(booking.fare.totalFare > 0, 'Total fare must be calculated');
      assert.equal(booking.fare.currency, 'GHS');
    });

    it('should create Solo DriverTrip with maxCapacity = 1 and ordered TripStops in transaction', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip, booking: updatedBooking } = await createSoloTrip(testDriver._id, booking._id);

      assert.equal(trip.tripType, 'solo');
      assert.equal(trip.maxCapacity, 1);
      assert.equal(trip.activePassengerCount, 1);
      assert.equal(trip.tripStops.length, 2);
      assert.equal(trip.tripStops[0].stopType, 'pickup');
      assert.equal(trip.tripStops[1].stopType, 'dropoff');
      assert.equal(trip.tripStops[0].sequenceOrder, 1);
      assert.equal(trip.tripStops[1].sequenceOrder, 2);
      assert.equal(updatedBooking.status, 'driver_assigned');
      assert.equal(updatedBooking.driverId.toString(), testDriver._id.toString());
      assert.equal(updatedBooking.driverTripId.toString(), trip._id.toString());
    });

    it('should reject Solo trip creation by unapproved/pending driver', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      await assert.rejects(
        async () => {
          await createSoloTrip(unapprovedDriver._id, booking._id);
        },
        /Driver is not verified or authorized/
      );
    });

    it('should prevent race conditions on atomic booking claim', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      // Two drivers attempt to claim the exact same booking concurrently
      const claim1 = claimBookingAtomic(testDriver._id, booking._id);
      const claim2 = claimBookingAtomic(testDriver._id, booking._id);

      const results = await Promise.allSettled([claim1, claim2]);
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one driver claim must succeed');
      assert.equal(rejected.length, 1, 'Exactly one driver claim must fail with conflict');
      assert.match(rejected[0].reason.message, /BOOKING_ALREADY_CLAIMED/);
    });

    it('should enforce milestone proximity guard: reject milestone when driver is > 75m away', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library', // Coordinates: [-0.1870, 5.6508]
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await createSoloTrip(testDriver._id, booking._id);
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');

      // Driver location far away at Pent Hostel (~1368m away)
      const distantLocation = [-0.1865, 5.6631];

      await assert.rejects(
        async () => {
          await executeTripStop({
            driverId: testDriver._id,
            tripId: trip._id,
            stopId: pickupStop.stopId,
            targetStatus: 'arrived',
            driverLocation: distantLocation,
            enforceProximity: true
          });
        },
        /TOO_FAR_FROM_STOP/
      );
    });

    it('should execute milestone successfully when driver is within proximity radius', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library', // Coordinates: [-0.1870, 5.6508]
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await createSoloTrip(testDriver._id, booking._id);
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');

      // Driver location right at Balme Library
      const closeLocation = [-0.1870, 5.6508];

      const result = await executeTripStop({
        driverId: testDriver._id,
        tripId: trip._id,
        stopId: pickupStop.stopId,
        targetStatus: 'arrived',
        driverLocation: closeLocation,
        enforceProximity: true
      });

      assert.equal(result.booking.status, 'arrived_at_pickup');
      assert.equal(result.stop.status, 'arrived');
    });

    it('should complete trip, submit rating, recalculate driver average, and prevent duplicate rating', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await createSoloTrip(testDriver._id, booking._id);
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');

      // Pickup arrived & completed
      await executeTripStop({
        driverId: testDriver._id,
        tripId: trip._id,
        stopId: pickupStop.stopId,
        targetStatus: 'arrived',
        driverLocation: [-0.1870, 5.6508],
        enforceProximity: true
      });
      await executeTripStop({
        driverId: testDriver._id,
        tripId: trip._id,
        stopId: pickupStop.stopId,
        targetStatus: 'completed',
        driverLocation: [-0.1870, 5.6508],
        enforceProximity: true
      });

      // Dropoff arrived & completed
      await executeTripStop({
        driverId: testDriver._id,
        tripId: trip._id,
        stopId: dropoffStop.stopId,
        targetStatus: 'completed',
        driverLocation: [-0.1865, 5.6631],
        enforceProximity: true
      });

      // Verify booking is completed
      const completedBooking = await RideBooking.findById(booking._id);
      assert.equal(completedBooking.status, 'completed');
      assert.equal(completedBooking.fare.paymentStatus, 'paid');

      // Submit rating
      const rating = await submitRating(testPassenger._id, {
        bookingId: completedBooking._id,
        score: 5,
        comment: 'Excellent, smooth campus ride!',
        tags: ['Punctual', 'Polite']
      });

      assert.ok(rating._id, 'Rating should be saved');
      assert.equal(rating.score, 5);

      // Verify driver aggregate rating updated
      const updatedDriver = await User.findById(testDriver._id);
      assert.equal(updatedDriver.ratingAverage, 5.0);
      assert.equal(updatedDriver.ratingCount, 1);

      // Verify duplicate rating rejection
      await assert.rejects(
        async () => {
          await submitRating(testPassenger._id, {
            bookingId: completedBooking._id,
            score: 4,
            comment: 'Second rating attempt'
          });
        },
        /RATING_ALREADY_EXISTS/
      );
    });

    it('should allow passenger to cancel a pending booking and reject cancellation on completed booking', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const cancelled = await cancelBooking(booking._id, testPassenger._id, 'passenger', 'Changed my mind');
      assert.equal(cancelled.status, 'cancelled');
      assert.equal(cancelled.cancellation.cancelledBy.toString(), testPassenger._id.toString());
      assert.equal(cancelled.cancellation.cancelledByRole, 'passenger');

      // Attempting to cancel already cancelled booking should fail
      await assert.rejects(
        async () => {
          await cancelBooking(booking._id, testPassenger._id, 'passenger', 'Second cancel attempt');
        },
        /Cannot cancel a booking that is already in terminal state/
      );
    });

    it('should reject repeated execution on already terminal stop and prevent double-decrement of activePassengerCount', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(testPassenger._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await createSoloTrip(testDriver._id, booking._id);
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');

      // Pickup arrival and completion
      await executeTripStop({
        driverId: testDriver._id,
        tripId: trip._id,
        stopId: pickupStop.stopId,
        targetStatus: 'arrived',
        enforceProximity: false
      });
      await executeTripStop({
        driverId: testDriver._id,
        tripId: trip._id,
        stopId: pickupStop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      // First dropoff completion -> activePassengerCount decrements 1 -> 0
      const firstResult = await executeTripStop({
        driverId: testDriver._id,
        tripId: trip._id,
        stopId: dropoffStop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      assert.equal(firstResult.trip.activePassengerCount, 0, 'Active passenger count must be 0');
      assert.equal(firstResult.stop.status, 'completed');

      // Second dropoff completion attempt (DUPLICATE / REPEAT CALL) -> MUST BE REJECTED
      await assert.rejects(
        async () => {
          await executeTripStop({
            driverId: testDriver._id,
            tripId: trip._id,
            stopId: dropoffStop.stopId,
            targetStatus: 'completed',
            enforceProximity: false
          });
        },
        /STOP_ALREADY_TERMINAL/
      );

      // Verify activePassengerCount in database remained strictly 0 and did not corrupt
      const persistedTrip = await DriverTrip.findById(trip._id);
      assert.equal(persistedTrip.activePassengerCount, 0, 'Active passenger count must remain strictly 0');
      assert.equal(persistedTrip.status, 'completed');
    });
  });

  // =========================================================================
  // 5. JWT TOKEN INTEGRITY & AUTHORIZATION HARDENING
  // =========================================================================
  describe('5. JWT Authentication & Security Hardening', () => {
    const secret = process.env.JWT_SECRET || 'campusride_super_secret_key_2026';

    it('should reject expired JWT token with 401', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const expiredToken = jwt.sign(
        { id: new mongoose.Types.ObjectId() },
        secret,
        { expiresIn: '-1s' }
      );

      const req = { headers: { authorization: `Bearer ${expiredToken}` } };
      let errorResponse = null;
      const res = {
        status: (code) => ({
          json: (body) => { errorResponse = { code, body }; }
        })
      };

      await protect(req, res, () => {});
      assert.equal(errorResponse.code, 401, 'Expired token must return 401');
      assert.equal(errorResponse.body.error.code, 'TOKEN_EXPIRED');
    });

    it('should reject tampered JWT token with 401', async () => {
      const req = { headers: { authorization: 'Bearer invalid.tampered.signature' } };
      let errorResponse = null;
      const res = {
        status: (code) => ({
          json: (body) => { errorResponse = { code, body }; }
        })
      };

      await protect(req, res, () => {});
      assert.equal(errorResponse.code, 401, 'Tampered token must return 401');
      assert.equal(errorResponse.body.error.code, 'TOKEN_INVALID');
    });

    it('should reject missing authorization header with 401', async () => {
      const req = { headers: {} };
      let errorResponse = null;
      const res = {
        status: (code) => ({
          json: (body) => { errorResponse = { code, body }; }
        })
      };

      await protect(req, res, () => {});
      assert.equal(errorResponse.code, 401, 'Missing token must return 401');
      assert.equal(errorResponse.body.error.code, 'AUTH_NO_TOKEN');
    });
  });

  // =========================================================================
  // 6. CROSS-ACTOR OWNERSHIP & ISOLATION GUARDS
  // =========================================================================
  describe('6. Cross-Actor Ownership & Isolation Invariants', () => {
    let passengerA, passengerB, driverA, driverB;

    before(async function() {
      if (!mongoAvailable) return;

      passengerA = await User.create({
        fullName: 'Passenger A',
        email: 'passenger-a@test-phase2-1.ug.edu.gh',
        phoneNumber: '+233240000010',
        password: 'Password123!',
        role: 'passenger',
        approvalStatus: 'approved'
      });
      passengerB = await User.create({
        fullName: 'Passenger B',
        email: 'passenger-b@test-phase2-1.ug.edu.gh',
        phoneNumber: '+233240000011',
        password: 'Password123!',
        role: 'passenger',
        approvalStatus: 'approved'
      });
      driverA = await User.create({
        fullName: 'Driver A',
        email: 'driver-a@test-phase2-1.ug.edu.gh',
        phoneNumber: '+233240000012',
        password: 'Password123!',
        role: 'driver',
        approvalStatus: 'approved'
      });
      driverB = await User.create({
        fullName: 'Driver B',
        email: 'driver-b@test-phase2-1.ug.edu.gh',
        phoneNumber: '+233240000013',
        password: 'Password123!',
        role: 'driver',
        approvalStatus: 'approved'
      });
    });

    it('should reject rating submission by Passenger B for Passenger A booking', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(passengerA._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await createSoloTrip(driverA._id, booking._id);
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');

      await executeTripStop({ driverId: driverA._id, tripId: trip._id, stopId: pickupStop.stopId, targetStatus: 'arrived', enforceProximity: false });
      await executeTripStop({ driverId: driverA._id, tripId: trip._id, stopId: pickupStop.stopId, targetStatus: 'completed', enforceProximity: false });
      await executeTripStop({ driverId: driverA._id, tripId: trip._id, stopId: dropoffStop.stopId, targetStatus: 'completed', enforceProximity: false });

      // Passenger B attempts to rate Passenger A's completed booking
      await assert.rejects(
        async () => {
          await submitRating(passengerB._id, {
            bookingId: booking._id,
            score: 5,
            comment: 'Unauthorized rating attempt'
          });
        },
        /FORBIDDEN: Only the passenger who took the ride can submit a rating/
      );
    });

    it('should prevent Driver B from executing milestones on Driver A trip', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(passengerA._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await createSoloTrip(driverA._id, booking._id);
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');

      await assert.rejects(
        async () => {
          await executeTripStop({
            driverId: driverB._id, // Unauthorized driver
            tripId: trip._id,
            stopId: pickupStop.stopId,
            targetStatus: 'arrived',
            enforceProximity: false
          });
        },
        /FORBIDDEN: Driver does not own this trip/
      );
    });
  });

  // =========================================================================
  // 7. COORDINATE BOUNDARY SCHEMA VALIDATION
  // =========================================================================
  describe('7. Coordinate Boundary Schema Invariants', () => {
    it('should reject out-of-bounds latitude (> 90 or < -90) in RideBooking schema', async () => {
      const invalidBooking = new RideBooking({
        passengerId: new mongoose.Types.ObjectId(),
        rideMode: 'solo',
        status: 'pending',
        pickup: {
          name: 'Invalid Lat Location',
          coordinates: { type: 'Point', coordinates: [-0.1870, 95.0] } // Lat > 90
        },
        dropoff: {
          name: 'Valid Location',
          coordinates: { type: 'Point', coordinates: [-0.1865, 5.6631] }
        },
        fare: { totalFare: 10 }
      });

      const err = invalidBooking.validateSync();
      assert.ok(err, 'Validation error must be returned for latitude > 90');
      assert.match(err.message, /Location coordinates must be valid GeoJSON/);
    });

    it('should reject out-of-bounds longitude (> 180 or < -180) in RideBooking schema', async () => {
      const invalidBooking = new RideBooking({
        passengerId: new mongoose.Types.ObjectId(),
        rideMode: 'solo',
        status: 'pending',
        pickup: {
          name: 'Invalid Lng Location',
          coordinates: { type: 'Point', coordinates: [185.0, 5.6508] } // Lng > 180
        },
        dropoff: {
          name: 'Valid Location',
          coordinates: { type: 'Point', coordinates: [-0.1865, 5.6631] }
        },
        fare: { totalFare: 10 }
      });

      const err = invalidBooking.validateSync();
      assert.ok(err, 'Validation error must be returned for longitude > 180');
      assert.match(err.message, /Location coordinates must be valid GeoJSON/);
    });
  });

  // =========================================================================
  // 8. GOOGLE AUTH, PRICING & POI PROVENANCE INVARIANTS
  // =========================================================================
  describe('8. Google Auth, Pricing & POI Provenance Invariants', () => {
    it('should return HTTP 501 Not Implemented for googleAuth scaffold endpoint', async () => {
      const { googleAuth } = await import('../src/controllers/authController.js');
      let response = null;
      const res = {
        status: (code) => ({
          json: (body) => { response = { code, body }; }
        })
      };

      await googleAuth({}, res);
      assert.equal(response.code, 501, 'googleAuth must return HTTP 501');
      assert.equal(response.body.error.code, 'GOOGLE_AUTH_NOT_CONFIGURED');
    });

    it('should calculate flexible estimated fare without hardcoded shared discounts', () => {
      const soloFare = pricingService.calculateEstimatedFare({
        distanceMeters: 2000,
        rideMode: 'solo'
      });
      // 8.0 base + (2.0 km * 3.5) = 15.0
      assert.equal(soloFare.totalFare, 15.0);
      assert.equal(soloFare.discountAmount, 0);

      const sharedFare = pricingService.calculateEstimatedFare({
        distanceMeters: 2000,
        rideMode: 'shared',
        discountAmount: 2.0 // explicit configurable promo discount
      });
      assert.equal(sharedFare.totalFare, 13.0);
      assert.equal(sharedFare.discountAmount, 2.0);
    });

    it('should verify all seeded POIs have coordinateProvenance = development_estimate', async function() {
      if (!mongoAvailable) return this.skip();

      const pois = await CampusPOI.find({ isActive: true });
      assert.ok(pois.length >= 15, 'All 15 POIs must be present');
      for (const poi of pois) {
        assert.equal(
          poi.coordinateProvenance?.type, 
          'development_estimate', 
          `POI ${poi.name} must be explicitly marked as development_estimate`
        );
      }
    });
  });

});
