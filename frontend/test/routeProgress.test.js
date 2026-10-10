const test = require('node:test');
const assert = require('node:assert/strict');
const { trimRouteToProgress } = require('../src/utils/routeProgress');

const road = [
  { longitude: -0.1900, latitude: 5.6500 },
  { longitude: -0.1890, latitude: 5.6500 },
  { longitude: -0.1880, latitude: 5.6510 },
  { longitude: -0.1870, latitude: 5.6520 },
];

test('trims travelled geometry and starts the remaining route at the projected vehicle position', () => {
  const result = trimRouteToProgress(road, [-0.1885, 5.6505]);
  assert.equal(result.snapped, true);
  assert.equal(result.segmentIndex, 1);
  assert.equal(result.coordinates.length, 3);
  assert.ok(Math.abs(result.coordinates[0].longitude - -0.1885) < 0.00001);
  assert.ok(Math.abs(result.coordinates[0].latitude - 5.6505) < 0.00001);
});

test('never moves route progress backward when GPS jitters', () => {
  const result = trimRouteToProgress(road, [-0.1898, 5.6500], { previousSegmentIndex: 2 });
  assert.equal(result.segmentIndex, 2);
  assert.deepEqual(result.coordinates[0], road[2]);
});

test('preserves valid road geometry when a GPS fix is off route', () => {
  const result = trimRouteToProgress(road, [-0.1800, 5.6600], { previousSegmentIndex: 1 });
  assert.equal(result.snapped, false);
  assert.deepEqual(result.coordinates, road.slice(1));
});

test('clears the remaining route at the road endpoint', () => {
  const result = trimRouteToProgress(road, [-0.1870, 5.6520], { previousSegmentIndex: 2 });
  assert.deepEqual(result.coordinates, []);
});

