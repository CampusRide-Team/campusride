import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../src/models/User.js';
import RideBooking from '../src/models/RideBooking.js';
import DriverTrip from '../src/models/DriverTrip.js';
import CampusPOI from '../src/models/CampusPOI.js';

import { createRideBooking, cancelBooking } from '../src/services/bookingService.js';
import { acceptSoloOffer, acceptSharedOffer } from '../src/services/dispatchService.js';
import { createSharedTrip, insertBookingIntoSharedTrip } from '../src/services/tripService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('CampusRide Phase 2.5 Batch 4 — Concurrency, Race Conditions & Contention Validation', () => {
  let mongoAvailable = false;
  let passengerA = null;
  let passengerB = null;
  let driverA = null;
  let driverB = null;
  let tempPassengerC = null;
  let tempPassengerD = null;

  before(async () => {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride_test';
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      }
      mongoAvailable = true;

      // Locate canonical E2E accounts
      passengerA = await User.findOne({ email: 'passenger.a@campusride.ug.edu.gh' });
      passengerB = await User.findOne({ email: 'passenger.b@campusride.ug.edu.gh' });
      driverA = await User.findOne({ email: 'driver.a@campusride.ug.edu.gh' });
      driverB = await User.findOne({ email: 'driver.b@campusride.ug.edu.gh' });

      assert.ok(passengerA, 'Canonical Passenger A must exist');
      assert.ok(passengerB, 'Canonical Passenger B must exist');
      assert.ok(driverA, 'Canonical Driver A must exist');
      assert.ok(driverB, 'Canonical Driver B must exist');

      // Create isolated temporary passengers in test namespace for Scenario A contention
      await User.deleteMany({ email: /@test-batch4\.ug\.edu\.gh$/ });
      tempPassengerC = await User.create({
        fullName: 'Batch 4 Temp Passenger C',
        email: 'passenger.c@test-batch4.ug.edu.gh',
        phoneNumber: '+233240004001',
        password: 'Password123!',
        role: 'passenger',
        approvalStatus: 'approved'
      });

      tempPassengerD = await User.create({
        fullName: 'Batch 4 Temp Passenger D',
        email: 'passenger.d@test-batch4.ug.edu.gh',
        phoneNumber: '+233240004002',
        password: 'Password123!',
        role: 'passenger',
        approvalStatus: 'approved'
      });

    } catch (err) {
      console.warn('MongoDB connection error for Batch 4 tests:', err.message);
      mongoAvailable = false;
    }
  });

  beforeEach(async () => {
    if (!mongoAvailable) return;

    // Reset online state & heartbeats for canonical drivers
    await User.updateOne(
      { _id: driverA._id },
      { 
        $set: { 
          isOnline: true, 
          lastSeen: new Date(), 
          approvalStatus: 'approved', 
          isApproved: true,
          currentLocation: { type: 'Point', coordinates: [-0.1876, 5.635] } 
        } 
      }
    );
    await User.updateOne(
      { _id: driverB._id },
      { 
        $set: { 
          isOnline: true, 
          lastSeen: new Date(), 
          approvalStatus: 'approved', 
          isApproved: true,
          currentLocation: { type: 'Point', coordinates: [-0.1876, 5.635] } 
        } 
      }
    );

    // Clean up any lingering trips or bookings from previous runs
    const testUserIds = [
      passengerA._id,
      passengerB._id,
      driverA._id,
      driverB._id,
      tempPassengerC?._id,
      tempPassengerD?._id
    ].filter(Boolean);

    await DriverTrip.deleteMany({ driverId: { $in: [driverA._id, driverB._id] } });
    await RideBooking.deleteMany({ passengerId: { $in: testUserIds } });
  });

  after(async () => {
    if (mongoAvailable) {
      const testUserIds = [
        passengerA?._id,
        passengerB?._id,
        driverA?._id,
        driverB?._id,
        tempPassengerC?._id,
        tempPassengerD?._id
      ].filter(Boolean);
      await DriverTrip.deleteMany({ driverId: { $in: [driverA?._id, driverB?._id] } });
      await RideBooking.deleteMany({ passengerId: { $in: testUserIds } });
      await User.deleteMany({ email: /@test-batch4\.ug\.edu\.gh$/ });
      await mongoose.disconnect();
    }
  });

  // =========================================================================
  // SCENARIO A: LAST AVAILABLE SHARED SEAT CONTENTION
  // =========================================================================
  describe('Scenario A: Last Available Shared Seat Contention', () => {
    it('should allow only one passenger to claim the last seat and reject the competing passenger without exceeding capacity', async function() {
      if (!mongoAvailable) return this.skip();

      // Driver A has chosenSharedCapacity = 3, physicalCapacity = 4
      // 1. Initial shared booking by Passenger A
      const booking1 = await createRideBooking(passengerA._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const { trip } = await createSharedTrip(driverA._id, booking1._id);
      assert.equal(trip.maxCapacity, 3);
      assert.equal(trip.reservedPassengerCount, 1);

      // 2. Second shared booking by Passenger B joins the trip
      const booking2 = await createRideBooking(passengerB._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });

      const secondJoin = await insertBookingIntoSharedTrip(driverA._id, trip._id, booking2._id);
      assert.equal(secondJoin.trip.reservedPassengerCount, 2);

      // Current state: 2 of 3 seats reserved. Exactly 1 seat remains.
      // 3. Two competing bookings created: tempPassengerC and tempPassengerD
      const booking3 = await createRideBooking(tempPassengerC._id, {
        pickup: 'Commonwealth Hall',
        dropoff: 'Akuafo Hall',
        rideMode: 'shared'
      });

      const booking4 = await createRideBooking(tempPassengerD._id, {
        pickup: 'Commonwealth Hall',
        dropoff: 'Akuafo Hall',
        rideMode: 'shared'
      });

      // 4. Concurrent race to claim the 3rd and final seat
      const raceResults = await Promise.allSettled([
        insertBookingIntoSharedTrip(driverA._id, trip._id, booking3._id),
        insertBookingIntoSharedTrip(driverA._id, trip._id, booking4._id)
      ]);

      const fulfilled = raceResults.filter(r => r.status === 'fulfilled');
      const rejected = raceResults.filter(r => r.status === 'rejected');

      // Assertions: Exactly one winner, exactly one rejection
      assert.equal(fulfilled.length, 1, 'Exactly one concurrent booking claim must succeed for the last seat');
      assert.equal(rejected.length, 1, 'The competing booking claim must be rejected due to capacity limit');
      assert.match(rejected[0].reason.message, /TRIP_CAPACITY_EXCEEDED/);

      // 5. Database Invariant Audit:
      const verifiedTrip = await DriverTrip.findById(trip._id);
      assert.equal(verifiedTrip.reservedPassengerCount, 3, 'reservedPassengerCount must strictly equal 3');
      assert.ok(verifiedTrip.reservedPassengerCount <= verifiedTrip.maxCapacity, 'reservedPassengerCount must not exceed maxCapacity');
      assert.equal(verifiedTrip.activePassengerCount, 0, 'activePassengerCount must remain 0 before any pickups occur');

      // Manifest Audit: exactly 3 distinct bookings across trip stops
      const distinctBookingsInStops = [...new Set(verifiedTrip.tripStops.map(s => s.bookingId.toString()))];
      assert.equal(distinctBookingsInStops.length, 3, 'Manifest must contain exactly 3 distinct bookings');
      assert.equal(verifiedTrip.tripStops.length, 6, 'Manifest must contain exactly 6 stops (3 pickups + 3 dropoffs)');

      // Verify winning booking status
      const winningBookingId = fulfilled[0].value.booking._id;
      const verifiedWinningBooking = await RideBooking.findById(winningBookingId);
      assert.equal(verifiedWinningBooking.status, 'driver_assigned');
      assert.equal(verifiedWinningBooking.driverTripId.toString(), verifiedTrip._id.toString());

      // Verify losing booking status remains pending
      const losingBookingId = winningBookingId.toString() === booking3._id.toString() ? booking4._id : booking3._id;
      const verifiedLosingBooking = await RideBooking.findById(losingBookingId);
      assert.equal(verifiedLosingBooking.status, 'pending', 'Losing booking must remain pending without driver assignment');
      assert.equal(verifiedLosingBooking.driverTripId, null, 'Losing booking must not be linked to DriverTrip');
    });
  });

  // =========================================================================
  // SCENARIO B: MULTIPLE DRIVERS CLAIMING THE SAME OFFER
  // =========================================================================
  describe('Scenario B: Multiple Drivers Claiming the Same Offer', () => {
    it('should atomically allow only one driver to claim offer and reject the competing driver', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(passengerA._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      // Driver A and Driver B concurrently attempt to claim the exact same booking
      const raceResults = await Promise.allSettled([
        acceptSoloOffer(driverA._id, booking._id),
        acceptSoloOffer(driverB._id, booking._id)
      ]);

      const fulfilled = raceResults.filter(r => r.status === 'fulfilled');
      const rejected = raceResults.filter(r => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one driver acceptance must succeed');
      assert.equal(rejected.length, 1, 'The competing driver acceptance must fail');
      assert.match(rejected[0].reason.message, /BOOKING_ALREADY_CLAIMED/);

      const winningResult = fulfilled[0].value;
      const winningDriverId = winningResult.trip.driverId.toString();
      const losingDriverId = winningDriverId === driverA._id.toString() ? driverB._id.toString() : driverA._id.toString();

      // Database Invariant Audit:
      // 1. Booking has single assignment
      const persistedBooking = await RideBooking.findById(booking._id);
      assert.equal(persistedBooking.status, 'driver_assigned');
      assert.equal(persistedBooking.driverId.toString(), winningDriverId);
      assert.equal(persistedBooking.driverTripId.toString(), winningResult.trip._id.toString());

      // 2. Exactly ONE DriverTrip created in DB for this booking
      const tripCount = await DriverTrip.countDocuments({ 'tripStops.bookingId': booking._id });
      assert.equal(tripCount, 1, 'Exactly one DriverTrip must exist for the booking');

      // 3. Winning driver has 1 active trip; Losing driver has 0 active trips
      const winningDriverTrips = await DriverTrip.countDocuments({
        driverId: winningDriverId,
        status: { $in: ['dispatched', 'active'] }
      });
      const losingDriverTrips = await DriverTrip.countDocuments({
        driverId: losingDriverId,
        status: { $in: ['dispatched', 'active'] }
      });

      assert.equal(winningDriverTrips, 1, 'Winning driver must have exactly 1 active trip');
      assert.equal(losingDriverTrips, 0, 'Losing driver must have 0 active trips');
    });
  });

  // =========================================================================
  // SCENARIO C: PASSENGER CANCELLATION VS DRIVER ACCEPTANCE
  // =========================================================================
  describe('Scenario C: Passenger Cancellation vs Driver Acceptance', () => {
    it('should resolve concurrent cancellation and acceptance into a coherent terminal or assigned state without locking the driver', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(passengerA._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      // Passenger issues cancellation concurrently with Driver A acceptance
      const raceResults = await Promise.allSettled([
        cancelBooking(booking._id, passengerA._id, 'passenger', 'Passenger changed mind rapidly'),
        acceptSoloOffer(driverA._id, booking._id)
      ]);

      const updatedBooking = await RideBooking.findById(booking._id);
      const tripsForBooking = await DriverTrip.find({ 'tripStops.bookingId': booking._id });

      // The outcome must be one of two valid coherent states:
      // Outcome 1: Cancellation won before acceptance was committed
      //   -> booking status = 'cancelled'
      //   -> acceptance rejected (BOOKING_ALREADY_CLAIMED or similar)
      //   -> 0 active trips for driver, no locked driver
      // Outcome 2: Driver acceptance committed first, then cancellation processed the assigned trip
      //   -> booking status = 'cancelled'
      //   -> driverTrip is 'completed' (due to solo pre-pickup cancel remediation)
      //   -> driver is released, 0 active trips for driver
      // In NO CASE should the driver be left with an active/dispatched trip if booking is cancelled!

      assert.ok(['cancelled', 'driver_assigned'].includes(updatedBooking.status), 'Booking status must be coherent');

      if (updatedBooking.status === 'cancelled') {
        // Driver must NOT be locked with an active/dispatched trip
        const busyTrips = await DriverTrip.find({
          driverId: driverA._id,
          status: { $in: ['dispatched', 'active'] }
        });
        assert.equal(busyTrips.length, 0, 'Driver must have zero busy trips after cancellation settled');

        // If a trip was created, it must be terminal (completed)
        if (tripsForBooking.length > 0) {
          const trip = tripsForBooking[0];
          assert.equal(trip.status, 'completed', 'Trip must be completed if booking was cancelled pre-pickup');
          assert.equal(trip.activePassengerCount, 0);
          assert.equal(trip.reservedPassengerCount, 0);
        }
      } else {
        // If driver acceptance won completely and cancel was rejected
        assert.equal(tripsForBooking.length, 1);
        assert.equal(tripsForBooking[0].status, 'dispatched');
      }

      // Zero orphan trips
      const orphanTrips = await DriverTrip.countDocuments({
        'tripStops.0': { $exists: false }
      });
      assert.equal(orphanTrips, 0, 'No orphan trips without stops');
    });
  });

  // =========================================================================
  // SCENARIO D: DUPLICATE DRIVER ACCEPTANCE
  // =========================================================================
  describe('Scenario D: Duplicate Driver Acceptance', () => {
    it('should reject concurrent duplicate acceptance by the same driver without duplicating trips or capacity', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(passengerA._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      // Submit identical driver acceptance twice concurrently
      const duplicateResults = await Promise.allSettled([
        acceptSoloOffer(driverA._id, booking._id),
        acceptSoloOffer(driverA._id, booking._id)
      ]);

      const fulfilled = duplicateResults.filter(r => r.status === 'fulfilled');
      const rejected = duplicateResults.filter(r => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one acceptance must succeed');
      assert.equal(rejected.length, 1, 'Duplicate acceptance must be rejected');

      // Database checks:
      const tripCount = await DriverTrip.countDocuments({ 'tripStops.bookingId': booking._id });
      assert.equal(tripCount, 1, 'Must create exactly 1 DriverTrip, no duplicates');

      const driverActiveTrips = await DriverTrip.countDocuments({
        driverId: driverA._id,
        status: { $in: ['dispatched', 'active'] }
      });
      assert.equal(driverActiveTrips, 1, 'Driver must have exactly 1 active trip');
    });

    it('should reject rapid sequential duplicate acceptance by the same driver', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(passengerA._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      // First acceptance succeeds
      const firstResult = await acceptSoloOffer(driverA._id, booking._id);
      assert.ok(firstResult.trip);

      // Immediate sequential duplicate acceptance
      await assert.rejects(
        async () => {
          await acceptSoloOffer(driverA._id, booking._id);
        },
        /(DRIVER_ALREADY_HAS_ACTIVE_TRIP|BOOKING_ALREADY_CLAIMED)/
      );

      const tripCount = await DriverTrip.countDocuments({ 'tripStops.bookingId': booking._id });
      assert.equal(tripCount, 1, 'Trip count must remain exactly 1');
    });

    it('should reject duplicate pool acceptance by same driver for same booking on shared trip', async function() {
      if (!mongoAvailable) return this.skip();

      const booking1 = await createRideBooking(passengerA._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'shared'
      });

      const { trip } = await createSharedTrip(driverA._id, booking1._id);

      const booking2 = await createRideBooking(passengerB._id, {
        pickup: 'Night Market',
        dropoff: 'Evandy Hostel',
        rideMode: 'shared'
      });

      // Concurrent duplicate pool additions for booking2
      const raceResults = await Promise.allSettled([
        insertBookingIntoSharedTrip(driverA._id, trip._id, booking2._id),
        insertBookingIntoSharedTrip(driverA._id, trip._id, booking2._id)
      ]);

      const fulfilled = raceResults.filter(r => r.status === 'fulfilled');
      const rejected = raceResults.filter(r => r.status === 'rejected');

      assert.equal(fulfilled.length, 1, 'Exactly one pool join must succeed');
      assert.equal(rejected.length, 1, 'Duplicate pool join must be rejected');
      assert.match(rejected[0].reason.message, /BOOKING_ALREADY_CLAIMED/);

      const updatedTrip = await DriverTrip.findById(trip._id);
      assert.equal(updatedTrip.reservedPassengerCount, 2, 'reservedPassengerCount must be 2, not 3');

      // Ensure booking2 stops appear exactly once (pickup + dropoff)
      const b2Stops = updatedTrip.tripStops.filter(s => s.bookingId.toString() === booking2._id.toString());
      assert.equal(b2Stops.length, 2, 'Must have exactly 2 stops for booking2');
    });
  });

  // =========================================================================
  // SCENARIO E: DUPLICATE / REPEATED PASSENGER ACTION
  // =========================================================================
  describe('Scenario E: Duplicate / Repeated Passenger Action', () => {
    it('should safely handle concurrent duplicate passenger cancellation without double decrements or negative capacity', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(passengerA._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      const { trip } = await acceptSoloOffer(driverA._id, booking._id);

      // Passenger issues duplicate cancellation concurrently
      const results = await Promise.allSettled([
        cancelBooking(booking._id, passengerA._id, 'passenger', 'First cancel'),
        cancelBooking(booking._id, passengerA._id, 'passenger', 'Duplicate cancel')
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      // At least one must succeed; if both settle, the final state must be strictly non-negative
      assert.ok(fulfilled.length >= 1, 'At least one cancellation must succeed');

      const finalBooking = await RideBooking.findById(booking._id);
      assert.equal(finalBooking.status, 'cancelled');

      const finalTrip = await DriverTrip.findById(trip._id);
      assert.equal(finalTrip.status, 'completed');
      assert.equal(finalTrip.reservedPassengerCount, 0, 'reservedPassengerCount must not drop below 0');
      assert.equal(finalTrip.activePassengerCount, 0, 'activePassengerCount must not drop below 0');
      assert.ok(finalTrip.reservedPassengerCount >= 0, 'No negative capacity');
      assert.ok(finalTrip.activePassengerCount >= 0, 'No negative active count');
    });

    it('should reject sequential duplicate cancellation on already terminal booking', async function() {
      if (!mongoAvailable) return this.skip();

      const booking = await createRideBooking(passengerA._id, {
        pickup: 'Balme Library',
        dropoff: 'Pentagon Hostel',
        rideMode: 'solo'
      });

      // First cancel succeeds
      await cancelBooking(booking._id, passengerA._id, 'passenger', 'Initial cancel');
      const afterFirst = await RideBooking.findById(booking._id);
      assert.equal(afterFirst.status, 'cancelled');

      // Second cancel must be rejected
      await assert.rejects(
        async () => {
          await cancelBooking(booking._id, passengerA._id, 'passenger', 'Duplicate cancel attempt');
        },
        /Cannot cancel a booking that is already in terminal state/
      );

      const afterSecond = await RideBooking.findById(booking._id);
      assert.equal(afterSecond.status, 'cancelled');
    });
  });
});
