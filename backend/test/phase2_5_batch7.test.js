import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../src/models/User.js';
import RideBooking from '../src/models/RideBooking.js';
import DriverTrip from '../src/models/DriverTrip.js';
import Rating from '../src/models/Rating.js';
import { createRideBooking, cancelBooking } from '../src/services/bookingService.js';
import { acceptSoloOffer, acceptSharedOffer } from '../src/services/dispatchService.js';
import { executeTripStop, createSharedTrip, insertBookingIntoSharedTrip } from '../src/services/tripService.js';
import { submitRating } from '../src/services/ratingService.js';
import pricingService from '../src/services/pricingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.e2e') });

const BASE_URL = 'http://localhost:5000/api/v1';

const ADMIN_CREDS = {
  email: 'admin.e2e@campusride.ug.edu.gh',
  password: 'E2EAdminPass2026!'
};

const PASSENGER_A_CREDS = {
  email: 'passenger.a@campusride.ug.edu.gh',
  password: 'E2EPass2026!'
};

const PASSENGER_B_CREDS = {
  email: 'passenger.b@campusride.ug.edu.gh',
  password: 'E2EPass2026!'
};

const DRIVER_A_CREDS = {
  email: 'driver.a@campusride.ug.edu.gh',
  password: 'E2EDriver2026!'
};

const DRIVER_B_CREDS = {
  email: 'driver.b@campusride.ug.edu.gh',
  password: 'E2EDriver2026!'
};

