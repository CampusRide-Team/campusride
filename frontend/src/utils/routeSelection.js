const isValidLngLat = (point) => Array.isArray(point)
  && point.length >= 2
  && Number.isFinite(Number(point[0]))
  && Number.isFinite(Number(point[1]))
  && Number(point[0]) >= -180
  && Number(point[0]) <= 180
  && Number(point[1]) >= -90
  && Number(point[1]) <= 90;

const createRouteRequestKey = (pickup, dropoff) => {
  const pickupCoords = pickup?.coordinates;
  const dropoffCoords = dropoff?.coordinates;
  if (!isValidLngLat(pickupCoords) || !isValidLngLat(dropoffCoords)) return null;
  return `${Number(pickupCoords[0]).toFixed(6)},${Number(pickupCoords[1]).toFixed(6)};${Number(dropoffCoords[0]).toFixed(6)},${Number(dropoffCoords[1]).toFixed(6)}`;
};

const normalizeRoadRoute = (route) => {
  const rawCoordinates = route?.geometry?.type === 'LineString'
    ? route.geometry.coordinates
    : null;
  if (!Array.isArray(rawCoordinates)) return null;

  const geometry = rawCoordinates
    .filter(isValidLngLat)
    .map(([longitude, latitude]) => ({
      latitude: Number(latitude),
      longitude: Number(longitude),
    }));

  // Two endpoints alone are not evidence of a road-following driving route.
  if (geometry.length < 3) return null;
  if (!Number.isFinite(Number(route.distanceMeters)) || Number(route.distanceMeters) <= 0) return null;
  if (!Number.isFinite(Number(route.durationSeconds)) || Number(route.durationSeconds) <= 0) return null;

  return geometry;
};

const routeMatchesLocations = (route, pickup, dropoff) => (
  Boolean(route?.requestKey) && route.requestKey === createRouteRequestKey(pickup, dropoff)
);

const buildBookingPayload = ({ pickup, dropoff, rideMode, route }) => {
  if (!routeMatchesLocations(route, pickup, dropoff)) {
    throw new Error('STALE_ROUTE: Route and selected locations do not match');
  }
  if (route?.estimateOnly === true || !normalizeRoadRoute(route)) {
    throw new Error('INVALID_ROAD_ROUTE: A matching road-following route is required');
  }

  return {
    pickup: {
      ...pickup,
      coordinates: [...pickup.coordinates],
    },
    dropoff: {
      ...dropoff,
      coordinates: [...dropoff.coordinates],
    },
    rideMode,
    routeRequestKey: route.requestKey,
  };
};

module.exports = {
  createRouteRequestKey,
  buildBookingPayload,
  isValidLngLat,
  normalizeRoadRoute,
  routeMatchesLocations,
};
