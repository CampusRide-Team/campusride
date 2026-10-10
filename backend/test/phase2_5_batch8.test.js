import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const io = require('c:/Users/Hyp Er/Desktop/campusride/web-admin/node_modules/socket.io-client');

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
const SOCKET_URL = 'http://localhost:5000';

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

describe('CampusRide Phase 2.5 Batch 8 — Final End-to-End System Integration & Production Readiness Validation', () => {
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

  const createSocket = (token) => {
    return io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
      reconnection: false
    });
  };

  const waitForConnect = (sock) => {
    return new Promise((resolve, reject) => {
      if (sock.connected) return resolve();
      const timer = setTimeout(() => reject(new Error('Socket connection timeout')), 4000);
      sock.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      sock.once('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  };

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

    // Reset drivers to clean approved online state with fresh location
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

  // =========================================================================
  // SCENARIO A: Complete Solo Ride From Authentication to History
  // =========================================================================
  describe('Scenario A — Complete Solo Ride From Authentication to History', () => {
    it('should successfully execute complete solo lifecycle through all milestones, sockets, history, and ratings', async () => {
      // 1. Calculate fare estimate
      const fareEstimate = pricingService.calculateEstimatedFare({ distanceMeters: 1400, durationSeconds: 240, rideMode: 'solo' });
      assert.ok(fareEstimate.totalFare > 0);

      // 2. Booking creation
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      assert.equal(booking.status, 'pending');

      // 3. Driver accepts dispatch
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();
      assert.equal(trip.status, 'dispatched');

      // 4. Socket room joining & telemetry
      const passSock = createSocket(passengerAToken);
      const driverSock = createSocket(driverAToken);
      await Promise.all([waitForConnect(passSock), waitForConnect(driverSock)]);

      await Promise.all([
        new Promise(r => passSock.emit('trip:join', { tripId }, r)),
        new Promise(r => driverSock.emit('trip:join', { tripId }, r))
      ]);

      const telemetryPromise = new Promise(resolve => passSock.once('driver:telemetry', resolve));
      driverSock.emit('driver:telemetry', {
        tripId,
        coordinates: [-0.1872, 5.6506],
        heading: 90,
        speed: 25
      });
      const receivedTelemetry = await telemetryPromise;
      assert.deepEqual(receivedTelemetry.coordinates, [-0.1872, 5.6506]);

      // 5. Milestones: Pickup arrival -> Pickup complete -> Dropoff arrival -> Dropoff complete
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');

      await executeTripStop({ driverId: driverAUser._id, tripId, stopId: pickupStop.stopId, targetStatus: 'arrived', enforceProximity: false });
      await executeTripStop({ driverId: driverAUser._id, tripId, stopId: pickupStop.stopId, targetStatus: 'completed', enforceProximity: false });

      let inFlightBooking = await RideBooking.findById(booking._id);
      let inFlightTrip = await DriverTrip.findById(tripId);
      assert.equal(inFlightBooking.status, 'in_progress');
      assert.equal(inFlightTrip.status, 'active');

      await executeTripStop({ driverId: driverAUser._id, tripId, stopId: dropoffStop.stopId, targetStatus: 'arrived', enforceProximity: false });
      await executeTripStop({ driverId: driverAUser._id, tripId, stopId: dropoffStop.stopId, targetStatus: 'completed', enforceProximity: false });

      // 6. Terminal status verification
      const completedBooking = await RideBooking.findById(booking._id);
      const completedTrip = await DriverTrip.findById(tripId);
      assert.equal(completedBooking.status, 'completed');
      assert.equal(completedTrip.status, 'completed');
      assert.equal(completedTrip.activePassengerCount, 0);

      // 7. History verification
      const histRes = await fetch(`${BASE_URL}/bookings/history`, { headers: { Authorization: `Bearer ${passengerAToken}` } });
      const histData = await histRes.json();
      const histRide = histData.data.find(b => b._id === booking._id.toString());
      assert.ok(histRide);
      assert.equal(histRide.status, 'completed');

      // 8. Rating submission
      const ratingRes = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerAToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 5, comment: 'Flawless solo ride!' })
      });
      assert.equal(ratingRes.status, 201);

      passSock.disconnect();
      driverSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO B: Complete Shared Ride
  // =========================================================================
  describe('Scenario B — Complete Shared Ride', () => {
    it('should complete shared pool ride for 2 passengers with exact capacity tracking and individual booking histories', async () => {
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

      const dbTrip = await DriverTrip.findById(tripId);
      assert.equal(dbTrip.tripType, 'shared');
      assert.equal(dbTrip.reservedPassengerCount, 2);
      assert.equal(dbTrip.tripStops.length, 4);

      // Execute all 4 stops
      for (const stop of dbTrip.tripStops) {
        await executeTripStop({ driverId: driverAUser._id, tripId, stopId: stop.stopId, targetStatus: 'arrived', enforceProximity: false });
        await executeTripStop({ driverId: driverAUser._id, tripId, stopId: stop.stopId, targetStatus: 'completed', enforceProximity: false });
      }

      const terminalTrip = await DriverTrip.findById(tripId);
      assert.equal(terminalTrip.status, 'completed');
      assert.equal(terminalTrip.activePassengerCount, 0);
      assert.equal(terminalTrip.reservedPassengerCount, 0);

      // Verify both passengers have completed bookings pointing to the same DriverTrip
      const updatedA = await RideBooking.findById(bookingA._id);
      const updatedB = await RideBooking.findById(bookingB._id);
      assert.equal(updatedA.status, 'completed');
      assert.equal(updatedB.status, 'completed');
      assert.equal(updatedA.driverTripId.toString(), tripId);
      assert.equal(updatedB.driverTripId.toString(), tripId);

      // Driver has exactly 1 shared DriverTrip
      const driverTripsCount = await DriverTrip.countDocuments({ driverId: driverAUser._id, status: 'completed' });
      assert.equal(driverTripsCount, 1);
    });
  });

  // =========================================================================
  // SCENARIO C: Cancellation and Recovery
  // =========================================================================
  describe('Scenario C — Cancellation and Recovery', () => {
    it('should cleanly cancel solo pre-pickup and release driver, and handle partial shared cancellation', async () => {
      // 1. Solo post-assignment pre-pickup cancellation (remediated defect validation)
      const soloBooking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      const { trip: soloTrip } = await acceptSoloOffer(driverAUser._id, soloBooking._id);
      await cancelBooking(soloBooking._id, passengerAUser._id, 'passenger', 'Cancel pre-pickup');

      const cancelledBooking = await RideBooking.findById(soloBooking._id);
      const cancelledTrip = await DriverTrip.findById(soloTrip._id);
      assert.equal(cancelledBooking.status, 'cancelled');
      assert.equal(cancelledTrip.status, 'completed');
      assert.equal(cancelledTrip.activePassengerCount, 0);
      assert.equal(cancelledTrip.reservedPassengerCount, 0);

      // Driver is immediately free
      const activeTripsForDriver = await DriverTrip.countDocuments({ driverId: driverAUser._id, status: { $in: ['dispatched', 'active'] } });
      assert.equal(activeTripsForDriver, 0, 'Driver must have zero busy trips');

      // 2. Shared ride: Passenger A cancels while Passenger B remains active
      const sharedA = await createRideBooking(passengerAUser._id, { pickup: 'Balme Library', dropoff: 'Pentagon Hostel', rideMode: 'shared' });
      const { trip: sharedTrip } = await createSharedTrip(driverAUser._id, sharedA._id);
      const sharedB = await createRideBooking(passengerBUser._id, { pickup: 'Night Market', dropoff: 'Evandy Hostel', rideMode: 'shared' });
      await insertBookingIntoSharedTrip(driverAUser._id, sharedTrip._id, sharedB._id);

      // Passenger A cancels
      await cancelBooking(sharedA._id, passengerAUser._id, 'passenger', 'Passenger A cancels');

      const postCancelSharedA = await RideBooking.findById(sharedA._id);
      const postCancelSharedB = await RideBooking.findById(sharedB._id);
      const postCancelSharedTrip = await DriverTrip.findById(sharedTrip._id);

      assert.equal(postCancelSharedA.status, 'cancelled');
      assert.equal(postCancelSharedB.status, 'driver_assigned');
      assert.equal(postCancelSharedTrip.status, 'dispatched');
      assert.equal(postCancelSharedTrip.reservedPassengerCount, 1, 'Reserved count decremented to 1 for remaining passenger');
    });
  });

  // =========================================================================
  // SCENARIO D: Concurrency / Race Protection
  // =========================================================================
  describe('Scenario D — Concurrency / Race Protection', () => {
    it('should atomically allow only one driver to claim a booking and reject duplicate acceptance and cancellations', async () => {
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      // Two drivers concurrently try to accept the same booking
      const raceResults = await Promise.allSettled([
        acceptSoloOffer(driverAUser._id, booking._id),
        acceptSoloOffer(driverBUser._id, booking._id)
      ]);

      const fulfilled = raceResults.filter(r => r.status === 'fulfilled');
      const rejected = raceResults.filter(r => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one driver must successfully claim booking');
      assert.equal(rejected.length, 1, 'Losing driver must be rejected');

      const winningDriverId = fulfilled[0].value.trip.driverId.toString();
      const tripCount = await DriverTrip.countDocuments({ 'tripStops.bookingId': booking._id });
      assert.equal(tripCount, 1, 'Exactly one DriverTrip must exist in database');

      // Duplicate acceptance by same winning driver rejected
      await assert.rejects(
        async () => { await acceptSoloOffer(winningDriverId, booking._id); },
        /(DRIVER_ALREADY_HAS_ACTIVE_TRIP|BOOKING_ALREADY_CLAIMED)/
      );

      // Concurrent cancellation
      const cancelRace = await Promise.allSettled([
        cancelBooking(booking._id, passengerAUser._id, 'passenger', 'Concurrent cancel 1'),
        cancelBooking(booking._id, passengerAUser._id, 'passenger', 'Concurrent cancel 2')
      ]);
      const cancelFulfilled = cancelRace.filter(r => r.status === 'fulfilled');
      assert.ok(cancelFulfilled.length >= 1, 'At least one cancellation must succeed');
      const finalBooking = await RideBooking.findById(booking._id);
      assert.equal(finalBooking.status, 'cancelled', 'Booking must be in cancelled state');

      // Sequential duplicate cancellation on terminal booking MUST reject
      await assert.rejects(
        async () => { await cancelBooking(booking._id, passengerAUser._id, 'passenger', 'Duplicate cancel attempt'); },
        /Cannot cancel a booking that is already in terminal state/
      );
    });
  });

  // =========================================================================
  // SCENARIO E: Socket Disconnect / Reconnect
  // =========================================================================
  describe('Scenario E — Socket Disconnect / Reconnect', () => {
    it('should maintain authoritative trip state across disconnect and resume telemetry upon reconnect', async () => {
      const booking = await createRideBooking(passengerAUser._id, { pickup: 'Balme Library', dropoff: 'Pentagon Hostel', rideMode: 'solo' });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();

      const passSock = createSocket(passengerAToken);
      const driverSock = createSocket(driverAToken);
      await Promise.all([waitForConnect(passSock), waitForConnect(driverSock)]);

      await Promise.all([
        new Promise(r => passSock.emit('trip:join', { tripId }, r)),
        new Promise(r => driverSock.emit('trip:join', { tripId }, r))
      ]);

      // Passenger disconnects
      passSock.disconnect();
      assert.equal(passSock.connected, false);

      // Driver continues sending telemetry
      driverSock.emit('driver:telemetry', { tripId, coordinates: [-0.1874, 5.637], heading: 100, speed: 20 });
      await new Promise(r => setTimeout(r, 100));

      // Passenger reconnects and rejoins
      passSock.connect();
      await waitForConnect(passSock);
      await new Promise(r => passSock.emit('trip:join', { tripId }, r));

      // Driver emits fresh telemetry; reconnected passenger receives it
      const framePromise = new Promise(resolve => passSock.once('driver:telemetry', resolve));
      driverSock.emit('driver:telemetry', { tripId, coordinates: [-0.1870, 5.640], heading: 110, speed: 25 });
      const frame = await framePromise;
      assert.deepEqual(frame.coordinates, [-0.1870, 5.640]);

      passSock.disconnect();
      driverSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO F: Authentication / Authorization / Privacy
  // =========================================================================
  describe('Scenario F — Authentication / Authorization / Privacy', () => {
    it('should enforce role guards, reject unauthorized booking queries, and protect confidential fields', async () => {
      // 1. Invalid login
      const badLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: PASSENGER_A_CREDS.email, password: 'WrongPassword!' })
      });
      assert.equal(badLogin.status, 401);

      // 2. Protected endpoint without token
      const noToken = await fetch(`${BASE_URL}/bookings/history`);
      assert.equal(noToken.status, 401);

      // 3. Cross-actor booking access
      const booking = await createRideBooking(passengerAUser._id, { pickup: 'Balme Library', dropoff: 'Pentagon Hostel', rideMode: 'solo' });
      const passBAccess = await fetch(`${BASE_URL}/bookings/${booking._id}`, { headers: { Authorization: `Bearer ${passengerBToken}` } });
      assert.equal(passBAccess.status, 403);

      // 4. Privacy: verify no password/hash/salt in response
      const passAAccess = await fetch(`${BASE_URL}/bookings/${booking._id}`, { headers: { Authorization: `Bearer ${passengerAToken}` } });
      const passAData = await passAAccess.json();
      const serialized = JSON.stringify(passAData);
      assert.ok(!serialized.includes('password'));
      assert.ok(!serialized.includes('passwordHash'));
      assert.ok(!serialized.includes('salt'));
    });
  });

  // =========================================================================
  // SCENARIO G: Fare / Financial Consistency
  // =========================================================================
  describe('Scenario G — Fare / Financial Consistency', () => {
    it('should maintain exact mathematical fare integrity from estimation to booking and history', async () => {
      const booking = await createRideBooking(passengerAUser._id, { pickup: 'Balme Library', dropoff: 'Pentagon Hostel', rideMode: 'solo' });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();

      // Complete trip
      for (const stop of trip.tripStops) {
        await executeTripStop({ driverId: driverAUser._id, tripId, stopId: stop.stopId, targetStatus: 'arrived', enforceProximity: false });
        await executeTripStop({ driverId: driverAUser._id, tripId, stopId: stop.stopId, targetStatus: 'completed', enforceProximity: false });
      }

      const histRes = await fetch(`${BASE_URL}/bookings/history`, { headers: { Authorization: `Bearer ${passengerAToken}` } });
      const histData = await histRes.json();
      const histRide = histData.data.find(b => b._id === booking._id.toString());

      assert.ok(histRide);
      assert.equal(histRide.fare.totalFare, booking.fare.totalFare, 'Historical fare must match initial booking fare exactly');
      assert.equal(histRide.fare.currency, 'GHS');
      assert.ok(histRide.fare.totalFare > 0);
    });
  });

  // =========================================================================
  // SCENARIO H: Ride History / Ratings
  // =========================================================================
  describe('Scenario H — Ride History / Ratings', () => {
    it('should record ratings only for completed rides, reject duplicates, and enforce 1-5 boundary', async () => {
      const booking = await createRideBooking(passengerAUser._id, { pickup: 'Balme Library', dropoff: 'Pentagon Hostel', rideMode: 'solo' });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();

      // Attempt rating before completion -> rejected
      const earlyRating = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerAToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 5 })
      });
      assert.notEqual(earlyRating.status, 201);

      // Complete trip
      for (const stop of trip.tripStops) {
        await executeTripStop({ driverId: driverAUser._id, tripId, stopId: stop.stopId, targetStatus: 'arrived', enforceProximity: false });
        await executeTripStop({ driverId: driverAUser._id, tripId, stopId: stop.stopId, targetStatus: 'completed', enforceProximity: false });
      }

      // Valid rating succeeds
      const validRating = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerAToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 4, comment: 'Good trip' })
      });
      assert.equal(validRating.status, 201);

      // Duplicate rating rejected
      const dupRating = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${passengerAToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id.toString(), score: 5, comment: 'Duplicate' })
      });
      assert.equal(dupRating.status, 409);
    });
  });

  // =========================================================================
  // SCENARIO I: Admin Dashboard / Analytics
  // =========================================================================
  describe('Scenario I — Admin Dashboard / Analytics', () => {
    it('should reconcile displayed admin metrics with direct MongoDB collections ground truth', async () => {
      const dashRes = await fetch(`${BASE_URL}/admin/dashboard`, { headers: { Authorization: `Bearer ${adminToken}` } });
      const dashData = await dashRes.json();
      assert.equal(dashRes.status, 200);

      const dbDriversCount = await User.countDocuments({ role: 'driver' });
      const dbPassengersCount = await User.countDocuments({ role: { $in: ['passenger', 'student', 'rider'] } });
      const dbActiveTripsCount = await DriverTrip.countDocuments({ status: { $in: ['dispatched', 'active'] } });

      const driversStat = dashData.data.stats.find(s => s.label === 'Drivers Registered');
      const passengersStat = dashData.data.stats.find(s => s.label === 'Riders Registered');
      const activeTripsStat = dashData.data.stats.find(s => s.label === 'Active Rides Now');

      assert.equal(parseInt(driversStat.value, 10), dbDriversCount);
      assert.equal(parseInt(passengersStat.value.replace(/,/g, ''), 10), dbPassengersCount);
      assert.equal(parseInt(activeTripsStat.value, 10), dbActiveTripsCount);
    });
  });

  // =========================================================================
  // SCENARIO J: Full Cross-Role Lifecycle
  // =========================================================================
  describe('Scenario J — Full Cross-Role Lifecycle', () => {
    it('should converge Passenger, Driver, and Admin on the same operational truth concurrently', async () => {
      // 1. Admin polls initial snapshot
      const snapInit = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json());
      const initActiveCount = snapInit.data.activeTrips.length;

      // 2. Passenger creates booking and Driver accepts
      const booking = await createRideBooking(passengerAUser._id, { pickup: 'Balme Library', dropoff: 'Pentagon Hostel', rideMode: 'solo' });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();

      // 3. Admin sees active trip
      const snapActive = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json());
      assert.equal(snapActive.data.activeTrips.length, initActiveCount + 1);

      // 4. Complete trip
      for (const stop of trip.tripStops) {
        await executeTripStop({ driverId: driverAUser._id, tripId, stopId: stop.stopId, targetStatus: 'arrived', enforceProximity: false });
        await executeTripStop({ driverId: driverAUser._id, tripId, stopId: stop.stopId, targetStatus: 'completed', enforceProximity: false });
      }

      // 5. All three roles converge:
      // Passenger sees completed
      const passView = await fetch(`${BASE_URL}/bookings/${booking._id}`, { headers: { Authorization: `Bearer ${passengerAToken}` } }).then(r => r.json());
      assert.equal(passView.data.status, 'completed');

      // Driver sees completed
      const driverView = await fetch(`${BASE_URL}/trips/${tripId}`, { headers: { Authorization: `Bearer ${driverAToken}` } }).then(r => r.json());
      assert.equal(driverView.data.status, 'completed');

      // Admin sees active trip removed
      const snapCompleted = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json());
      assert.equal(snapCompleted.data.activeTrips.length, initActiveCount);
    });
  });

  // =========================================================================
  // SCENARIO K: Negative / Stale Actions
  // =========================================================================
  describe('Scenario K — Negative / Stale Actions', () => {
    it('should reject stale actions on completed trips and bookings without database corruption', async () => {
      const booking = await createRideBooking(passengerAUser._id, { pickup: 'Balme Library', dropoff: 'Pentagon Hostel', rideMode: 'solo' });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();

      // Complete all stops
      for (const stop of trip.tripStops) {
        await executeTripStop({ driverId: driverAUser._id, tripId, stopId: stop.stopId, targetStatus: 'arrived', enforceProximity: false });
        await executeTripStop({ driverId: driverAUser._id, tripId, stopId: stop.stopId, targetStatus: 'completed', enforceProximity: false });
      }

      // 1. Attempt to execute stop transition on already completed stop -> rejected
      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');
      await assert.rejects(
        async () => {
          await executeTripStop({ driverId: driverAUser._id, tripId, stopId: dropoffStop.stopId, targetStatus: 'arrived', enforceProximity: false });
        },
        /STOP_ALREADY_TERMINAL/
      );

      // 2. Attempt to cancel completed booking -> rejected
      await assert.rejects(
        async () => {
          await cancelBooking(booking._id, passengerAUser._id, 'passenger', 'Late cancel');
        },
        /Cannot cancel a booking that is already in terminal state/
      );

      // 3. Unauthorized user attempts trip room join
      const passBSock = createSocket(passengerBToken);
      await waitForConnect(passBSock);
      const unauthorizedJoin = await new Promise(resolve => passBSock.emit('trip:join', { tripId }, resolve));
      assert.equal(unauthorizedJoin.success, false);
      assert.equal(unauthorizedJoin.error, 'TRIP_ACCESS_DENIED');
      passBSock.disconnect();
    });
  });
});