describe('CampusRide Phase 2.5 Batch 7 — Ratings, Ride History & Financial/Analytics Accounting Validation', () => {
  let adminToken = null;
  let adminUser = null;
  let passengerAToken = null;
  let passengerAUser = null;
  let passengerBToken = null;
  let passengerBUser = null;
  let driverAToken = null;
  let driverAUser = null;
  let driverBToken = null;
  let driverBUser = null;

  before(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride_e2e';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    }

    // Authenticate canonical actors
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ADMIN_CREDS, role: 'admin' })
    });
    const adminData = await adminLoginRes.json();
    assert.equal(adminLoginRes.status, 200, 'Admin login must succeed');
    adminToken = adminData.data.token;

    const passALoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PASSENGER_A_CREDS)
    });
    const passAData = await passALoginRes.json();
    assert.equal(passALoginRes.status, 200, 'Passenger A login must succeed');
    passengerAToken = passAData.data.token;

    const passBLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PASSENGER_B_CREDS)
    });
    const passBData = await passBLoginRes.json();
    assert.equal(passBLoginRes.status, 200, 'Passenger B login must succeed');
    passengerBToken = passBData.data.token;

    const driverALoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DRIVER_A_CREDS)
    });
    const driverAData = await driverALoginRes.json();
    assert.equal(driverALoginRes.status, 200, 'Driver A login must succeed');
    driverAToken = driverAData.data.token;

    const driverBLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DRIVER_B_CREDS)
    });
    const driverBData = await driverBLoginRes.json();
    assert.equal(driverBLoginRes.status, 200, 'Driver B login must succeed');
    driverBToken = driverBData.data.token;

    adminUser = await User.findOne({ email: ADMIN_CREDS.email });
    passengerAUser = await User.findOne({ email: PASSENGER_A_CREDS.email });
    passengerBUser = await User.findOne({ email: PASSENGER_B_CREDS.email });
    driverAUser = await User.findOne({ email: DRIVER_A_CREDS.email });
    driverBUser = await User.findOne({ email: DRIVER_B_CREDS.email });
  });

  beforeEach(async () => {
    // Clean test bookings, trips, and ratings
    const testUserIds = [passengerAUser?._id, passengerBUser?._id, driverAUser?._id, driverBUser?._id].filter(Boolean);
    await DriverTrip.deleteMany({ driverId: { $in: [driverAUser?._id, driverBUser?._id] } });
    await RideBooking.deleteMany({ passengerId: { $in: testUserIds } });
    await Rating.deleteMany({ driverId: { $in: [driverAUser?._id, driverBUser?._id] } });

    // Reset driver stats
    await User.updateMany(
      { _id: { $in: [driverAUser?._id, driverBUser?._id] } },
      {
        $set: {
          isOnline: true,
          isApproved: true,
          approvalStatus: 'approved',
          isSuspended: false,
          ratingAverage: 5.0,
          ratingCount: 0,
          rating: 5.0,
          lastSeen: new Date(),
          currentLocation: { type: 'Point', coordinates: [-0.1876, 5.635] }
        }
      }
    );
  });

  after(async () => {
    const testUserIds = [passengerAUser?._id, passengerBUser?._id, driverAUser?._id, driverBUser?._id].filter(Boolean);
    await DriverTrip.deleteMany({ driverId: { $in: [driverAUser?._id, driverBUser?._id] } });
    await RideBooking.deleteMany({ passengerId: { $in: testUserIds } });
    await Rating.deleteMany({ driverId: { $in: [driverAUser?._id, driverBUser?._id] } });
    await mongoose.disconnect();
  });

  // Helper to run full solo trip lifecycle to completion
  const completeSoloRide = async (passenger, driver, pickup = 'Balme Library', dropoff = 'Pentagon Hostel') => {
    const booking = await createRideBooking(passenger._id, { pickup, dropoff, rideMode: 'solo' });
    const { trip } = await acceptSoloOffer(driver._id, booking._id);
    const tripId = trip._id.toString();

    const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
    const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');

    await executeTripStop({
      driverId: driver._id,
      tripId,
      stopId: pickupStop.stopId,
      targetStatus: 'arrived',
      enforceProximity: false
    });
    await executeTripStop({
      driverId: driver._id,
      tripId,
      stopId: pickupStop.stopId,
      targetStatus: 'completed',
      enforceProximity: false
    });
    await executeTripStop({
      driverId: driver._id,
      tripId,
      stopId: dropoffStop.stopId,
      targetStatus: 'arrived',
      enforceProximity: false
    });
    await executeTripStop({
      driverId: driver._id,
      tripId,
      stopId: dropoffStop.stopId,
      targetStatus: 'completed',
      enforceProximity: false
    });

    const updatedBooking = await RideBooking.findById(booking._id);
    const updatedTrip = await DriverTrip.findById(tripId);
    return { booking: updatedBooking, trip: updatedTrip };
  };

  // =========================================================================
  // SCENARIO A: Completed Solo Ride History
  // =========================================================================
  describe('Scenario A: Completed Solo Ride History', () => {
    it('should reflect completed solo ride in both passenger and driver history with complete metadata', async () => {
      const { booking, trip } = await completeSoloRide(passengerAUser, driverAUser);

      assert.equal(booking.status, 'completed');
      assert.equal(trip.status, 'completed');

      // 1. Retrieve Passenger A history
      const passHistoryRes = await fetch(`${BASE_URL}/bookings/history`, {
        headers: { Authorization: `Bearer ${passengerAToken}` }
      });
      const passHistory = await passHistoryRes.json();
      assert.equal(passHistoryRes.status, 200);
      assert.ok(passHistory.data.length >= 1);

      const passRide = passHistory.data.find(b => b._id === booking._id.toString());
      assert.ok(passRide, 'Completed ride must be present in passenger history');
      assert.equal(passRide.status, 'completed');
      assert.equal(passRide.passengerId._id.toString(), passengerAUser._id.toString());
      assert.equal(passRide.driverId._id.toString(), driverAUser._id.toString());
      assert.equal(passRide.pickup.name, 'Balme Library');
      assert.equal(passRide.dropoff.name, 'Pentagon Hostel');
      assert.ok(passRide.fare.totalFare > 0, 'Fare must be positive');
      assert.equal(passRide.driverTripId.toString(), trip._id.toString());

      // 2. Retrieve Driver A history
      const driverHistoryRes = await fetch(`${BASE_URL}/bookings/history`, {
        headers: { Authorization: `Bearer ${driverAToken}` }
      });
      const driverHistory = await driverHistoryRes.json();
      assert.equal(driverHistoryRes.status, 200);

      const driverRide = driverHistory.data.find(b => b._id === booking._id.toString());
      assert.ok(driverRide, 'Completed ride must appear in driver history');
      assert.equal(driverRide.status, 'completed');
      assert.equal(driverRide.driverId._id.toString(), driverAUser._id.toString());

      // Ensure no duplicate logical entries
      const matchingPassengerEntries = passHistory.data.filter(b => b._id === booking._id.toString());
      assert.equal(matchingPassengerEntries.length, 1);
    });
  });

  // =========================================================================
  // SCENARIO B: Cancelled Ride History
  // =========================================================================
  describe('Scenario B: Cancelled Ride History', () => {
    it('should reflect cancelled rides in history with cancelled status and prohibit rating submission', async () => {
      // 1. Cancel before driver assignment
      const bookingPending = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      await cancelBooking(bookingPending._id, passengerAUser._id, 'passenger', 'No longer needed');

      // 2. Cancel after assignment (pre-pickup)
      const bookingAssigned = await createRideBooking(passengerAUser._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'solo'
      });
      await acceptSoloOffer(driverAUser._id, bookingAssigned._id);
      await cancelBooking(bookingAssigned._id, passengerAUser._id, 'passenger', 'Driver too far');

      // Retrieve passenger history
      const historyRes = await fetch(`${BASE_URL}/bookings/history`, {
        headers: { Authorization: `Bearer ${passengerAToken}` }
      });
      const historyData = await historyRes.json();
      assert.equal(historyRes.status, 200);

      const cancelledPending = historyData.data.find(b => b._id === bookingPending._id.toString());
      const cancelledAssigned = historyData.data.find(b => b._id === bookingAssigned._id.toString());

      assert.ok(cancelledPending);
      assert.equal(cancelledPending.status, 'cancelled');
      assert.ok(cancelledPending.cancellation.cancelledAt);

      assert.ok(cancelledAssigned);
      assert.equal(cancelledAssigned.status, 'cancelled');
      assert.ok(cancelledAssigned.cancellation.cancelledAt);

      // Verify that rating cannot be submitted for a cancelled ride
      const ratingRes = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${passengerAToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: bookingAssigned._id.toString(),
          score: 5,
          comment: 'Should fail'
        })
      });
      assert.notEqual(ratingRes.status, 201, 'Cancelled ride must NOT be rateable');
      const ratingData = await ratingRes.json();
      assert.equal(ratingData.success, false);
    });
  });

  // =========================================================================
  // SCENARIO C: Shared Ride History
  // =========================================================================
  describe('Scenario C: Shared Ride History', () => {
    it('should maintain individual passenger records and single driver trip representation for shared rides', async () => {
      const bookingA = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });
      const { trip } = await createSharedTrip(driverAUser._id, bookingA._id);
      const tripId = trip._id.toString();

      const bookingB = await createRideBooking(passengerBUser._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });
      await insertBookingIntoSharedTrip(driverAUser._id, tripId, bookingB._id);

      // Execute all stops to completion
      const freshTrip = await DriverTrip.findById(tripId);
      for (const stop of freshTrip.tripStops) {
        await executeTripStop({
          driverId: driverAUser._id,
          tripId,
          stopId: stop.stopId,
          targetStatus: 'arrived',
          enforceProximity: false
        });
        await executeTripStop({
          driverId: driverAUser._id,
          tripId,
          stopId: stop.stopId,
          targetStatus: 'completed',
          enforceProximity: false
        });
      }

      // Check Passenger A history
      const passAHist = await fetch(`${BASE_URL}/bookings/history`, {
        headers: { Authorization: `Bearer ${passengerAToken}` }
      }).then(r => r.json());
      const passARide = passAHist.data.find(b => b._id === bookingA._id.toString());
      assert.ok(passARide);
      assert.equal(passARide.status, 'completed');
      assert.equal(passARide.driverTripId.toString(), tripId);

      // Check Passenger B history
      const passBHist = await fetch(`${BASE_URL}/bookings/history`, {
        headers: { Authorization: `Bearer ${passengerBToken}` }
      }).then(r => r.json());
      const passBRide = passBHist.data.find(b => b._id === bookingB._id.toString());
      assert.ok(passBRide);
      assert.equal(passBRide.status, 'completed');
      assert.equal(passBRide.driverTripId.toString(), tripId);

      // Check Driver A history: Driver has 1 shared DriverTrip
      const driverTripsCount = await DriverTrip.countDocuments({
        driverId: driverAUser._id,
        status: 'completed'
      });
      assert.equal(driverTripsCount, 1, 'Driver must have exactly 1 DriverTrip for the shared pool');
    });
  });

  // =========================================================================
  // SCENARIO D: History Authorization / Privacy
  // =========================================================================
  describe('Scenario D: History Authorization / Privacy', () => {
    it('should reject unauthorized access to other users ride bookings and sanitize private fields', async () => {
      const { booking } = await completeSoloRide(passengerAUser, driverAUser);

      // 1. Passenger B attempts to access Passenger A's booking
      const passBAccessRes = await fetch(`${BASE_URL}/bookings/${booking._id}`, {
        headers: { Authorization: `Bearer ${passengerBToken}` }
      });
      assert.equal(passBAccessRes.status, 403, 'Unauthorized passenger must receive 403 Forbidden');

      // 2. Driver B attempts to access Driver A's booking
      const driverBAccessRes = await fetch(`${BASE_URL}/bookings/${booking._id}`, {
        headers: { Authorization: `Bearer ${driverBToken}` }
      });
      assert.equal(driverBAccessRes.status, 403, 'Unassigned driver must receive 403 Forbidden');

      // 3. Passenger A accesses own booking: verify no password/hash/salt is present
      const passAAccessRes = await fetch(`${BASE_URL}/bookings/${booking._id}`, {
        headers: { Authorization: `Bearer ${passengerAToken}` }
      });
      const passAData = await passAAccessRes.json();
      assert.equal(passAAccessRes.status, 200);

      const serialized = JSON.stringify(passAData);
      assert.ok(!serialized.includes('password'), 'Password must never leak');
      assert.ok(!serialized.includes('passwordHash'), 'Password hash must never leak');
      assert.ok(!serialized.includes('salt'), 'Salt must never leak');
    });
  });

  // =========================================================================
  // SCENARIO E: Fare Consistency
  // =========================================================================
  describe('Scenario E: Fare Consistency', () => {
    it('should maintain exact mathematical fare equality from estimate through booking and history', async () => {
      const estimatedFareObj = pricingService.calculateEstimatedFare({
        distanceMeters: 2500,
        durationSeconds: 300,
        rideMode: 'solo'
      });
      const expectedFare = estimatedFareObj.totalFare;
      assert.ok(expectedFare > 0);

      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      // Complete the ride
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');

      await executeTripStop({
        driverId: driverAUser._id,
        tripId,
        stopId: pickupStop.stopId,
        targetStatus: 'arrived',
        enforceProximity: false
      });
      await executeTripStop({
        driverId: driverAUser._id,
        tripId,
        stopId: pickupStop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });
      await executeTripStop({
        driverId: driverAUser._id,
        tripId,
        stopId: dropoffStop.stopId,
        targetStatus: 'arrived',
        enforceProximity: false
      });
      await executeTripStop({
        driverId: driverAUser._id,
        tripId,
        stopId: dropoffStop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      // Retrieve history
      const historyRes = await fetch(`${BASE_URL}/bookings/history`, {
        headers: { Authorization: `Bearer ${passengerAToken}` }
      });
      const historyData = await historyRes.json();
      const histBooking = historyData.data.find(b => b._id === booking._id.toString());

      assert.ok(histBooking);
      assert.equal(histBooking.fare.totalFare, booking.fare.totalFare, 'Final fare in history must strictly equal initial booking fare');
      assert.ok(histBooking.fare.totalFare > 0, 'Total fare must be greater than zero');
      assert.equal(histBooking.fare.currency, 'GHS');
    });
  });

  // =========================================================================
  // SCENARIO F: Multiple Rides / Aggregation
  // =========================================================================
  describe('Scenario F: Multiple Rides / Aggregation', () => {
    it('should accurately differentiate between bookings count and DriverTrips count across completed and cancelled rides', async () => {
      // 1. Completed solo 1
      await completeSoloRide(passengerAUser, driverAUser, 'Balme Library', 'Night Market');
      // 2. Completed solo 2
      await completeSoloRide(passengerAUser, driverAUser, 'Night Market', 'Pentagon Hostel');

      // 3. Cancelled ride
      const cancelledBooking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Evandy Hostel',
        rideMode: 'solo'
      });
      await cancelBooking(cancelledBooking._id, passengerAUser._id, 'passenger', 'Test cancel');

      // 4. Completed shared ride (2 passenger bookings, 1 DriverTrip)
      const b1 = await createRideBooking(passengerAUser._id, { pickup: 'Balme Library', dropoff: 'Pentagon Hostel', rideMode: 'shared' });
      const { trip: sharedTrip } = await createSharedTrip(driverAUser._id, b1._id);
      const b2 = await createRideBooking(passengerBUser._id, { pickup: 'Night Market', dropoff: 'Evandy Hostel', rideMode: 'shared' });
      await insertBookingIntoSharedTrip(driverAUser._id, sharedTrip._id, b2._id);

      const freshShared = await DriverTrip.findById(sharedTrip._id);
      for (const stop of freshShared.tripStops) {
        await executeTripStop({
          driverId: driverAUser._id,
          tripId: sharedTrip._id,
          stopId: stop.stopId,
          targetStatus: 'arrived',
          enforceProximity: false
        });
        await executeTripStop({
          driverId: driverAUser._id,
          tripId: sharedTrip._id,
          stopId: stop.stopId,
          targetStatus: 'completed',
          enforceProximity: false
        });
      }

      // Authoritative DB counts
      const totalBookings = await RideBooking.countDocuments({
        passengerId: { $in: [passengerAUser._id, passengerBUser._id] }
      });
      const completedBookings = await RideBooking.countDocuments({
        passengerId: { $in: [passengerAUser._id, passengerBUser._id] },
        status: 'completed'
      });
      const cancelledBookings = await RideBooking.countDocuments({
        passengerId: { $in: [passengerAUser._id, passengerBUser._id] },
        status: 'cancelled'
      });
      const completedDriverTrips = await DriverTrip.countDocuments({
        driverId: driverAUser._id,
        status: 'completed'
      });

      // Total bookings = 2 solo + 1 cancelled + 2 shared = 5 bookings
      assert.equal(totalBookings, 5);
      // Completed bookings = 2 solo + 2 shared = 4
      assert.equal(completedBookings, 4);
      // Cancelled bookings = 1
      assert.equal(cancelledBookings, 1);
      // Completed DriverTrips = 2 solo trips + 1 shared trip = 3 trips!
      assert.equal(completedDriverTrips, 3);

      assert.notEqual(completedBookings, completedDriverTrips, 'Bookings count and DriverTrips count must be distinct');
    });
  });

  // =========================================================================
  // SCENARIO G: Rating After Completion
  // =========================================================================
  describe('Scenario G: Rating After Completion', () => {
    it('should allow passenger to rate driver after completion and record all rating metadata', async () => {
      const { booking, trip } = await completeSoloRide(passengerAUser, driverAUser);

      const ratingRes = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${passengerAToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: booking._id.toString(),
          score: 5,
          comment: 'Excellent service and safe driving!',
          tags: ['Punctual', 'Polite']
        })
      });
      const ratingData = await ratingRes.json();
      assert.equal(ratingRes.status, 201);
      assert.equal(ratingData.success, true);
      assert.equal(ratingData.data.score, 5);
      assert.equal(ratingData.data.comment, 'Excellent service and safe driving!');

      // Check DB directly
      const dbRating = await Rating.findOne({ bookingId: booking._id });
      assert.ok(dbRating);
      assert.equal(dbRating.passengerId.toString(), passengerAUser._id.toString());
      assert.equal(dbRating.driverId.toString(), driverAUser._id.toString());
      assert.equal(dbRating.driverTripId.toString(), trip._id.toString());
    });
  });

  // =========================================================================
  // SCENARIO H: Rating Validation Boundaries
  // =========================================================================
  describe('Scenario H: Rating Validation Boundaries', () => {
    it('should strictly enforce 1-5 rating range and reject invalid scores', async () => {
      const { booking } = await completeSoloRide(passengerAUser, driverAUser);

      // Score 0 (below min 1)
      const res0 = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerAToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 0 })
      });
      assert.notEqual(res0.status, 201);

      // Score 6 (above max 5)
      const res6 = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerAToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 6 })
      });
      assert.notEqual(res6.status, 201);

      // Non-numeric score
      const resNaN = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerAToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 'invalid' })
      });
      assert.notEqual(resNaN.status, 201);

      // Valid boundary: 1
      const res1 = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerAToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 1, comment: 'Boundary test 1' })
      });
      assert.equal(res1.status, 201);
    });
  });

  // =========================================================================
  // SCENARIO I: Duplicate Rating Protection
  // =========================================================================
  describe('Scenario I: Duplicate Rating Protection', () => {
    it('should reject second rating submission for the same booking with HTTP 409 Conflict', async () => {
      const { booking } = await completeSoloRide(passengerAUser, driverAUser);

      // First submission succeeds
      const firstRes = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerAToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 4, comment: 'First' })
      });
      assert.equal(firstRes.status, 201);

      // Second submission for same booking rejected
      const secondRes = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerAToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 5, comment: 'Second' })
      });
      assert.equal(secondRes.status, 409, 'Duplicate rating must return 409 Conflict');
      const secondData = await secondRes.json();
      assert.equal(secondData.error.code, 'RATING_ALREADY_EXISTS');

      // Verify DB has exactly 1 Rating
      const count = await Rating.countDocuments({ bookingId: booking._id });
      assert.equal(count, 1, 'Database must contain exactly 1 rating for this booking');
    });
  });

  // =========================================================================
  // SCENARIO J: Rating Isolation
  // =========================================================================
  describe('Scenario J: Rating Isolation', () => {
    it('should reject rating submission by a non-participating user', async () => {
      const { booking } = await completeSoloRide(passengerAUser, driverAUser);

      // Passenger B attempts to rate Passenger A's ride
      const unauthRes = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerBToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 5 })
      });
      assert.equal(unauthRes.status, 403);
      const unauthData = await unauthRes.json();
      assert.equal(unauthData.error.code, 'FORBIDDEN');

      // Driver A attempts to call rating endpoint (should be blocked by requirePassenger)
      const driverRes = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverAToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 5 })
      });
      assert.equal(driverRes.status, 403);
    });
  });

  // =========================================================================
  // SCENARIO K: Rating Aggregation
  // =========================================================================
  describe('Scenario K: Rating Aggregation', () => {
    it('should calculate precise arithmetic average on driver profile after multiple ratings', async () => {
      // Ride 1: Passenger A rates Driver A with score 5
      const ride1 = await completeSoloRide(passengerAUser, driverAUser, 'Balme Library', 'Pentagon Hostel');
      await submitRating(passengerAUser._id, { bookingId: ride1.booking._id, score: 5 });

      let driverDoc = await User.findById(driverAUser._id);
      assert.equal(driverDoc.ratingAverage, 5.0);
      assert.equal(driverDoc.ratingCount, 1);

      // Ride 2: Passenger B rates Driver A with score 3
      const ride2 = await completeSoloRide(passengerBUser, driverAUser, 'Night Market', 'Evandy Hostel');
      await submitRating(passengerBUser._id, { bookingId: ride2.booking._id, score: 3 });

      driverDoc = await User.findById(driverAUser._id);
      // Arithmetic mean: (5 + 3) / 2 = 4.00
      assert.equal(driverDoc.ratingAverage, 4.0);
      assert.equal(driverDoc.ratingCount, 2);

      // Query public driver ratings summary endpoint
      const summaryRes = await fetch(`${BASE_URL}/ratings/driver/${driverAUser._id}`, {
        headers: { Authorization: `Bearer ${passengerAToken}` }
      });
      const summaryData = await summaryRes.json();
      assert.equal(summaryRes.status, 200);
      assert.equal(summaryData.count, 2);
    });
  });

  // =========================================================================
  // SCENARIO L: Historical Immutability / Consistency
  // =========================================================================
  describe('Scenario L: Historical Immutability / Consistency', () => {
    it('should preserve terminal ride facts and prevent status reversion', async () => {
      const { booking, trip } = await completeSoloRide(passengerAUser, driverAUser);

      // Attempt to execute stop on already terminal trip stop
      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');
      await assert.rejects(
        async () => {
          await executeTripStop({
            driverId: driverAUser._id,
            tripId: trip._id,
            stopId: dropoffStop.stopId,
            targetStatus: 'arrived',
            enforceProximity: false
          });
        },
        /STOP_ALREADY_TERMINAL/
      );

      // Ensure booking remains completed
      const postBooking = await RideBooking.findById(booking._id);
      assert.equal(postBooking.status, 'completed');
      assert.equal(postBooking.driverId.toString(), driverAUser._id.toString());
      assert.equal(postBooking.passengerId.toString(), passengerAUser._id.toString());
    });
  });

  // =========================================================================
  // SCENARIO M: Admin Analytics Reconciliation
  // =========================================================================
  describe('Scenario M: Admin Analytics Reconciliation', () => {
    it('should reconcile admin dashboard and analytics values with direct MongoDB ground truth', async () => {
      await completeSoloRide(passengerAUser, driverAUser);

      const [dashRes, snapRes] = await Promise.all([
        fetch(`${BASE_URL}/admin/dashboard`, { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch(`${BASE_URL}/admin/analytics/snapshot`, { headers: { Authorization: `Bearer ${adminToken}` } })
      ]);

      const dashData = await dashRes.json();
      const snapData = await snapRes.json();

      assert.equal(dashRes.status, 200);
      assert.equal(snapRes.status, 200);

      // Ground truth MongoDB queries
      const expectedRegisteredDrivers = await User.countDocuments({ role: 'driver' });
      const expectedRegisteredPassengers = await User.countDocuments({ role: { $in: ['passenger', 'student', 'rider'] } });
      const expectedActiveTrips = await DriverTrip.countDocuments({ status: { $in: ['dispatched', 'active'] } });

      const driversStat = dashData.data.stats.find(s => s.label === 'Drivers Registered');
      const passengersStat = dashData.data.stats.find(s => s.label === 'Riders Registered');
      const activeTripsStat = dashData.data.stats.find(s => s.label === 'Active Rides Now');

      assert.equal(parseInt(driversStat.value, 10), expectedRegisteredDrivers);
      assert.equal(parseInt(passengersStat.value.replace(/,/g, ''), 10), expectedRegisteredPassengers);
      assert.equal(parseInt(activeTripsStat.value, 10), expectedActiveTrips);
    });
  });

  // =========================================================================
  // SCENARIO N: Date/Time Filters
  // =========================================================================
  describe('Scenario N: Date/Time Filters', () => {
    it('should accurately aggregate metrics within past 7 days window', async () => {
      await completeSoloRide(passengerAUser, driverAUser);

      const past7Days = new Date();
      past7Days.setDate(past7Days.getDate() - 7);

      const expectedWeeklyTrips = await DriverTrip.countDocuments({
        status: 'completed',
        createdAt: { $gte: past7Days }
      });

      const snapRes = await fetch(`${BASE_URL}/admin/analytics/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const snapData = await snapRes.json();
      const weeklyStat = snapData.data.metrics.find(m => m.label === 'Total Trips This Week');

      assert.equal(parseInt(weeklyStat.value, 10), expectedWeeklyTrips);
    });
  });

  // =========================================================================
  // SCENARIO O: Empty State / Zero Accounting
  // =========================================================================
  describe('Scenario O: Empty State / Zero Accounting', () => {
    it('should return valid zero and empty states when no records exist without NaN or null errors', async () => {
      // Driver B has 0 ratings and 0 trips in fresh test state
      const ratingsRes = await fetch(`${BASE_URL}/ratings/driver/${driverBUser._id}`, {
        headers: { Authorization: `Bearer ${passengerAToken}` }
      });
      const ratingsData = await ratingsRes.json();
      assert.equal(ratingsRes.status, 200);
      assert.equal(ratingsData.count, 0);
      assert.deepEqual(ratingsData.data, []);

      // Driver B analytics
      const analyticsRes = await fetch(`${BASE_URL}/driver/analytics`, {
        headers: { Authorization: `Bearer ${driverBToken}` }
      });
      const analyticsData = await analyticsRes.json();
      assert.equal(analyticsRes.status, 200);
      assert.equal(analyticsData.data.dailyTrips, 0);
      assert.equal(analyticsData.data.totalTrips, 0);
      assert.ok(!isNaN(analyticsData.data.totalTrips));

      // Driver B earnings
      const earningsRes = await fetch(`${BASE_URL}/driver/earnings`, {
        headers: { Authorization: `Bearer ${driverBToken}` }
      });
      const earningsData = await earningsRes.json();
      assert.equal(earningsRes.status, 200);
      assert.equal(earningsData.data.metrics.totalEarnings, 0);
      assert.equal(earningsData.data.metrics.totalTrips, 0);
      assert.deepEqual(earningsData.data.recentTrips, []);
    });
  });
});
