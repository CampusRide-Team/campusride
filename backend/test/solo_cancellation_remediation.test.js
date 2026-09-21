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

import { createRideBooking, cancelBooking } from '../src/services/bookingService.js';
import { acceptSoloOffer, findEligibleDrivers } from '../src/services/dispatchService.js';
import { executeTripStop } from '../src/services/tripService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('CampusRide Phase 2.5 Remediation - Solo Pre-Pickup Cancellation Invariant Test', () => {
  let mongoAvailable = false;
  let testPassenger = null;
  let testDriver = null;

  before(async () => {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride_test';
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      mongoAvailable = true;

      // Clean test fixture records
      await User.deleteMany({ email: /@test-remediation\.ug\.edu\.gh$/ });
      await RideBooking.deleteMany({ 'pickup.name': /Remediation Test/ });
      await DriverTrip.deleteMany({ driverId: { $in: await User.find({ email: /@test-remediation\.ug\.edu\.gh$/ }).select('_id') } });

      testPassenger = await User.create({
        fullName: 'Remediation Passenger',
        email: 'passenger@test-remediation.ug.edu.gh',
        phoneNumber: '+233240000991',
        password: 'Password123!',
        role: 'passenger',
        approvalStatus: 'approved'
      });

      testDriver = await User.create({
        fullName: 'Remediation Driver',
        email: 'driver@test-remediation.ug.edu.gh',
        phoneNumber: '+233240000992',
        password: 'Password123!',
        role: 'driver',
        approvalStatus: 'approved',
        isApproved: true,
        isOnline: true,
        lastSeen: new Date(),
        currentLocation: {
          type: 'Point',
          coordinates: [-0.1876, 5.635]
        },
        driverProfile: {
          capacity: {
            physicalCapacity: 4,
            chosenSharedCapacity: 3
          }
        }
      });
    } catch (err) {
      console.warn('MongoDB not available for remediation test:', err.message);
    }
  });

  after(async () => {
    if (mongoAvailable) {
      await User.deleteMany({ email: /@test-remediation\.ug\.edu\.gh$/ });
      await RideBooking.deleteMany({ 'pickup.name': /Remediation Test/ });
      if (testDriver) {
        await DriverTrip.deleteMany({ driverId: testDriver._id });
      }
      await mongoose.disconnect();
    }
  });

  it('should cleanly complete DriverTrip and restore driver availability when passenger cancels solo ride before pickup', async function() {
    if (!mongoAvailable) return this.skip();

    // 1. Create a solo booking
    const booking1 = await createRideBooking(testPassenger._id, {
      pickup: 'Balme Library',
      dropoff: 'Pentagon Hostel',
      rideMode: 'solo'
    });

    // 2. Driver accepts solo offer
    const { trip: trip1 } = await acceptSoloOffer(testDriver._id, booking1._id);
    assert.equal(trip1.tripType, 'solo');
    assert.equal(trip1.status, 'dispatched');
    assert.equal(trip1.activePassengerCount, 1);
    assert.equal(trip1.reservedPassengerCount, 1);

    // 3. Passenger cancels booking before pickup
    const cancelledBooking = await cancelBooking(booking1._id, testPassenger._id, 'passenger', 'Passenger changed mind before pickup');
    assert.equal(cancelledBooking.status, 'cancelled');

    // 4. Verify trip state: activePassengerCount and reservedPassengerCount must both be 0, trip must be completed
    const trip1AfterCancel = await DriverTrip.findById(trip1._id);
    assert.equal(trip1AfterCancel.reservedPassengerCount, 0, 'Reserved passenger count must drop to 0');
    assert.equal(trip1AfterCancel.activePassengerCount, 0, 'Active passenger count must drop to 0 on solo pre-pickup cancel');
    assert.equal(trip1AfterCancel.status, 'completed', 'Trip status must transition to completed');
    assert.ok(trip1AfterCancel.completedAt, 'completedAt must be populated');
    assert.ok(trip1AfterCancel.tripStops.every(s => s.status === 'cancelled'), 'All stops must be cancelled');

    // 5. Verify driver availability: driver must NOT be blocked by DRIVER_ALREADY_HAS_ACTIVE_TRIP
    const busyTrip = await DriverTrip.findOne({
      driverId: testDriver._id,
      status: { $in: ['dispatched', 'active'] }
    });
    assert.equal(busyTrip, null, 'Driver must have zero busy trips');

    // 6. Prove recovery: Driver can accept a subsequent solo booking without conflict
    const booking2 = await createRideBooking(testPassenger._id, {
      pickup: 'Balme Library',
      dropoff: 'Night Market',
      rideMode: 'solo'
    });

    const { trip: trip2 } = await acceptSoloOffer(testDriver._id, booking2._id);
    assert.equal(trip2.tripType, 'solo');
    assert.equal(trip2.status, 'dispatched');
    assert.equal(trip2.activePassengerCount, 1);
    assert.equal(trip2.reservedPassengerCount, 1);

    // Clean up second trip
    await DriverTrip.deleteOne({ _id: trip2._id });
    await RideBooking.deleteOne({ _id: booking2._id });
    await DriverTrip.deleteOne({ _id: trip1._id });
    await RideBooking.deleteOne({ _id: booking1._id });
  });
});
