const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createRouteRequestKey,
  buildBookingPayload,
  normalizeRoadRoute,
  routeMatchesLocations,
} = require('../src/utils/routeSelection');

const pickup = { name: 'Balme Library', coordinates: [-0.187, 5.6508] };
const dropoff = { name: 'Great Hall', coordinates: [-0.1892, 5.6558] };

test('route request keys preserve longitude-latitude ordering', () => {
  assert.equal(createRouteRequestKey(pickup, dropoff), '-0.187000,5.650800;-0.189200,5.655800');
});

test('accepts complete road geometry with intermediate coordinates', () => {
  const geometry = normalizeRoadRoute({
    geometry: {
      type: 'LineString',
      coordinates: [
        [-0.187, 5.6508],
        [-0.1874, 5.6521],
        [-0.1883, 5.6539],
        [-0.1892, 5.6558],
      ],
    },
    distanceMeters: 810,
    durationSeconds: 165,
  });
  assert.equal(geometry.length, 4);
  assert.deepEqual(geometry[1], { latitude: 5.6521, longitude: -0.1874 });
});

test('rejects missing geometry instead of fabricating a straight route', () => {
  assert.equal(normalizeRoadRoute({ distanceMeters: 810, durationSeconds: 165 }), null);
});

test('rejects endpoint-only geometry as non-road routing', () => {
  assert.equal(normalizeRoadRoute({
    geometry: { type: 'LineString', coordinates: [pickup.coordinates, dropoff.coordinates] },
    distanceMeters: 810,
    durationSeconds: 165,
  }), null);
});

test('detects stale route results after either endpoint changes', () => {
  const route = { requestKey: createRouteRequestKey(pickup, dropoff) };
  assert.equal(routeMatchesLocations(route, pickup, dropoff), true);
  assert.equal(routeMatchesLocations(route, pickup, { ...dropoff, coordinates: [-0.1848, 5.656] }), false);
});

const roadRoute = (origin = pickup, destination = dropoff) => ({
  requestKey: createRouteRequestKey(origin, destination),
  geometry: {
    type: 'LineString',
    coordinates: [origin.coordinates, [-0.188, 5.653], destination.coordinates],
  },
  distanceMeters: 810,
  durationSeconds: 165,
  estimateOnly: false,
});

test('fare-free booking payload retains the exact routed endpoint names, IDs, and coordinates', () => {
  const identifiedDropoff = { ...dropoff, poiId: 'great-hall-id', source: 'poi' };
  const route = roadRoute(pickup, identifiedDropoff);
  const payload = buildBookingPayload({ pickup, dropoff: identifiedDropoff, rideMode: 'solo', route });
  assert.equal(payload.dropoff.name, 'Great Hall');
  assert.equal(payload.dropoff.poiId, 'great-hall-id');
  assert.deepEqual(payload.dropoff.coordinates, [-0.1892, 5.6558]);
  assert.notEqual(payload.dropoff.coordinates, identifiedDropoff.coordinates);
});

test('booking is rejected when its endpoint is stale or route is not road-following', () => {
  const route = roadRoute();
  assert.throws(
    () => buildBookingPayload({ pickup, dropoff: { ...dropoff, coordinates: [-0.1848, 5.656] }, rideMode: 'solo', route }),
    /STALE_ROUTE/,
  );
  assert.throws(
    () => buildBookingPayload({
      pickup,
      dropoff,
      rideMode: 'shared',
      route: { ...route, geometry: null, estimateOnly: true },
    }),
    /INVALID_ROAD_ROUTE/,
  );
});
