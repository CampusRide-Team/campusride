const test = require('node:test');
const assert = require('node:assert/strict');
const {
  classifyLocationFix,
  createGpsPickup,
  normalizePoiLocation,
  preserveExplicitLocationIdentity,
  shouldApplyGpsPickup,
  shouldClearGpsPickupAfterFailure,
  toDeviceLocation,
} = require('../src/utils/locationSelection');

const NOW = 1_800_000_000_000;
const fix = (overrides = {}) => {
  const { coords: coordinateOverrides, ...positionOverrides } = overrides;
  return {
    timestamp: NOW - 10_000,
    ...positionOverrides,
    coords: {
      latitude: 5.6508,
      longitude: -0.187,
      accuracy: 18,
      ...coordinateOverrides,
    },
  };
};

test('accepts a sufficiently fresh and accurate cached GPS fix', () => {
  assert.deepEqual(classifyLocationFix(fix(), { now: NOW }), { usable: true, reason: null });
});

test('rejects stale cached GPS fixes', () => {
  const stale = fix({ timestamp: NOW - (3 * 60 * 1000) });
  assert.equal(classifyLocationFix(stale, { now: NOW }).reason, 'stale');
});

test('rejects GPS fixes whose accuracy is insufficient for booking', () => {
  assert.equal(classifyLocationFix(fix({ coords: { accuracy: 240 } }), { now: NOW }).reason, 'inaccurate');
});

test('creates a verified GPS pickup with longitude-latitude ordering', () => {
  const pickup = createGpsPickup(toDeviceLocation(fix(), true));
  assert.deepEqual(pickup.coordinates, [-0.187, 5.6508]);
  assert.equal(pickup.source, 'device_gps');
  assert.equal(pickup.gps.accuracyMeters, 18);
  assert.equal(pickup.gps.capturedAt, new Date(NOW - 10_000).toISOString());
  assert.equal(pickup.provisional, true);
  assert.equal(pickup.verified, true);
});

test('manual pickup selection cannot be overwritten by later GPS updates', () => {
  const manual = { name: 'School of Engineering', coordinates: [-0.186, 5.655], source: 'poi' };
  assert.equal(shouldApplyGpsPickup(manual, 'manual'), false);
});

test('explicit current-location mode permits a GPS pickup refresh', () => {
  const manual = { name: 'School of Engineering', coordinates: [-0.186, 5.655], source: 'poi' };
  assert.equal(shouldApplyGpsPickup(manual, 'gps'), true);
});

test('permission or GPS failure clears an unverified GPS pickup but preserves a manual override', () => {
  const gpsPickup = createGpsPickup(toDeviceLocation(fix()));
  const manual = { name: 'School of Engineering', coordinates: [-0.186, 5.655], source: 'poi' };
  assert.equal(shouldClearGpsPickupAfterFailure(gpsPickup), true);
  assert.equal(shouldClearGpsPickupAfterFailure(manual), false);
});

test('explicit School of Engineering identity survives an unrelated nearest-POI response', () => {
  const engineering = normalizePoiLocation({
    _id: 'engineering-id',
    name: 'School of Engineering',
    coordinates: { type: 'Point', coordinates: [-0.1841, 5.6554] },
    category: 'faculty',
  });
  const reverseResult = {
    name: 'Near Legon Night Market',
    coordinates: [-0.1848, 5.656],
    source: 'reverse_geocoded',
  };

  assert.equal(preserveExplicitLocationIdentity(engineering, reverseResult), engineering);
  assert.equal(engineering.name, 'School of Engineering');
  assert.equal(engineering.poiId, 'engineering-id');
  assert.deepEqual(engineering.coordinates, [-0.1841, 5.6554]);
});

test('POI normalization rejects malformed coordinates instead of swapping latitude and longitude', () => {
  assert.equal(normalizePoiLocation({ name: 'Bad POI', coordinates: [200, 5.65] }), null);
});
