const GPS_PICKUP_SOURCE = 'device_gps';
const LEGACY_GPS_PICKUP_SOURCES = new Set(['gps_current', 'gps_pin']);
const DEFAULT_MAX_LOCATION_AGE_MS = 2 * 60 * 1000;
const DEFAULT_MAX_ACCURACY_METERS = 100;

const readCoordinate = (position, key) => Number(position?.coords?.[key] ?? position?.[key]);

const hasValidCoordinates = (position) => {
  const latitude = readCoordinate(position, 'latitude');
  const longitude = readCoordinate(position, 'longitude');
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
};

const classifyLocationFix = (position, options = {}) => {
  const now = options.now ?? Date.now();
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_LOCATION_AGE_MS;
  const maxAccuracyMeters = options.maxAccuracyMeters ?? DEFAULT_MAX_ACCURACY_METERS;

  if (!hasValidCoordinates(position)) return { usable: false, reason: 'invalid' };

  const timestamp = Number(position?.timestamp);
  if (Number.isFinite(timestamp) && now - timestamp > maxAgeMs) {
    return { usable: false, reason: 'stale' };
  }

  const accuracy = Number(position?.coords?.accuracy ?? position?.accuracy);
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > maxAccuracyMeters) {
    return { usable: false, reason: 'inaccurate' };
  }

  return { usable: true, reason: null };
};

const toDeviceLocation = (position, provisional = false) => ({
  latitude: readCoordinate(position, 'latitude'),
  longitude: readCoordinate(position, 'longitude'),
  accuracy: Number(position?.coords?.accuracy ?? position?.accuracy),
  timestamp: Number(position?.timestamp) || Date.now(),
  provisional,
  verified: true,
});

const createGpsPickup = (deviceLocation, name = 'Current location') => ({
  name,
  coordinates: [Number(deviceLocation.longitude), Number(deviceLocation.latitude)],
  source: GPS_PICKUP_SOURCE,
  gps: {
    accuracyMeters: Number(deviceLocation.accuracy),
    capturedAt: new Date(Number(deviceLocation.timestamp)).toISOString(),
  },
  provisional: deviceLocation.provisional === true,
  verified: deviceLocation.verified === true,
});

const isGpsPickup = (pickup) => pickup?.source === GPS_PICKUP_SOURCE
  || LEGACY_GPS_PICKUP_SOURCES.has(pickup?.source);

const shouldApplyGpsPickup = (_pickup, selectionMode) => selectionMode === 'gps';

const shouldClearGpsPickupAfterFailure = (pickup) => isGpsPickup(pickup);

const normalizePoiLocation = (poi) => {
  const rawCoordinates = poi?.coordinates?.coordinates || poi?.coordinates;
  if (!Array.isArray(rawCoordinates) || rawCoordinates.length < 2) return null;
  const longitude = Number(rawCoordinates[0]);
  const latitude = Number(rawCoordinates[1]);
  if (!hasValidCoordinates({ latitude, longitude }) || !String(poi?.name || '').trim()) return null;

  return {
    name: String(poi.name).trim(),
    coordinates: [longitude, latitude],
    poiId: poi._id || poi.id || poi.poiId || null,
    category: poi.category || 'general',
    campusZone: poi.campusZone,
    coordinateProvenance: poi.coordinateProvenance,
    source: poi.source || 'poi',
    verified: true,
  };
};

const preserveExplicitLocationIdentity = (selectedLocation, resolvedLocation) => {
  if (selectedLocation?.source === 'poi' || selectedLocation?.poiId) return selectedLocation;
  return resolvedLocation || selectedLocation;
};

module.exports = {
  GPS_PICKUP_SOURCE,
  DEFAULT_MAX_LOCATION_AGE_MS,
  DEFAULT_MAX_ACCURACY_METERS,
  classifyLocationFix,
  createGpsPickup,
  hasValidCoordinates,
  isGpsPickup,
  normalizePoiLocation,
  preserveExplicitLocationIdentity,
  shouldApplyGpsPickup,
  shouldClearGpsPickupAfterFailure,
  toDeviceLocation,
};
