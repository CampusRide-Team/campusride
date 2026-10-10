import test from 'node:test';
import assert from 'node:assert/strict';

import { GeocodingService } from '../src/services/geocodingService.js';
import { CANONICAL_CAMPUS_POIS, rankPOIsForQuery } from '../src/services/poiService.js';

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

test('campus search normalizes and caches a bounded OpenStreetMap result', async () => {
  let calls = 0;
  let requestedUrl = '';
  const service = new GeocodingService({
    minRequestIntervalMs: 0,
    fetchImpl: async (url) => {
      calls += 1;
      requestedUrl = url;
      return jsonResponse([{
        name: 'Great Hall', display_name: 'Great Hall, University of Ghana, Ghana',
        lat: '5.650678', lon: '-0.196216', osm_type: 'way', osm_id: 720486436,
        category: 'building', type: 'yes',
      }]);
    },
  });

  const first = await service.search('Great Hall');
  const cached = await service.search('Great Hall');
  assert.equal(calls, 1);
  assert.match(requestedUrl, /bounded=1/);
  assert.match(requestedUrl, /viewbox=/);
  assert.match(requestedUrl, /q=Great\+Hall/);
  assert.doesNotMatch(requestedUrl, /University\+of\+Ghana%2C\+Legon/);
  assert.deepEqual(first, cached);
  assert.equal(first[0].name, 'Great Hall');
  assert.deepEqual(first[0].coordinates, [-0.196216, 5.650678]);
  assert.equal(first[0].externalRef.osmKey, 'way:720486436');
  assert.equal(first[0].coordinateProvenance.type, 'imported');
});

test('reverse geocoding preserves the exact selected pin coordinate', async () => {
  const service = new GeocodingService({
    minRequestIntervalMs: 0,
    fetchImpl: async () => jsonResponse({
      name: 'Balme Library', display_name: 'Balme Library, Legon, Ghana',
      lat: '5.6520294', lon: '-0.1870475', osm_type: 'relation', osm_id: 7304886,
      category: 'amenity', type: 'library',
    }),
  });
  const selected = [-0.1872, 5.6519];
  const result = await service.reverse(selected[0], selected[1]);
  assert.deepEqual(result.coordinates, selected);
  assert.deepEqual(result.featureCoordinates, [-0.1870475, 5.6520294]);
  assert.equal(result.name, 'Balme Library');
  assert.equal(result.source, 'reverse_geocoded');
});

test('reverse geocoding rejects points outside the supported campus area', async () => {
  const service = new GeocodingService({ minRequestIntervalMs: 0, fetchImpl: async () => jsonResponse({}) });
  await assert.rejects(() => service.reverse(0.0, 0.0), /LOCATION_OUTSIDE_CAMPUS/);
});

test('active canonical POIs are verified OSM imports, never development estimates', () => {
  const active = CANONICAL_CAMPUS_POIS.filter((poi) => poi.isActive);
  assert.ok(active.length >= 35);
  for (const poi of active) {
    assert.equal(poi.coordinateProvenance.type, 'imported', poi.name);
    assert.equal(poi.externalRef.provider, 'openstreetmap', poi.name);
  }
});

test('canonical catalog has unique names and OSM identities', () => {
  const names = CANONICAL_CAMPUS_POIS.map((poi) => poi.name);
  const osmKeys = CANONICAL_CAMPUS_POIS
    .filter((poi) => poi.externalRef?.osmKey)
    .map((poi) => poi.externalRef.osmKey);
  assert.equal(new Set(names).size, names.length);
  assert.equal(new Set(osmKeys).size, osmKeys.length);
});

test('legacy inactive records without OSM identities remain explicitly named', () => {
  const inactiveWithoutOsm = CANONICAL_CAMPUS_POIS.filter((poi) => !poi.isActive && !poi.externalRef?.osmKey);
  assert.ok(inactiveWithoutOsm.length > 0);
  for (const poi of inactiveWithoutOsm) {
    assert.ok(poi.name.length > 0);
    assert.equal(poi.coordinateProvenance.type, 'development_estimate');
  }
});

test('high-use campus acronyms and nicknames have verified canonical records', () => {
  const expectedAliases = new Map([
    ['TF', 'James Topp Nelson Yankah Hall'],
    ['UGMC', 'University of Ghana Medical Centre'],
    ['Pent', 'Pentagon Hostel'],
    ['UGCS', 'University of Ghana Computing Systems'],
    ['WACCBIP', 'West African Centre for Cell Biology of Infectious Pathogens'],
    ['ISH 1', 'International Students Hostel 1'],
  ]);

  for (const [alias, expectedName] of expectedAliases) {
    const match = CANONICAL_CAMPUS_POIS.find((poi) => poi.isActive && poi.aliases.includes(alias));
    assert.equal(match?.name, expectedName, alias);
    assert.equal(match?.coordinateProvenance.type, 'imported', alias);
  }
});

test('exact acronym and alias matches rank ahead of loose partial matches', () => {
  const ranked = rankPOIsForQuery([
    { name: 'TF Bus Stop', aliases: [] },
    { name: 'James Topp Nelson Yankah Hall', aliases: ['TF', 'TF Hostel'] },
    { name: 'Other Hostel', aliases: ['Near TF'] },
  ], 'TF');
  assert.equal(ranked[0].name, 'James Topp Nelson Yankah Hall');
});
