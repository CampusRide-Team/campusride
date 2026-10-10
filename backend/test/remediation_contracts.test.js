import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import DispatchOffer from '../src/models/DispatchOffer.js';
import { serializeDispatchOffer } from '../src/services/dispatchOfferService.js';
import { serializeTrip } from '../src/services/tripDtoService.js';
import routingService from '../src/services/routingService.js';

test('durable dispatch offer validates without monetary fields', () => {
  const offer = new DispatchOffer({
    bookingId: new mongoose.Types.ObjectId(),
    driverId: new mongoose.Types.ObjectId(),
    dispatchRoundId: 'round-1',
    rideMode: 'solo',
    offerType: 'solo_trip',
    pickup: { name: 'Balme Library', coordinates: [-0.187, 5.65] },
    dropoff: { name: 'Great Hall', coordinates: [-0.19, 5.651] },
    routeMetrics: { distanceMeters: 1400, durationSeconds: 420 },
    expiresAt: new Date(Date.now() + 15000)
  });
  assert.equal(offer.validateSync(), undefined);
  const payload = serializeDispatchOffer(offer);
  assert.equal(payload.pickup.name, 'Balme Library');
  assert.equal(payload.routeMetrics.distanceMeters, 1400);
  assert.equal('fare' in payload, false);
  assert.equal('price' in payload, false);
});

test('trip DTO exposes passenger contact to the assigned driver only', () => {
  const passengerId = new mongoose.Types.ObjectId();
  const base = {
    _id: new mongoose.Types.ObjectId(),
    tripStops: [{
      stopId: 'stop-1', bookingId: new mongoose.Types.ObjectId(),
      passengerId: { _id: passengerId, fullName: 'Test Passenger', phoneNumber: '+233000000000' },
      stopType: 'pickup', name: 'Legon Hall', coordinates: { coordinates: [-0.18, 5.65] },
      sequenceOrder: 1, status: 'pending'
    }]
  };
  assert.equal(serializeTrip(base, { includePassengerContact: true }).tripStops[0].passenger.phoneNumber, '+233000000000');
  assert.equal(serializeTrip(base, { includePassengerContact: false, viewerId: new mongoose.Types.ObjectId() }).tripStops[0].passenger, undefined);
});

test('routing endpoint fingerprint is deterministic and coordinate-order sensitive', () => {
  assert.equal(routingService.getCacheKey([[-0.187, 5.65], [-0.19, 5.651]]), '-0.187000,5.650000;-0.190000,5.651000');
  assert.notEqual(routingService.getCacheKey([[-0.187, 5.65], [-0.19, 5.651]]), routingService.getCacheKey([[5.65, -0.187], [5.651, -0.19]]));
});
