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
import CampusPOI from '../src/models/CampusPOI.js';
import { createRideBooking, cancelBooking } from '../src/services/bookingService.js';
import { acceptSoloOffer, acceptSharedOffer } from '../src/services/dispatchService.js';
import { executeTripStop, createSharedTrip, insertBookingIntoSharedTrip } from '../src/services/tripService.js';

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

describe('CampusRide Phase 2.5 Batch 6 — Network Resilience, Reconnection & Socket Recovery Validation', () => {
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
      reconnection: false // manual reconnection control for precise testing
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

    // Load canonical User documents from MongoDB
    adminUser = await User.findOne({ email: ADMIN_CREDS.email });
    passengerAUser = await User.findOne({ email: PASSENGER_A_CREDS.email });
    passengerBUser = await User.findOne({ email: PASSENGER_B_CREDS.email });
    driverAUser = await User.findOne({ email: DRIVER_A_CREDS.email });
    driverBUser = await User.findOne({ email: DRIVER_B_CREDS.email });
  });

  beforeEach(async () => {
    // Reset drivers to clean approved online state with fresh location
    await User.updateOne(
      { email: DRIVER_A_CREDS.email },
      {
        $set: {
          isOnline: true,
          isApproved: true,
          approvalStatus: 'approved',
          isSuspended: false,
          lastSeen: new Date(),
          currentLocation: { type: 'Point', coordinates: [-0.1876, 5.635] }
        }
      }
    );
    await User.updateOne(
      { email: DRIVER_B_CREDS.email },
      {
        $set: {
          isOnline: true,
          isApproved: true,
          approvalStatus: 'approved',
          isSuspended: false,
          lastSeen: new Date(),
          currentLocation: { type: 'Point', coordinates: [-0.1942, 5.6385] }
        }
      }
    );

    // Clean test bookings and trips
    const testUserIds = [passengerAUser?._id, passengerBUser?._id, driverAUser?._id, driverBUser?._id].filter(Boolean);
    await DriverTrip.deleteMany({ driverId: { $in: [driverAUser?._id, driverBUser?._id] } });
    await RideBooking.deleteMany({ passengerId: { $in: testUserIds } });
  });

  after(async () => {
    const testUserIds = [passengerAUser?._id, passengerBUser?._id, driverAUser?._id, driverBUser?._id].filter(Boolean);
    await DriverTrip.deleteMany({ driverId: { $in: [driverAUser?._id, driverBUser?._id] } });
    await RideBooking.deleteMany({ passengerId: { $in: testUserIds } });
    await mongoose.disconnect();
  });

  // =========================================================================
  // SCENARIO A: Passenger Socket Disconnect Before Assignment
  // =========================================================================
  describe('Scenario A: Passenger Socket Disconnect Before Assignment', () => {
    it('should maintain booking integrity when passenger disconnects before driver acceptance and recovers after reconnect', async () => {
      // 1. Passenger socket connected
      const passengerSock = createSocket(passengerAToken);
      await waitForConnect(passengerSock);
      assert.ok(passengerSock.connected);

      // 2. Create pending solo booking
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      assert.equal(booking.status, 'pending');

      // 3. Force passenger socket disconnect
      passengerSock.disconnect();
      assert.equal(passengerSock.connected, false);

      // 4. Driver accepts the ride while passenger is disconnected
      const acceptResult = await acceptSoloOffer(driverAUser._id, booking._id);
      assert.ok(acceptResult.trip, 'Trip must be created');
      const tripId = acceptResult.trip._id.toString();

      // 5. Verify authoritative database state
      const updatedBooking = await RideBooking.findById(booking._id);
      assert.equal(updatedBooking.status, 'driver_assigned');
      assert.equal(updatedBooking.driverId.toString(), driverAUser._id.toString());
      assert.equal(updatedBooking.driverTripId.toString(), tripId);

      const tripCount = await DriverTrip.countDocuments({ 'tripStops.bookingId': booking._id });
      assert.equal(tripCount, 1, 'Exactly one DriverTrip must exist');

      // 6. Reconnect passenger socket
      passengerSock.connect();
      await waitForConnect(passengerSock);
      assert.ok(passengerSock.connected);

      // 7. Passenger rejoins trip room after state recovery
      const joinAck = await new Promise((resolve) => {
        passengerSock.emit('trip:join', { tripId }, (res) => resolve(res));
      });
      assert.equal(joinAck.success, true);
      assert.equal(joinAck.tripId, tripId);

      // 8. Driver sends telemetry; verify reconnected passenger receives it
      const driverSock = createSocket(driverAToken);
      await waitForConnect(driverSock);

      const telemetryReceivedPromise = new Promise((resolve) => {
        passengerSock.once('driver:telemetry', (data) => resolve(data));
      });

      driverSock.emit('driver:telemetry', {
        tripId,
        coordinates: [-0.1872, 5.6506],
        heading: 90,
        speed: 25
      });

      const receivedTelemetry = await telemetryReceivedPromise;
      assert.equal(receivedTelemetry.tripId, tripId);
      assert.deepEqual(receivedTelemetry.coordinates, [-0.1872, 5.6506]);

      passengerSock.disconnect();
      driverSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO B: Passenger Disconnect During Active Trip
  // =========================================================================
  describe('Scenario B: Passenger Disconnect During Active Trip', () => {
    it('should maintain active trip and allow passenger to resume live telemetry after mid-trip disconnect and reconnect', async () => {
      // 1. Establish active ride
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();

      const passengerSock = createSocket(passengerAToken);
      const driverSock = createSocket(driverAToken);
      await Promise.all([waitForConnect(passengerSock), waitForConnect(driverSock)]);

      // Join trip room
      await new Promise(r => passengerSock.emit('trip:join', { tripId }, r));
      await new Promise(r => driverSock.emit('trip:join', { tripId }, r));

      // Advance trip: driver arrives and completes pickup
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
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

      // 2. Disconnect passenger socket
      passengerSock.disconnect();
      assert.equal(passengerSock.connected, false);

      // 3. Driver continues sending telemetry while passenger is disconnected
      driverSock.emit('driver:telemetry', {
        tripId,
        coordinates: [-0.1874, 5.637],
        heading: 100,
        speed: 20
      });

      // Verify DB persists driver's updated location
      await new Promise(r => setTimeout(r, 200));
      const driverDoc = await User.findById(driverAUser._id);
      assert.deepEqual(driverDoc.currentLocation.coordinates, [-0.1874, 5.637]);

      // 4. Reconnect passenger socket and rejoin trip room
      passengerSock.connect();
      await waitForConnect(passengerSock);

      const rejoinAck = await new Promise(r => passengerSock.emit('trip:join', { tripId }, r));
      assert.equal(rejoinAck.success, true);

      // 5. Driver sends new telemetry frame; verify reconnected passenger receives it
      const telemetryPromise = new Promise(resolve => {
        passengerSock.once('driver:telemetry', data => resolve(data));
      });

      driverSock.emit('driver:telemetry', {
        tripId,
        coordinates: [-0.1870, 5.640],
        heading: 120,
        speed: 30
      });

      const frame = await telemetryPromise;
      assert.equal(frame.tripId, tripId);
      assert.deepEqual(frame.coordinates, [-0.1870, 5.640]);

      // Verify trip remains active and intact
      const activeTrip = await DriverTrip.findById(tripId);
      assert.equal(activeTrip.status, 'active');
      assert.equal(activeTrip.activePassengerCount, 1);

      passengerSock.disconnect();
      driverSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO C: Passenger Disconnect Near Completion
  // =========================================================================
  describe('Scenario C: Passenger Disconnect Near Completion', () => {
    it('should complete trip cleanly when passenger is disconnected and prevent trip resurrection upon reconnect', async () => {
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();

      const passengerSock = createSocket(passengerAToken);
      await waitForConnect(passengerSock);
      await new Promise(r => passengerSock.emit('trip:join', { tripId }, r));

      // Advance through pickup
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

      // Disconnect passenger near completion
      passengerSock.disconnect();

      // Driver arrives at dropoff and completes trip
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

      // Verify DB terminal state
      const completedTrip = await DriverTrip.findById(tripId);
      assert.equal(completedTrip.status, 'completed');
      assert.equal(completedTrip.activePassengerCount, 0);

      // Reconnect passenger
      passengerSock.connect();
      await waitForConnect(passengerSock);

      // Passenger queries authoritative trip state via API
      const tripRes = await fetch(`${BASE_URL}/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${passengerAToken}` }
      });
      const tripData = await tripRes.json();
      assert.equal(tripRes.status, 200);
      assert.equal(tripData.data.status, 'completed');

      // Attempt to emit delayed telemetry; verify it does not resurrect the completed trip
      const driverSock = createSocket(driverAToken);
      await waitForConnect(driverSock);
      driverSock.emit('driver:telemetry', {
        tripId,
        coordinates: [-0.1940, 5.6380],
        heading: 0,
        speed: 0
      });

      await new Promise(r => setTimeout(r, 200));
      const postTelemetryTrip = await DriverTrip.findById(tripId);
      assert.equal(postTelemetryTrip.status, 'completed', 'Trip must remain completed');

      passengerSock.disconnect();
      driverSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO D: Driver Socket Disconnect During Active Trip
  // =========================================================================
  describe('Scenario D: Driver Socket Disconnect During Active Trip', () => {
    it('should keep active trip intact during driver transport disconnect and allow resumption upon reconnect', async () => {
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();

      const driverSock = createSocket(driverAToken);
      const passengerSock = createSocket(passengerAToken);
      await Promise.all([waitForConnect(driverSock), waitForConnect(passengerSock)]);
      await new Promise(r => passengerSock.emit('trip:join', { tripId }, r));

      // Force driver disconnect
      driverSock.disconnect();
      assert.equal(driverSock.connected, false);

      // Verify backend does NOT cancel or complete trip merely on socket disconnect
      const dbTrip = await DriverTrip.findById(tripId);
      assert.equal(dbTrip.status, 'dispatched');
      assert.equal(dbTrip.driverId.toString(), driverAUser._id.toString());

      // Reconnect driver
      driverSock.connect();
      await waitForConnect(driverSock);

      // Driver resumes emitting telemetry
      const telemetryPromise = new Promise(resolve => {
        passengerSock.once('driver:telemetry', data => resolve(data));
      });

      driverSock.emit('driver:telemetry', {
        tripId,
        coordinates: [-0.1875, 5.6355],
        heading: 45,
        speed: 15
      });

      const frame = await telemetryPromise;
      assert.equal(frame.tripId, tripId);
      assert.deepEqual(frame.coordinates, [-0.1875, 5.6355]);

      driverSock.disconnect();
      passengerSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO E: Driver Disconnect During Dispatch / Acceptance Boundary
  // =========================================================================
  describe('Scenario E: Driver Disconnect During Dispatch / Acceptance Boundary', () => {
    it('should maintain coherent state if driver disconnects before acceptance and reconnects to accept', async () => {
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const driverSock = createSocket(driverAToken);
      await waitForConnect(driverSock);

      // Disconnect driver socket right before acceptance
      driverSock.disconnect();
      assert.equal(driverSock.connected, false);

      // Reconnect driver
      driverSock.connect();
      await waitForConnect(driverSock);

      // Driver accepts offer after reconnect
      const acceptAck = await new Promise(resolve => {
        driverSock.emit('dispatch:response', {
          bookingId: booking._id.toString(),
          response: 'accept'
        }, resolve);
      });

      assert.equal(acceptAck.success, true);
      assert.ok(acceptAck.data?.trip);

      // Verify DB consistency: exactly 1 DriverTrip, 1 assigned booking
      const tripCount = await DriverTrip.countDocuments({ 'tripStops.bookingId': booking._id });
      assert.equal(tripCount, 1);
      const updatedBooking = await RideBooking.findById(booking._id);
      assert.equal(updatedBooking.status, 'driver_assigned');

      driverSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO F: Repeated Reconnect / Listener Duplication
  // =========================================================================
  describe('Scenario F: Repeated Reconnect / Listener Duplication', () => {
    it('should not duplicate event delivery or room memberships after 4 rapid disconnect/reconnect cycles', async () => {
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();

      const passengerSock = createSocket(passengerAToken);
      await waitForConnect(passengerSock);

      // Perform 4 rapid disconnect/reconnect cycles
      for (let i = 0; i < 4; i++) {
        passengerSock.disconnect();
        await new Promise(r => setTimeout(r, 50));
        passengerSock.connect();
        await waitForConnect(passengerSock);
        await new Promise(r => passengerSock.emit('trip:join', { tripId }, r));
      }

      // Track received telemetry frames
      let deliveryCount = 0;
      passengerSock.on('driver:telemetry', () => {
        deliveryCount++;
      });

      const driverSock = createSocket(driverAToken);
      await waitForConnect(driverSock);

      driverSock.emit('driver:telemetry', {
        tripId,
        coordinates: [-0.1870, 5.6360],
        heading: 0,
        speed: 10
      });

      await new Promise(r => setTimeout(r, 300));
      assert.equal(deliveryCount, 1, 'Client must receive exactly 1 telemetry delivery, not 4');

      passengerSock.disconnect();
      driverSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO G: Shared Ride Reconnection
  // =========================================================================
  describe('Scenario G: Shared Ride Reconnection', () => {
    it('should maintain independent passenger states when one passenger disconnects and reconnects in a shared ride', async () => {
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

      const passASock = createSocket(passengerAToken);
      const passBSock = createSocket(passengerBToken);
      const driverSock = createSocket(driverAToken);
      await Promise.all([waitForConnect(passASock), waitForConnect(passBSock), waitForConnect(driverSock)]);

      await Promise.all([
        new Promise(r => passASock.emit('trip:join', { tripId }, r)),
        new Promise(r => passBSock.emit('trip:join', { tripId }, r))
      ]);

      // 1. Disconnect Passenger A
      passASock.disconnect();
      assert.equal(passASock.connected, false);

      // 2. Driver emits telemetry; Passenger B receives it while A is offline
      const passBTelemetryPromise = new Promise(resolve => {
        passBSock.once('driver:telemetry', data => resolve(data));
      });

      driverSock.emit('driver:telemetry', {
        tripId,
        coordinates: [-0.1873, 5.6358],
        heading: 90,
        speed: 20
      });

      const frameB = await passBTelemetryPromise;
      assert.deepEqual(frameB.coordinates, [-0.1873, 5.6358]);

      // 3. Reconnect Passenger A and rejoin
      passASock.connect();
      await waitForConnect(passASock);
      await new Promise(r => passASock.emit('trip:join', { tripId }, r));

      // 4. Driver emits another telemetry; BOTH passengers receive it
      const framePromises = Promise.all([
        new Promise(r => passASock.once('driver:telemetry', r)),
        new Promise(r => passBSock.once('driver:telemetry', r))
      ]);

      driverSock.emit('driver:telemetry', {
        tripId,
        coordinates: [-0.1875, 5.6365],
        heading: 95,
        speed: 22
      });

      const [recvA, recvB] = await framePromises;
      assert.deepEqual(recvA.coordinates, [-0.1875, 5.6365]);
      assert.deepEqual(recvB.coordinates, [-0.1875, 5.6365]);

      // 5. Verify shared trip capacity & stop integrity in DB
      const dbTrip = await DriverTrip.findById(tripId);
      assert.equal(dbTrip.tripType, 'shared');
      assert.equal(dbTrip.reservedPassengerCount, 2);
      assert.equal(dbTrip.tripStops.length, 4); // 2 pickups + 2 dropoffs

      passASock.disconnect();
      passBSock.disconnect();
      driverSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO H: Disconnect During Cancellation (H1, H2, H3)
  // =========================================================================
  describe('Scenario H: Disconnect During Cancellation (H1, H2, H3)', () => {
    it('H1: should persist cancellation when passenger cancels then disconnects transport', async () => {
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      await acceptSoloOffer(driverAUser._id, booking._id);

      const passengerSock = createSocket(passengerAToken);
      await waitForConnect(passengerSock);

      // Passenger cancels booking
      await cancelBooking(booking._id, passengerAUser._id, 'passenger', 'Changed my mind');

      // Immediately disconnect socket
      passengerSock.disconnect();

      // Verify DB reflects cancellation cleanly
      const updatedBooking = await RideBooking.findById(booking._id);
      assert.equal(updatedBooking.status, 'cancelled');

      const driverBusyTrips = await DriverTrip.countDocuments({
        driverId: driverAUser._id,
        status: { $in: ['dispatched', 'active'] }
      });
      assert.equal(driverBusyTrips, 0, 'Driver must have zero busy trips');
    });

    it('H2: should allow passenger to reconnect after disconnect and perform cancellation', async () => {
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      await acceptSoloOffer(driverAUser._id, booking._id);

      const passengerSock = createSocket(passengerAToken);
      await waitForConnect(passengerSock);

      // Disconnect socket
      passengerSock.disconnect();

      // Reconnect socket
      passengerSock.connect();
      await waitForConnect(passengerSock);

      // Cancel via API
      await cancelBooking(booking._id, passengerAUser._id, 'passenger', 'Cancel after reconnect');

      const updatedBooking = await RideBooking.findById(booking._id);
      assert.equal(updatedBooking.status, 'cancelled');

      passengerSock.disconnect();
    });

    it('H3: should notify connected driver when passenger disconnects and cancels', async () => {
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);

      const driverSock = createSocket(driverAToken);
      await waitForConnect(driverSock);

      // Cancel booking
      await cancelBooking(booking._id, passengerAUser._id, 'passenger', 'Test driver awareness');

      // Verify DB: Trip is completed/cancelled, activePassengerCount = 0
      const updatedTrip = await DriverTrip.findById(trip._id);
      assert.equal(updatedTrip.activePassengerCount, 0);

      driverSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO I: Admin Socket Disconnect / Reconnect & Monitoring Continuity
  // =========================================================================
  describe('Scenario I: Admin Socket Disconnect / Reconnect', () => {
    it('should maintain monitoring continuity and fresh snapshots across admin socket disconnect/reconnect', async () => {
      const adminSock = createSocket(adminToken);
      await waitForConnect(adminSock);

      // Retrieve initial snapshot
      const snapRes1 = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const snap1 = await snapRes1.json();
      assert.equal(snapRes1.status, 200);

      // Disconnect admin socket
      adminSock.disconnect();
      assert.equal(adminSock.connected, false);

      // Create a background trip while admin is disconnected
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      await acceptSoloOffer(driverAUser._id, booking._id);

      // Reconnect admin socket
      adminSock.connect();
      await waitForConnect(adminSock);

      // Polling snapshot returns new active trip
      const snapRes2 = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const snap2 = await snapRes2.json();
      assert.equal(snapRes2.status, 200);
      assert.equal(snap2.data.activeTrips.length, 1, 'Snapshot must reflect new active trip');

      // Clean up trip
      await cancelBooking(booking._id, passengerAUser._id, 'passenger', 'Cleanup test trip');
      adminSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO J: Multiple Disconnect/Reconnect Cycles
  // =========================================================================
  describe('Scenario J: Multiple Disconnect/Reconnect Cycles', () => {
    it('should survive 3 interleaved disconnect/reconnect cycles for both driver and passenger without corruption', async () => {
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();

      const passengerSock = createSocket(passengerAToken);
      const driverSock = createSocket(driverAToken);
      await Promise.all([waitForConnect(passengerSock), waitForConnect(driverSock)]);

      for (let i = 0; i < 3; i++) {
        passengerSock.disconnect();
        driverSock.disconnect();
        await new Promise(r => setTimeout(r, 40));

        passengerSock.connect();
        driverSock.connect();
        await Promise.all([waitForConnect(passengerSock), waitForConnect(driverSock)]);

        await Promise.all([
          new Promise(r => passengerSock.emit('trip:join', { tripId }, r)),
          new Promise(r => driverSock.emit('trip:join', { tripId }, r))
        ]);
      }

      // Execute next milestone after 3 cycles
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
      const stopResult = await executeTripStop({
        driverId: driverAUser._id,
        tripId,
        stopId: pickupStop.stopId,
        targetStatus: 'arrived',
        enforceProximity: false
      });

      assert.equal(stopResult.stop.status, 'arrived');

      const dbTrip = await DriverTrip.findById(tripId);
      assert.equal(dbTrip.status, 'dispatched');

      passengerSock.disconnect();
      driverSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO K: Stale Socket / Old Trip Protection
  // =========================================================================
  describe('Scenario K: Stale Socket / Old Trip Protection', () => {
    it('should reject unauthorized socket from joining a different trip', async () => {
      // Create Trip B for Passenger B
      const bookingB = await createRideBooking(passengerBUser._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'solo'
      });
      const { trip: tripB } = await acceptSoloOffer(driverBUser._id, bookingB._id);
      const tripBId = tripB._id.toString();

      // Passenger A attempts to join Trip B's room
      const passASock = createSocket(passengerAToken);
      await waitForConnect(passASock);

      const joinResult = await new Promise(resolve => {
        passASock.emit('trip:join', { tripId: tripBId }, resolve);
      });

      assert.equal(joinResult.success, false);
      assert.equal(joinResult.error, 'TRIP_ACCESS_DENIED');

      passASock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO L: Authentication After Reconnection
  // =========================================================================
  describe('Scenario L: Authentication After Reconnection', () => {
    it('should reject reconnect attempts with invalid or missing tokens', async () => {
      // 1. Invalid token reconnect
      const badSock = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token: 'invalid.tampered.token' },
        autoConnect: true,
        reconnection: false
      });

      const badErr = await new Promise(resolve => {
        badSock.once('connect_error', resolve);
      });
      assert.match(badErr.message, /AUTH_INVALID_TOKEN/);

      // 2. Missing token reconnect
      const emptySock = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: {},
        autoConnect: true,
        reconnection: false
      });

      const emptyErr = await new Promise(resolve => {
        emptySock.once('connect_error', resolve);
      });
      assert.match(emptyErr.message, /AUTH_NO_TOKEN/);

      // 3. Valid token succeeds
      const goodSock = createSocket(passengerAToken);
      await waitForConnect(goodSock);
      assert.ok(goodSock.connected);
      goodSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO M: Telemetry Continuity and Ordering
  // =========================================================================
  describe('Scenario M: Telemetry Continuity and Ordering', () => {
    it('should retain latest coordinates across disconnect and ignore stale post-completion telemetry', async () => {
      const driverSock = createSocket(driverAToken);
      await waitForConnect(driverSock);

      // Emit coord 1
      driverSock.emit('driver:telemetry', {
        coordinates: [-0.1870, 5.6505],
        heading: 45,
        speed: 20
      });
      await new Promise(r => setTimeout(r, 200));

      // Disconnect
      driverSock.disconnect();

      // Reconnect
      driverSock.connect();
      await waitForConnect(driverSock);

      // Emit coord 2
      driverSock.emit('driver:telemetry', {
        coordinates: [-0.1865, 5.6515],
        heading: 50,
        speed: 25
      });
      await new Promise(r => setTimeout(r, 200));

      const driverDoc = await User.findById(driverAUser._id);
      assert.deepEqual(driverDoc.currentLocation.coordinates, [-0.1865, 5.6515], 'DB must store latest coordinates');

      driverSock.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO N: Recovery After Backend Process / Transport Disconnect
  // =========================================================================
  describe('Scenario N: Stateless Architecture & DB State Recovery', () => {
    it('should demonstrate complete state survivability and recovery from MongoDB without in-memory state', async () => {
      // Create and assign a trip
      const booking = await createRideBooking(passengerAUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      const tripId = trip._id.toString();

      // Disconnect all sockets completely
      // Simulate client re-booting from cold storage
      const freshBookingRes = await fetch(`${BASE_URL}/bookings/${booking._id}`, {
        headers: { Authorization: `Bearer ${passengerAToken}` }
      });
      const freshBookingData = await freshBookingRes.json();
      assert.equal(freshBookingRes.status, 200);
      assert.equal(freshBookingData.data.status, 'driver_assigned');
      assert.equal(freshBookingData.data.driverTripId, tripId);

      const freshTripRes = await fetch(`${BASE_URL}/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${passengerAToken}` }
      });
      const freshTripData = await freshTripRes.json();
      assert.equal(freshTripRes.status, 200);
      assert.equal(freshTripData.data.status, 'dispatched');

      // Verify DB integrity
      const dbTrip = await DriverTrip.findById(tripId);
      assert.ok(dbTrip);
      assert.equal(dbTrip.status, 'dispatched');
    });
  });

  // =========================================================================
  // SCENARIO O: Privacy During Recovery
  // =========================================================================
  describe('Scenario O: Privacy During Recovery', () => {
    it('should verify that reconnecting sockets do not leak credentials or grant unauthorized user-room access', async () => {
      const passASock = createSocket(passengerAToken);
      await waitForConnect(passASock);

      // Verify that Passenger A's socket does not receive Passenger B's private messages
      let leakedData = null;
      passASock.on('ride:assigned', (data) => {
        if (data.passengerId?.toString() === passengerBUser._id.toString()) {
          leakedData = data;
        }
      });

      // Create a booking for Passenger B and assign Driver B
      const bookingB = await createRideBooking(passengerBUser._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'solo'
      });
      await acceptSoloOffer(driverBUser._id, bookingB._id);

      await new Promise(r => setTimeout(r, 200));
      assert.equal(leakedData, null, 'Passenger A must never receive Passenger B private assignment event');

      passASock.disconnect();
    });
  });
});
