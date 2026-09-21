import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../src/models/User.js';
import RideBooking from '../src/models/RideBooking.js';
import { expireStaleBookings } from '../src/services/cronService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.e2e') });

describe('CampusRide — Cron MongoDB Cancellation Remediation Test', () => {
  let testPassenger = null;
  const createdBookingIds = [];

  before(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride_e2e';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    }

    testPassenger = await User.findOne({ email: 'passenger.a@campusride.ug.edu.gh' });
    if (!testPassenger) {
      testPassenger = await User.create({
        fullName: 'Cron Test Passenger',
        email: 'passenger.cron.test@campusride.ug.edu.gh',
        phoneNumber: '+233240099881',
        password: 'Password123!',
        role: 'passenger',
        approvalStatus: 'approved'
      });
    }
  });

  after(async () => {
    if (createdBookingIds.length > 0) {
      await RideBooking.deleteMany({ _id: { $in: createdBookingIds } });
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('Scenario 1: Transitions stale pending booking with null cancellation to cancelled_timeout without MongoDB error', async () => {
    // 1. Create a fresh pending booking where cancellation is null by default
    const booking = await RideBooking.create({
      passengerId: testPassenger._id,
      rideMode: 'solo',
      status: 'pending',
      pickup: {
        name: 'Balme Library',
        coordinates: { type: 'Point', coordinates: [-0.1870, 5.6508] },
        source: 'poi'
      },
      dropoff: {
        name: 'Night Market',
        coordinates: { type: 'Point', coordinates: [-0.1852, 5.6595] },
        source: 'poi'
      },
      fare: {
        baseFare: 8.0,
        distanceFare: 4.5,
        timeFare: 0.0,
        surgeMultiplier: 1.0,
        discountAmount: 0,
        totalFare: 12.5,
        currency: 'GHS',
        pricingModel: 'platform_calculated',
        paymentStatus: 'unpaid'
      },
      cancellation: null
    });
    createdBookingIds.push(booking._id);

    // 2. Backdate createdAt to 20 minutes ago to simulate an expired pending request
    const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
    await RideBooking.collection.updateOne(
      { _id: booking._id },
      { $set: { createdAt: twentyMinsAgo, cancellation: null } }
    );

    // 3. Verify initial state before timeout execution
    const beforeRecord = await RideBooking.findById(booking._id);
    assert.equal(beforeRecord.status, 'pending', 'Initial status must be pending');
    assert.equal(beforeRecord.cancellation, null, 'Initial cancellation must be null');
    assert.ok(beforeRecord.createdAt < new Date(Date.now() - 15 * 60 * 1000), 'Booking must be older than 15 minutes');

    // 4. Execute the production timeout logic (expireStaleBookings)
    const execTime = new Date();
    const result = await expireStaleBookings(execTime);
    assert.ok(result.bookingTimeoutResult.modifiedCount >= 1, 'At least 1 booking must have been modified by cron');

    // 5. Verify post-transition state in MongoDB
    const afterRecord = await RideBooking.findById(booking._id);
    assert.equal(afterRecord.status, 'cancelled_timeout', 'Target status must be cancelled_timeout');
    assert.notEqual(afterRecord.cancellation, null, 'cancellation subdocument must be populated');
    assert.equal(afterRecord.cancellation.cancelledByRole, 'system', 'cancelledByRole must be system');
    assert.equal(
      afterRecord.cancellation.reason,
      'Timed out - No available drivers accepted the dispatch offer within window',
      'cancellation.reason must match canonical timeout string'
    );
    assert.equal(afterRecord.cancellation.penaltyAmount, 0, 'penaltyAmount must be 0');
    assert.ok(afterRecord.cancellation.cancelledAt instanceof Date, 'cancelledAt must be a Date timestamp');
    assert.ok(Math.abs(afterRecord.cancellation.cancelledAt.getTime() - execTime.getTime()) < 5000, 'cancelledAt must be close to execution timestamp');
  });

  it('Scenario 2: Non-stale pending bookings (<15 minutes) remain untouched in pending state with null cancellation', async () => {
    // 1. Create a non-stale pending booking (5 minutes old)
    const freshBooking = await RideBooking.create({
      passengerId: testPassenger._id,
      rideMode: 'solo',
      status: 'pending',
      pickup: {
        name: 'UGCS',
        coordinates: { type: 'Point', coordinates: [-0.1880, 5.6520] },
        source: 'poi'
      },
      dropoff: {
        name: 'Pentagon Hall',
        coordinates: { type: 'Point', coordinates: [-0.1890, 5.6580] },
        source: 'poi'
      },
      fare: {
        baseFare: 8.0,
        distanceFare: 3.5,
        timeFare: 0.0,
        surgeMultiplier: 1.0,
        discountAmount: 0,
        totalFare: 11.5,
        currency: 'GHS',
        pricingModel: 'platform_calculated',
        paymentStatus: 'unpaid'
      },
      cancellation: null
    });
    createdBookingIds.push(freshBooking._id);

    // 2. Set createdAt to 5 minutes ago (< 15 mins threshold)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    await RideBooking.collection.updateOne(
      { _id: freshBooking._id },
      { $set: { createdAt: fiveMinsAgo, cancellation: null } }
    );

    // 3. Execute timeout logic
    await expireStaleBookings(new Date());

    // 4. Verify the fresh booking was NOT transitioned
    const freshRecord = await RideBooking.findById(freshBooking._id);
    assert.equal(freshRecord.status, 'pending', 'Fresh booking must remain pending');
    assert.equal(freshRecord.cancellation, null, 'Fresh booking cancellation must remain null');
  });

  it('Scenario 3: Handles batch processing of multiple stale bookings simultaneously without collision or null errors', async () => {
    const batchBookingIds = [];
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    for (let i = 0; i < 3; i++) {
      const b = await RideBooking.create({
        passengerId: testPassenger._id,
        rideMode: 'solo',
        status: 'pending',
        pickup: {
          name: `Pickup Point ${i}`,
          coordinates: { type: 'Point', coordinates: [-0.1870 + i * 0.001, 5.6508] },
          source: 'poi'
        },
        dropoff: {
          name: `Dropoff Point ${i}`,
          coordinates: { type: 'Point', coordinates: [-0.1852 + i * 0.001, 5.6595] },
          source: 'poi'
        },
        fare: {
          baseFare: 8.0,
          distanceFare: 4.0,
          timeFare: 0.0,
          surgeMultiplier: 1.0,
          discountAmount: 0,
          totalFare: 12.0,
          currency: 'GHS',
          pricingModel: 'platform_calculated',
          paymentStatus: 'unpaid'
        },
        cancellation: null
      });
      batchBookingIds.push(b._id);
      createdBookingIds.push(b._id);
    }

    // Backdate all 3 to 30 mins ago
    await RideBooking.collection.updateMany(
      { _id: { $in: batchBookingIds } },
      { $set: { createdAt: thirtyMinsAgo, cancellation: null } }
    );

    // Execute cron
    const result = await expireStaleBookings(new Date());
    assert.ok(result.bookingTimeoutResult.modifiedCount >= 3, 'All 3 stale bookings must be updated');

    // Verify all 3
    const records = await RideBooking.find({ _id: { $in: batchBookingIds } });
    assert.equal(records.length, 3, 'Must find 3 records');
    for (const r of records) {
      assert.equal(r.status, 'cancelled_timeout');
      assert.notEqual(r.cancellation, null);
      assert.equal(r.cancellation.cancelledByRole, 'system');
      assert.equal(r.cancellation.penaltyAmount, 0);
      assert.ok(r.cancellation.cancelledAt instanceof Date);
    }
  });
});
