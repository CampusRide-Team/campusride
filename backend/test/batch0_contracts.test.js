import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import RideBooking from '../src/models/RideBooking.js';
import User from '../src/models/User.js';
import {
  getDriverProfile,
  updateDriverAvailability,
  updateDriverLocation
} from '../src/controllers/driverController.js';
import { normalizeLocationSource, resolveLocation } from '../src/services/poiService.js';
import { getRedispatchValidationError } from '../src/utils/bookingAuthorization.js';
import routingService from '../src/services/routingService.js';
import { createRideBooking } from '../src/services/bookingService.js';
import { getRoute as getRouteController } from '../src/controllers/routingController.js';

const passengerId = new mongoose.Types.ObjectId();
const baseLocation = {
  name: 'Balme Library',
  poiId: new mongoose.Types.ObjectId(),
  coordinates: { type: 'Point', coordinates: [-0.187, 5.6508] },
  source: 'poi'
};

test('new RideBooking validates without a fare and retains road-route metrics', async () => {
  const booking = new RideBooking({
    passengerId,
    rideMode: 'solo',
    pickup: baseLocation,
    dropoff: { ...baseLocation, name: 'Great Hall', coordinates: { type: 'Point', coordinates: [-0.1892, 5.6558] } },
    route: {
      distanceMeters: 810,
      durationSeconds: 165,
      source: 'openrouteservice',
      estimateOnly: false,
      calculatedAt: new Date()
    }
  });
  await booking.validate();
  assert.equal(booking.fare, undefined);
  assert.equal(booking.route.distanceMeters, 810);
});

test('historical RideBooking fare records remain schema-compatible', async () => {
  const booking = new RideBooking({
    passengerId,
    rideMode: 'shared',
    pickup: baseLocation,
    dropoff: { ...baseLocation, name: 'Great Hall' },
    fare: { totalFare: 12.5, currency: 'GHS', paymentStatus: 'paid' }
  });
  await booking.validate();
  assert.equal(booking.fare.totalFare, 12.5);
});

test('legacy GPS source aliases normalize to the canonical device source', () => {
  assert.equal(normalizeLocationSource('gps_current'), 'device_gps');
  assert.equal(normalizeLocationSource('gps_pin'), 'device_gps');
  assert.equal(normalizeLocationSource('map_pin'), 'map_pin');
  assert.throws(() => normalizeLocationSource('invented'), /INVALID_LOCATION_SOURCE/);
});

test('structured GPS location requires fresh accuracy metadata and preserves lng-lat order', async () => {
  const capturedAt = new Date().toISOString();
  const resolved = await resolveLocation({
    name: 'Current location',
    coordinates: [-0.187, 5.6508],
    source: 'device_gps',
    gps: { accuracyMeters: 18, capturedAt }
  });
  assert.equal(resolved.source, 'device_gps');
  assert.deepEqual(resolved.coordinates.coordinates, [-0.187, 5.6508]);
  assert.equal(resolved.gps.accuracyMeters, 18);

  await assert.rejects(
    resolveLocation({
      name: 'Old location',
      coordinates: [-0.187, 5.6508],
      source: 'device_gps',
      gps: { accuracyMeters: 18, capturedAt: new Date(Date.now() - 180000).toISOString() }
    }),
    /STALE_GPS_LOCATION/
  );
});

test('redispatch authorization is owner/admin, pending, and unexpired only', () => {
  const future = new Date(Date.now() + 60000);
  const booking = { passengerId, status: 'pending', expiresAt: future };
  assert.equal(getRedispatchValidationError(booking, { _id: passengerId, role: 'passenger' }), null);
  assert.equal(getRedispatchValidationError(booking, { _id: new mongoose.Types.ObjectId(), role: 'admin' }), null);
  assert.equal(getRedispatchValidationError(booking, { _id: new mongoose.Types.ObjectId(), role: 'passenger' }).code, 'FORBIDDEN');
  assert.equal(getRedispatchValidationError({ ...booking, status: 'completed' }, { _id: passengerId, role: 'passenger' }).code, 'BOOKING_NOT_PENDING');
  assert.equal(getRedispatchValidationError({ ...booking, expiresAt: new Date(Date.now() - 1) }, { _id: passengerId, role: 'passenger' }).code, 'BOOKING_EXPIRED');
});

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

