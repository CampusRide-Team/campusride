import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import RideBooking from '../src/models/RideBooking.js';
import CampusPOI from '../src/models/CampusPOI.js';
import TrustedContact from '../src/models/TrustedContact.js';
import { validateBookingTransition } from '../src/services/bookingService.js';
import { shouldShareRideAt } from '../src/services/notificationDeliveryService.js';

test('scheduled booking is a canonical RideBooking state and activates only through pending', () => {
  const booking = new RideBooking({
    passengerId: '507f1f77bcf86cd799439011',
    rideMode: 'solo',
    status: 'scheduled',
    scheduledTime: new Date(Date.now() + 60_000),
    pickup: { name: 'Balme Library', coordinates: { type: 'Point', coordinates: [-0.1870475, 5.6520294] } },
    dropoff: { name: 'Great Hall', coordinates: { type: 'Point', coordinates: [-0.196216, 5.650678] } },
  });
  assert.equal(booking.validateSync(), undefined);
  assert.equal(validateBookingTransition('scheduled', 'pending'), true);
  assert.equal(validateBookingTransition('scheduled', 'cancelled'), true);
  assert.throws(() => validateBookingTransition('scheduled', 'driver_assigned'));
});

test('student place submissions remain pending and hidden until moderation', () => {
  const poi = new CampusPOI({
    name: 'New Examination Centre',
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.187, 5.65] },
    campusZone: 'University of Ghana',
    coordinateProvenance: { type: 'user_submitted', source: 'CampusRide passenger map submission' },
    submittedBy: '507f1f77bcf86cd799439011',
    moderationStatus: 'pending',
    isActive: false,
  });
  assert.equal(poi.validateSync(), undefined);
  assert.equal(poi.isActive, false);
  assert.equal(poi.moderationStatus, 'pending');
});

test('trusted contacts support the three ride-sharing modes', () => {
  for (const mode of ['every_ride', 'night_only', 'never']) {
    const contact = new TrustedContact({
      passengerId: '507f1f77bcf86cd799439011',
      name: 'Trusted Person',
      phoneNumber: '+233241234567',
      notificationPreferences: { rideShareMode: mode },
    });
    assert.equal(contact.validateSync(), undefined);
  }
});

test('ride-sharing modes honor University of Ghana local night hours', () => {
  assert.equal(shouldShareRideAt('every_ride', new Date('2026-10-09T12:00:00Z')), true);
  assert.equal(shouldShareRideAt('never', new Date('2026-10-09T23:00:00Z')), false);
  assert.equal(shouldShareRideAt('night_only', new Date('2026-10-09T21:00:00Z')), true);
  assert.equal(shouldShareRideAt('night_only', new Date('2026-10-10T05:59:00Z')), true);
  assert.equal(shouldShareRideAt('night_only', new Date('2026-10-10T06:00:00Z')), false);
});

test('active driver discovery requires passenger authentication and omits identity fields', () => {
  const routes = fs.readFileSync(new URL('../src/routes/driverRoutes.js', import.meta.url), 'utf8');
  const controller = fs.readFileSync(new URL('../src/controllers/driverController.js', import.meta.url), 'utf8');
  assert.match(routes, /active-locations", protect, requirePassenger/);
  const discoverySection = controller.slice(controller.indexOf('export const getActiveDriverLocations'));
  assert.doesNotMatch(discoverySection, /phoneNumber:/);
  assert.doesNotMatch(discoverySection, /fullName:/);
  assert.match(discoverySection, /updatedAt: driver\.lastSeen/);
});
