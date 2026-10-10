const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { normalizePoiLocation } = require('../src/utils/locationSelection');
const readSource = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

test('an OSM-backed POI preserves its name, identity, and longitude-latitude coordinates', () => {
  const location = normalizePoiLocation({
    _id: 'cached-object-id',
    name: 'Great Hall',
    coordinates: { type: 'Point', coordinates: [-0.196216, 5.650678] },
    coordinateProvenance: { type: 'imported', source: 'OpenStreetMap way/720486436' },
  });
  assert.equal(location.name, 'Great Hall');
  assert.equal(location.poiId, 'cached-object-id');
  assert.deepEqual(location.coordinates, [-0.196216, 5.650678]);
  assert.equal(location.coordinateProvenance.type, 'imported');
});

test('OSM search occurs on explicit keyboard submit rather than autocomplete', () => {
  const source = readSource('src/components/passenger/LocationSearchWorkspace.js');
  assert.match(source, /onSubmitEditing=\{handleExternalSearch\}/);
  assert.match(source, /searchOpenStreetMap/);
  assert.match(source, /fetchPOIs\(text, false\)/);
});

test('manual pin naming consumes nearbyPoi identity and avoids generic selected-location labels', () => {
  const source = readSource('src/components/passenger/PassengerRideShell.js');
  assert.match(source, /resolved\.data\.nearbyPoi\?\.name/);
  assert.doesNotMatch(source, /Selected location — near \$\{resolved\.data\.name\}/);
});
