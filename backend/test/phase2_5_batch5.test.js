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
import { createRideBooking, cancelBooking } from '../src/services/bookingService.js';
import { acceptSoloOffer, findEligibleDrivers } from '../src/services/dispatchService.js';
import { executeTripStop } from '../src/services/tripService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.e2e') });

const BASE_URL = 'http://localhost:5000/api/v1';
const SOCKET_URL = 'http://localhost:5000';

const ADMIN_CREDS = {
  email: 'admin.e2e@campusride.ug.edu.gh',
  password: 'E2EAdminPass2026!'
};

const PASSENGER_CREDS = {
  email: 'passenger.a@campusride.ug.edu.gh',
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

describe('CampusRide Phase 2.5 Batch 5 — Web-Admin Real-Time Dashboard & Monitoring Validation', () => {
  let adminToken = null;
  let adminUser = null;
  let passengerToken = null;
  let passengerUser = null;
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
    adminUser = adminData.data.user;

    const passLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PASSENGER_CREDS)
    });
    const passData = await passLoginRes.json();
    assert.equal(passLoginRes.status, 200, 'Passenger login must succeed');
    passengerToken = passData.data.token;
    passengerUser = passData.data.user;

    const driverALoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DRIVER_A_CREDS)
    });
    const driverAData = await driverALoginRes.json();
    assert.equal(driverALoginRes.status, 200, 'Driver A login must succeed');
    driverAToken = driverAData.data.token;
    driverAUser = driverAData.data.user;

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
    passengerUser = await User.findOne({ email: PASSENGER_CREDS.email });
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

    // Clean any prior bookings/trips for test users
    const testUserIds = [passengerUser?._id, driverAUser?._id, driverBUser?._id].filter(Boolean);
    await DriverTrip.deleteMany({ driverId: { $in: [driverAUser?._id, driverBUser?._id] } });
    await RideBooking.deleteMany({ passengerId: { $in: testUserIds } });
  });

  after(async () => {
    const testUserIds = [passengerUser?._id, driverAUser?._id, driverBUser?._id].filter(Boolean);
    await DriverTrip.deleteMany({ driverId: { $in: [driverAUser?._id, driverBUser?._id] } });
    await RideBooking.deleteMany({ passengerId: { $in: testUserIds } });
    await mongoose.disconnect();
  });

  // =========================================================================
  // SCENARIO A: ADMIN AUTHENTICATION
  // =========================================================================
  describe('Scenario A: Admin Authentication & Access Control', () => {
    it('A1: should authenticate valid admin and return valid session token', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_CREDS.email, password: ADMIN_CREDS.password, role: 'admin' })
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data.token, 'Token must be returned');
      assert.equal(data.data.user.role, 'admin');
    });

    it('A2: should reject invalid admin credentials', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_CREDS.email, password: 'WrongPassword999!', role: 'admin' })
      });
      const data = await res.json();
      assert.equal(res.status, 401);
      assert.equal(data.success, false);
    });

    it('A3: should allow authenticated admin access to protected monitoring endpoints', async () => {
      const snapshotRes = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const snapshotData = await snapshotRes.json();
      assert.equal(snapshotRes.status, 200);
      assert.equal(snapshotData.success, true);
      assert.ok(snapshotData.data.metrics);
      assert.ok(Array.isArray(snapshotData.data.activeTrips));
      assert.ok(Array.isArray(snapshotData.data.driverRoster));

      const dashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const dashData = await dashRes.json();
      assert.equal(dashRes.status, 200);
      assert.equal(dashData.success, true);
      assert.ok(dashData.data.stats);
    });

    it('A4: should reject unauthenticated access to monitoring endpoints', async () => {
      const res = await fetch(`${BASE_URL}/admin/monitoring/snapshot`);
      const data = await res.json();
      assert.equal(res.status, 401);
      assert.equal(data.success, false);
      assert.equal(data.error?.code, 'AUTH_NO_TOKEN');
    });

    it('A5: should reject non-admin (passenger/driver) access to admin monitoring', async () => {
      const passRes = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${passengerToken}` }
      });
      const passData = await passRes.json();
      assert.equal(passRes.status, 403);
      assert.equal(passData.error?.code, 'FORBIDDEN');

      const driverRes = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${driverAToken}` }
      });
      const driverData = await driverRes.json();
      assert.equal(driverRes.status, 403);
      assert.equal(driverData.error?.code, 'FORBIDDEN');
    });
  });

  // =========================================================================
  // SCENARIO B: ADMIN SOCKET CONNECTION
  // =========================================================================
  describe('Scenario B: Admin Socket Connection & Authorization', () => {
    it('B1: should establish authenticated socket connection with valid admin token', async () => {
      const adminSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token: adminToken }
      });

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Socket connection timed out')), 5000);
        adminSocket.on('connect', () => {
          clearTimeout(timeout);
          assert.ok(adminSocket.connected);
          adminSocket.disconnect();
          resolve();
        });
        adminSocket.on('connect_error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    });

    it('B2: should reject socket connection with missing token', async () => {
      const unauthSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: {}
      });

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          unauthSocket.disconnect();
          reject(new Error('Expected rejection but timed out'));
        }, 5000);
        unauthSocket.on('connect', () => {
          clearTimeout(timeout);
          unauthSocket.disconnect();
          reject(new Error('Unauthenticated socket should NOT connect'));
        });
        unauthSocket.on('connect_error', (err) => {
          clearTimeout(timeout);
          assert.match(err.message, /AUTH_NO_TOKEN/);
          unauthSocket.disconnect();
          resolve();
        });
      });
    });

    it('B3: should reject socket connection with invalid/tampered token', async () => {
      const badSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token: 'invalid_tampered_token_xyz' }
      });

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          badSocket.disconnect();
          reject(new Error('Expected rejection but timed out'));
        }, 5000);
        badSocket.on('connect', () => {
          clearTimeout(timeout);
          badSocket.disconnect();
          reject(new Error('Invalid token socket should NOT connect'));
        });
        badSocket.on('connect_error', (err) => {
          clearTimeout(timeout);
          assert.match(err.message, /AUTH_INVALID_TOKEN/);
          badSocket.disconnect();
          resolve();
        });
      });
    });
  });

  // =========================================================================
  // SCENARIO C: LIVE DRIVER TELEMETRY & SOCKET PROPAGATION
  // =========================================================================
  describe('Scenario C: Live Driver Telemetry & Monitoring Reflection', () => {
    it('C1-C5: should test telemetry delivery to admin socket and verify existing behavior', async () => {
      // Connect admin socket listening for telemetry
      const adminSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token: adminToken }
      });

      const driverSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token: driverAToken }
      });

      await Promise.all([
        new Promise(resolve => adminSocket.on('connect', resolve)),
        new Promise(resolve => driverSocket.on('connect', resolve))
      ]);

      const receivedAdminTelemetry = [];
      adminSocket.on('driver:telemetry', (data) => {
        receivedAdminTelemetry.push(data);
      });

      // Emit driver telemetry from driverSocket
      const testCoordinates = [-0.1876, 5.635];
      driverSocket.emit('driver:telemetry', {
        coordinates: testCoordinates,
        heading: 90,
        speed: 25,
        timestamp: new Date()
      });

      // Allow event propagation
      await new Promise(r => setTimeout(r, 600));

      // Check User database model update (verifies backend received and persisted telemetry)
      const updatedDriver = await User.findById(driverAUser._id);
      assert.deepEqual(updatedDriver.currentLocation.coordinates, testCoordinates, 'Database must record updated driver GPS');

      // Verify monitoring snapshot reflects driver position
      const snapshotRes = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const snapshotData = await snapshotRes.json();
      assert.equal(snapshotData.success, true);
      const rosterEntry = snapshotData.data.driverRoster.find(d => d.id === driverAUser._id.toString());
      assert.ok(rosterEntry, 'Driver must appear in monitoring roster');
      assert.equal(rosterEntry.status, 'AVAILABLE');

      // Check whether admin socket received real-time socket event or if existing architecture uses polling
      console.log('Admin socket received telemetry count:', receivedAdminTelemetry.length);

      adminSocket.disconnect();
      driverSocket.disconnect();
    });
  });

  // =========================================================================
  // SCENARIO E: DRIVER ADMIN STATE & DISPATCH ELIGIBILITY
  // =========================================================================
  describe('Scenario E: Driver State Synchronization & Dispatch Eligibility', () => {
    it('E1: should verify approved driver is initially represented as available in monitoring and eligible for dispatch', async () => {
      const eligible = await findEligibleDrivers({ coordinates: [-0.1876, 5.635], maxDistance: 5000 });
      const eligibleIds = eligible.map(d => d._id.toString());
      assert.ok(eligibleIds.includes(driverAUser._id.toString()), 'Driver A must be dispatch eligible initially');

      const snapshotRes = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const snapshotData = await snapshotRes.json();
      const driverEntry = snapshotData.data.driverRoster.find(d => d.id === driverAUser._id.toString());
      assert.equal(driverEntry.status, 'AVAILABLE');
    });

    it('E2 & E3: should suspend driver via admin API and verify immediate dispatch ineligibility and suspension representation', async () => {
      // 1. Admin suspends driver via updateUserStatus
      const suspendRes = await fetch(`${BASE_URL}/admin/users/${driverAUser._id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'suspend' })
      });
      const suspendData = await suspendRes.json();
      assert.equal(suspendRes.status, 200);
      assert.equal(suspendData.success, true);
      assert.equal(suspendData.data.isSuspended, true);
      assert.equal(suspendData.data.isOnline, false);

      // 2. Verify admin monitoring snapshot reflects SUSPENDED
      const snapshotRes = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const snapshotData = await snapshotRes.json();
      const driverEntry = snapshotData.data.driverRoster.find(d => d.id === driverAUser._id.toString());
      assert.equal(driverEntry.status, 'SUSPENDED');
      assert.ok(driverEntry.infractionsLog.length > 0, 'Infractions log must record suspension');

      // 3. Verify driver is now strictly EXCLUDED from dispatch discovery
      const eligible = await findEligibleDrivers({ coordinates: [-0.1876, 5.635], maxDistance: 5000 });
      const eligibleIds = eligible.map(d => d._id.toString());
      assert.ok(!eligibleIds.includes(driverAUser._id.toString()), 'Suspended driver must NOT be dispatch eligible');

      // 4. Verify driver protected API blocks suspended driver with ACCOUNT_SUSPENDED
      const driverProfileRes = await fetch(`${BASE_URL}/driver/profile`, {
        headers: { Authorization: `Bearer ${driverAToken}` }
      });
      const driverProfileData = await driverProfileRes.json();
      assert.equal(driverProfileRes.status, 403);
      assert.equal(driverProfileData.error?.code, 'ACCOUNT_SUSPENDED');
    });

    it('E4: should restore driver via admin API and verify dispatch eligibility is restored', async () => {
      // 1. Admin reactivates driver
      const activateRes = await fetch(`${BASE_URL}/admin/users/${driverAUser._id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'activate' })
      });
      const activateData = await activateRes.json();
      assert.equal(activateRes.status, 200);
      assert.equal(activateData.success, true);
      assert.equal(activateData.data.isSuspended, false);

      // 2. Driver goes back online
      await User.updateOne(
        { _id: driverAUser._id },
        { $set: { isOnline: true, lastSeen: new Date() } }
      );

      // 3. Verify driver returns to dispatch discovery
      const eligible = await findEligibleDrivers({ coordinates: [-0.1876, 5.635], maxDistance: 5000 });
      const eligibleIds = eligible.map(d => d._id.toString());
      assert.ok(eligibleIds.includes(driverAUser._id.toString()), 'Restored online driver must be dispatch eligible again');

      // 4. Verify monitoring roster returns to AVAILABLE
      const snapshotRes = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const snapshotData = await snapshotRes.json();
      const driverEntry = snapshotData.data.driverRoster.find(d => d.id === driverAUser._id.toString());
      assert.equal(driverEntry.status, 'AVAILABLE');
    });
  });

  // =========================================================================
  // SCENARIO F: LIVE ACTIVE TRIP MONITORING & METRICS SYNCHRONIZATION
  // =========================================================================
  describe('Scenario F: Live Active Trip Monitoring & Metrics Lifecycle', () => {
    it('F1-F4: should reflect active trip creation, progression, and completion in monitoring snapshot', async () => {
      // F1. Baseline: zero active trips
      const baselineSnapshot = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).then(r => r.json());
      const initialActiveCount = baselineSnapshot.data.activeTrips.length;

      // F2. Passenger creates booking and driver accepts
      const booking = await createRideBooking(passengerUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);
      assert.equal(trip.status, 'dispatched');

      // Active trip must appear in monitoring snapshot
      const activeSnapshot = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).then(r => r.json());

      assert.equal(activeSnapshot.data.activeTrips.length, initialActiveCount + 1, 'Active trip count must increment');
      const tripCard = activeSnapshot.data.activeTrips.find(t => t.id === trip._id.toString().substring(Math.max(0, trip._id.toString().length - 6)).toUpperCase());
      assert.ok(tripCard, 'Dispatched trip must appear in active trips list');
      assert.equal(tripCard.status, 'DISPATCHED');
      assert.equal(tripCard.driverName, driverAUser.fullName);

      // Verify dashboard metric
      const dashData = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).then(r => r.json());
      const activeRidesStat = dashData.data.stats.find(s => s.label === 'Active Rides Now');
      assert.equal(parseInt(activeRidesStat.value, 10), initialActiveCount + 1);

      // F3. Trip progresses: Driver arrives at pickup then completes pickup
      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
      await executeTripStop({
        driverId: driverAUser._id,
        tripId: trip._id,
        stopId: pickupStop.stopId,
        targetStatus: 'arrived',
        enforceProximity: false
      });
      await executeTripStop({
        driverId: driverAUser._id,
        tripId: trip._id,
        stopId: pickupStop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      const inProgressSnapshot = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).then(r => r.json());
      const inProgressCard = inProgressSnapshot.data.activeTrips.find(t => t.id === tripCard.id);
      assert.ok(inProgressCard);
      assert.equal(inProgressCard.status, 'ACTIVE');

      // F4. Trip completes: Driver completes dropoff
      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');
      await executeTripStop({
        driverId: driverAUser._id,
        tripId: trip._id,
        stopId: dropoffStop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      // Active trip must disappear from monitoring snapshot
      const finalSnapshot = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).then(r => r.json());

      const completedCard = finalSnapshot.data.activeTrips.find(t => t.id === tripCard.id);
      assert.equal(completedCard, undefined, 'Completed trip must NO LONGER appear in active trips list');
      assert.equal(finalSnapshot.data.activeTrips.length, initialActiveCount, 'Active trip count must return to baseline');

      // Completed today metric increments
      const completedMetric = finalSnapshot.data.metrics.find(m => m.label === 'Completed Today');
      assert.ok(parseInt(completedMetric.value, 10) >= 1, 'Completed Today count must be >= 1');
    });

    it('F5: should reflect trip cancellation and cleanly remove from active trips', async () => {
      const booking = await createRideBooking(passengerUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);

      // Verify trip is active
      const snapshot1 = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).then(r => r.json());
      assert.ok(snapshot1.data.activeTrips.some(t => t.id === trip._id.toString().substring(Math.max(0, trip._id.toString().length - 6)).toUpperCase()));

      // Passenger cancels pre-pickup
      await cancelBooking(booking._id, passengerUser._id, 'passenger', 'Cancellation test');

      // Verify trip disappeared from active trips
      const snapshot2 = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).then(r => r.json());
      const tripInActive = snapshot2.data.activeTrips.some(t => t.id === trip._id.toString().substring(Math.max(0, trip._id.toString().length - 6)).toUpperCase());
      assert.equal(tripInActive, false, 'Cancelled trip must disappear from active trips');
    });
  });

  // =========================================================================
  // SCENARIO J: ADMIN LOGOUT / RE-LOGIN
  // =========================================================================
  describe('Scenario J: Admin Session Lifecycle (Login -> Access -> Invalidation -> Re-login)', () => {
    it('J1-J4: should verify full session lifecycle and token clearing', async () => {
      // 1. Fresh login
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_CREDS.email, password: ADMIN_CREDS.password, role: 'admin' })
      });
      const loginData = await loginRes.json();
      assert.equal(loginRes.status, 200);
      const sessionToken = loginData.data.token;

      // 2. Protected access succeeds
      const accessRes = await fetch(`${BASE_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      assert.equal(accessRes.status, 200);

      // 3. Simulating logout: token removed by client
      // Request without token is rejected
      const unauthRes = await fetch(`${BASE_URL}/admin/profile`);
      assert.equal(unauthRes.status, 401);

      // 4. Re-login creates new valid session
      const reloginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_CREDS.email, password: ADMIN_CREDS.password, role: 'admin' })
      });
      const reloginData = await reloginRes.json();
      assert.equal(reloginRes.status, 200);
      assert.ok(reloginData.data.token);

      const reaccessRes = await fetch(`${BASE_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${reloginData.data.token}` }
      });
      assert.equal(reaccessRes.status, 200);
    });
  });

  // =========================================================================
  // SCENARIO K: PRIVACY & DATA LEAKAGE AUDIT
  // =========================================================================
  describe('Scenario K: Privacy & Information Isolation Audit', () => {
    it('K1: should verify monitoring snapshots do not leak passwords, hashes, JWTs, or unnecessary PII', async () => {
      const snapshotRes = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const text = await snapshotRes.text();

      // Forensic checks for sensitive strings
      assert.ok(!text.includes('password'), 'Snapshot must not contain password fields');
      assert.ok(!text.includes('$2a$') && !text.includes('$2b$'), 'Snapshot must not contain bcrypt hashes');
      assert.ok(!text.includes('eyJhbGciOi'), 'Snapshot must not leak JWT tokens');
    });

    it('K2: should verify dashboard data does not leak credential artifacts', async () => {
      const dashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const text = await dashRes.text();

      assert.ok(!text.includes('password'), 'Dashboard must not contain password fields');
      assert.ok(!text.includes('$2a$') && !text.includes('$2b$'), 'Dashboard must not contain bcrypt hashes');
      assert.ok(!text.includes('eyJhbGciOi'), 'Dashboard must not leak JWT tokens');
    });
  });

  // =========================================================================
  // SCENARIO D: TELEMETRY ORDERING & COMPLETED TRIP STALE STATE
  // =========================================================================
  describe('Scenario D: Telemetry Ordering & Stale Event Protection', () => {
    it('D1: should verify that post-completion delayed telemetry cannot resurrect a completed DriverTrip', async () => {
      // 1. Create and complete a trip
      const booking = await createRideBooking(passengerUser._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });
      const { trip } = await acceptSoloOffer(driverAUser._id, booking._id);

      const pickupStop = trip.tripStops.find(s => s.stopType === 'pickup');
      await executeTripStop({
        driverId: driverAUser._id,
        tripId: trip._id,
        stopId: pickupStop.stopId,
        targetStatus: 'arrived',
        enforceProximity: false
      });
      await executeTripStop({
        driverId: driverAUser._id,
        tripId: trip._id,
        stopId: pickupStop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      const dropoffStop = trip.tripStops.find(s => s.stopType === 'dropoff');
      await executeTripStop({
        driverId: driverAUser._id,
        tripId: trip._id,
        stopId: dropoffStop.stopId,
        targetStatus: 'completed',
        enforceProximity: false
      });

      // Trip is completed
      const tripCompleted = await DriverTrip.findById(trip._id);
      assert.equal(tripCompleted.status, 'completed');

      // 2. Simulate delayed/stale telemetry arriving with completed tripId
      const driverSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token: driverAToken }
      });
      await new Promise(r => driverSocket.on('connect', r));

      driverSocket.emit('driver:telemetry', {
        tripId: trip._id.toString(),
        coordinates: [-0.1876, 5.635],
        heading: 0,
        speed: 10,
        timestamp: new Date(Date.now() - 60000)
      });
      await new Promise(r => setTimeout(r, 600));
      driverSocket.disconnect();

      // Trip must remain completed, NOT resurrected to active or dispatched
      const tripAfterStale = await DriverTrip.findById(trip._id);
      assert.equal(tripAfterStale.status, 'completed', 'Completed trip must not be resurrected by late telemetry');
    });
  });

  // =========================================================================
  // SCENARIO G: LIVE DASHBOARD METRICS SYNCHRONIZATION
  // =========================================================================
  describe('Scenario G: Live Dashboard Metrics vs Database Ground Truth', () => {
    it('G1: should verify dashboard metrics exactly match MongoDB counts', async () => {
      const [dbActiveTrips, dbOnlineDrivers, dbRegisteredDrivers] = await Promise.all([
        DriverTrip.countDocuments({ status: { $in: ['dispatched', 'active'] } }),
        User.countDocuments({ role: 'driver', approvalStatus: 'approved', isOnline: true }),
        User.countDocuments({ role: 'driver' })
      ]);

      const dashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const dashData = await dashRes.json();
      assert.equal(dashRes.status, 200);

      const activeStat = dashData.data.stats.find(s => s.label === 'Active Rides Now');
      const onlineStat = dashData.data.stats.find(s => s.label === 'Drivers Online');
      const regDriverStat = dashData.data.stats.find(s => s.label === 'Drivers Registered');

      assert.equal(parseInt(activeStat.value, 10), dbActiveTrips, 'Active Rides Now metric must match DB count');
      assert.equal(parseInt(onlineStat.value, 10), dbOnlineDrivers, 'Drivers Online metric must match DB count');
      assert.equal(parseInt(regDriverStat.value, 10), dbRegisteredDrivers, 'Drivers Registered metric must match DB count');
    });
  });

  // =========================================================================
  // SCENARIO H: DUPLICATE EVENTS & IDENTITY PRESERVATION
  // =========================================================================
  describe('Scenario H: Duplicate Events & Identity Preservation', () => {
    it('H1: should verify repeated telemetry from same driver does not create duplicate roster entries', async () => {
      // Send repeated telemetry from Driver A
      const driverSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token: driverAToken }
      });
      await new Promise(r => driverSocket.on('connect', r));

      for (let i = 0; i < 5; i++) {
        driverSocket.emit('driver:telemetry', {
          coordinates: [-0.1876, 5.635 + i * 0.0001],
          heading: 90,
          speed: 20,
          timestamp: new Date()
        });
      }
      await new Promise(r => setTimeout(r, 600));
      driverSocket.disconnect();

      const snapshot = await fetch(`${BASE_URL}/admin/monitoring/snapshot`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).then(r => r.json());

      const driverEntries = snapshot.data.driverRoster.filter(d => d.id === driverAUser._id.toString());
      assert.equal(driverEntries.length, 1, 'Driver must appear exactly once in driver roster');
    });
  });

  // =========================================================================
  // SCENARIO I: MULTIPLE ADMIN CLIENTS
  // =========================================================================
  describe('Scenario I: Multiple Concurrent Admin Clients', () => {
    it('I1: should support concurrent admin clients receiving coherent monitoring snapshots', async () => {
      // Two admin clients fetch monitoring snapshots concurrently
      const [res1, res2] = await Promise.all([
        fetch(`${BASE_URL}/admin/monitoring/snapshot`, { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch(`${BASE_URL}/admin/monitoring/snapshot`, { headers: { Authorization: `Bearer ${adminToken}` } })
      ]);

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

      assert.equal(res1.status, 200);
      assert.equal(res2.status, 200);
      assert.equal(data1.data.activeTrips.length, data2.data.activeTrips.length);
      assert.equal(data1.data.driverRoster.length, data2.data.driverRoster.length);
    });
  });

  // =========================================================================
  // SCENARIO L: BACKEND / UI CONSISTENCY AUDIT
  // =========================================================================
  describe('Scenario L: Backend Ground Truth vs Admin UI Snapshot Consistency', () => {
    it('L1: should verify complete alignment between database models and monitoring projection', async () => {
      const [dbTrips, dbDrivers, snapshotRes] = await Promise.all([
        DriverTrip.find({ status: { $in: ['dispatched', 'active'] } }),
        User.find({ role: 'driver', approvalStatus: 'approved' }),
        fetch(`${BASE_URL}/admin/monitoring/snapshot`, { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json())
      ]);

      assert.equal(snapshotRes.data.activeTrips.length, dbTrips.length, 'Snapshot activeTrips count must equal DB active trips count');
      assert.equal(snapshotRes.data.driverRoster.length, dbDrivers.length, 'Snapshot driverRoster count must equal DB approved drivers count');

      // Check each DB trip is projected in activeTrips
      for (const trip of dbTrips) {
        const shortId = trip._id.toString().substring(Math.max(0, trip._id.toString().length - 6)).toUpperCase();
        assert.ok(snapshotRes.data.activeTrips.some(t => t.id === shortId), `Trip ${shortId} must be in snapshot`);
      }
    });
  });
});