test('driver profile exposes authoritative top-level isOnline', async () => {
  const originalFindById = User.findById;
  User.findById = () => ({ select: async () => ({ _id: passengerId, role: 'driver', isOnline: false }) });
  try {
    const res = createResponse();
    await getDriverProfile({ user: { _id: passengerId } }, res, (error) => { throw error; });
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isOnline, false);
  } finally {
    User.findById = originalFindById;
  }
});

test('driver location heartbeat cannot mutate availability', async () => {
  const originalFindById = User.findById;
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  let capturedUpdate = null;
  User.findById = async () => ({ _id: passengerId, role: 'driver', approvalStatus: 'approved' });
  User.findByIdAndUpdate = (_id, update) => {
    capturedUpdate = update;
    return { select: async () => ({ isOnline: false, lastSeen: new Date(), currentLocation: update.$set.currentLocation }) };
  };
  try {
    const res = createResponse();
    await updateDriverLocation({
      user: { _id: passengerId },
      body: { latitude: 5.6508, longitude: -0.187, isOnline: true }
    }, res, (error) => { throw error; });
    assert.equal(res.body.success, true);
    assert.equal(Object.hasOwn(capturedUpdate.$set, 'isOnline'), false);
  } finally {
    User.findById = originalFindById;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
  }
});

test('only explicit boolean availability request changes isOnline', async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  let capturedUpdate = null;
  User.findOneAndUpdate = (_filter, update) => {
    capturedUpdate = update;
    return { select: async () => ({ isOnline: update.$set.isOnline, lastSeen: update.$set.lastSeen }) };
  };
  try {
    const invalidRes = createResponse();
    await updateDriverAvailability({ user: { _id: passengerId }, body: { isOnline: 'true' } }, invalidRes, (error) => { throw error; });
    assert.equal(invalidRes.statusCode, 400);

    const validRes = createResponse();
    await updateDriverAvailability({ user: { _id: passengerId }, body: { isOnline: true } }, validRes, (error) => { throw error; });
    assert.equal(validRes.body.data.isOnline, true);
    assert.equal(capturedUpdate.$set.isOnline, true);
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('routing controller reports estimate-only fallback as unavailable, never as a road route', async () => {
  const originalGetRoute = routingService.getRoute;
  routingService.getRoute = async () => ({
    geometry: null,
    distanceMeters: 1000,
    durationSeconds: 180,
    source: 'geodesic_estimate',
    estimateOnly: true,
    fallbackReason: 'providers unavailable'
  });
  try {
    const res = createResponse();
    await getRouteController({ query: { origin: '-0.187,5.6508', destination: '-0.1892,5.6558' } }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.error.code, 'ROAD_ROUTE_UNAVAILABLE');
    assert.equal(res.body.data.estimateOnly, true);
    assert.equal(res.body.data.geometry, undefined);
  } finally {
    routingService.getRoute = originalGetRoute;
  }
});

test('fare-free routing response contains road metrics and no quotes', async () => {
  const originalGetRoute = routingService.getRoute;
  routingService.getRoute = async () => ({
    geometry: { type: 'LineString', coordinates: [[-0.187, 5.6508], [-0.188, 5.653], [-0.1892, 5.6558]] },
    polyline: null,
    distanceMeters: 810,
    durationSeconds: 165,
    source: 'openrouteservice',
    estimateOnly: false,
    fallbackUsed: false,
    calculatedAt: new Date()
  });
  try {
    const res = createResponse();
    await getRouteController({ query: { origin: '-0.187,5.6508', destination: '-0.1892,5.6558' } }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.distanceMeters, 810);
    assert.equal(Object.hasOwn(res.body.data, 'quotes'), false);
  } finally {
    routingService.getRoute = originalGetRoute;
  }
});

test('booking service refuses estimate-only routing before any database write', async () => {
  const originalGetRoute = routingService.getRoute;
  routingService.getRoute = async () => ({
    geometry: null,
    distanceMeters: 1000,
    durationSeconds: 180,
    source: 'geodesic_estimate',
    estimateOnly: true,
    calculatedAt: new Date()
  });
  try {
    await assert.rejects(
      createRideBooking(passengerId, {
        rideMode: 'solo',
        pickup: { name: 'Balme Library', coordinates: [-0.187, 5.6508], source: 'poi', poiId: new mongoose.Types.ObjectId() },
        dropoff: { name: 'Great Hall', coordinates: [-0.1892, 5.6558], source: 'poi', poiId: new mongoose.Types.ObjectId() }
      }),
      /ROAD_ROUTE_UNAVAILABLE/
    );
  } finally {
    routingService.getRoute = originalGetRoute;
  }
});
