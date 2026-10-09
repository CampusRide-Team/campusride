import test from 'node:test';
import assert from 'node:assert/strict';

import { RoutingService } from '../src/services/routingService.js';

const points = [[-0.1870, 5.6500], [-0.1855, 5.6520], [-0.1830, 5.6540]];

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body
});

test('uses OpenRouteService first and caches the road route', async () => {
  let calls = 0;
  const service = new RoutingService({
    orsApiKey: 'test-key',
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({
        features: [{
          geometry: { type: 'LineString', coordinates: points },
          properties: { summary: { distance: 721.4, duration: 141.2 } }
        }]
      });
    }
  });

  const route = await service.getRoute(points);
  const cached = await service.getRoute(points);

  assert.equal(route.source, 'openrouteservice');
  assert.equal(route.fallbackUsed, false);
  assert.equal(route.estimateOnly, false);
  assert.equal(route.distanceMeters, 721);
  assert.equal(cached.cacheHit, true);
  assert.equal(calls, 1);
});

test('uses OSRM road geometry when ORS_API_KEY is absent', async () => {
  const service = new RoutingService({
    orsApiKey: '',
    fetchImpl: async (url) => {
      assert.match(url, /\/route\/v1\/driving\//);
      return jsonResponse({
        code: 'Ok',
        routes: [{
          geometry: { type: 'LineString', coordinates: points },
          distance: 810.8,
          duration: 162.1
        }]
      });
    }
  });

  const route = await service.getRoute(points);
  assert.equal(route.source, 'osrm_demo');
  assert.equal(route.fallbackUsed, true);
  assert.equal(route.estimateOnly, false);
  assert.equal(route.geometry.type, 'LineString');
  assert.ok(route.geometry.coordinates.length > 2, 'Road route must preserve intermediate geometry points');
  assert.match(route.fallbackReason, /ORS_API_KEY is missing/);
});

test('labels the final geodesic fallback as estimate-only', async () => {
  const service = new RoutingService({
    orsApiKey: '',
    fetchImpl: async () => jsonResponse({}, 503)
  });

  const route = await service.getRoute(points);
  assert.equal(route.source, 'geodesic_estimate');
  assert.equal(route.fallbackUsed, true);
  assert.equal(route.estimateOnly, true);
  assert.equal(route.geometry, null);
  assert.ok(route.distanceMeters > 0);
});
