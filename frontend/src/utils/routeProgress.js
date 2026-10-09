const EARTH_METERS_PER_DEGREE = 111320;

const normalizeCoordinate = (value) => {
  if (Array.isArray(value) && value.length >= 2) {
    return { longitude: Number(value[0]), latitude: Number(value[1]) };
  }
  if (value && Number.isFinite(Number(value.longitude)) && Number.isFinite(Number(value.latitude))) {
    return { longitude: Number(value.longitude), latitude: Number(value.latitude) };
  }
  return null;
};

const projectToSegment = (position, start, end) => {
  const latitudeScale = EARTH_METERS_PER_DEGREE;
  const longitudeScale = EARTH_METERS_PER_DEGREE * Math.cos(position.latitude * Math.PI / 180);
  const ax = (start.longitude - position.longitude) * longitudeScale;
  const ay = (start.latitude - position.latitude) * latitudeScale;
  const bx = (end.longitude - position.longitude) * longitudeScale;
  const by = (end.latitude - position.latitude) * latitudeScale;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const fraction = lengthSquared > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared)) : 0;
  const projected = {
    longitude: start.longitude + (end.longitude - start.longitude) * fraction,
    latitude: start.latitude + (end.latitude - start.latitude) * fraction,
  };
  const offsetX = ax + dx * fraction;
  const offsetY = ay + dy * fraction;
  return { projected, distanceMeters: Math.sqrt(offsetX * offsetX + offsetY * offsetY), fraction };
};

const distanceMeters = (left, right) => {
  const longitudeScale = EARTH_METERS_PER_DEGREE * Math.cos(left.latitude * Math.PI / 180);
  const dx = (right.longitude - left.longitude) * longitudeScale;
  const dy = (right.latitude - left.latitude) * EARTH_METERS_PER_DEGREE;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Returns only the untravelled portion of a road route. Progress is monotonic,
 * GPS is projected onto the nearest road segment, and off-route fixes never
 * erase valid geometry.
 */
const trimRouteToProgress = (routeCoordinates, livePosition, options = {}) => {
  const route = Array.isArray(routeCoordinates) ? routeCoordinates.map(normalizeCoordinate).filter(Boolean) : [];
  const position = normalizeCoordinate(livePosition);
  if (!position || route.length < 2) return { coordinates: route, segmentIndex: 0, snapped: false };

  const previousSegmentIndex = Math.max(0, Math.min(Number(options.previousSegmentIndex) || 0, route.length - 2));
  const searchStart = Math.max(0, previousSegmentIndex - 2);
  const searchEnd = Math.min(route.length - 2, previousSegmentIndex + (Number(options.maxAdvanceSegments) || 30));
  let best = null;
  for (let index = searchStart; index <= searchEnd; index += 1) {
    const projection = projectToSegment(position, route[index], route[index + 1]);
    if (!best || projection.distanceMeters < best.distanceMeters) best = { ...projection, segmentIndex: index };
  }

  const maxSnapDistanceMeters = Number(options.maxSnapDistanceMeters) || 80;
  if (!best || best.distanceMeters > maxSnapDistanceMeters) {
    return { coordinates: route.slice(previousSegmentIndex), segmentIndex: previousSegmentIndex, snapped: false };
  }

  const segmentIndex = Math.max(previousSegmentIndex, best.segmentIndex);
  const projection = segmentIndex === best.segmentIndex
    ? best.projected
    : route[segmentIndex];
  const finalCoordinate = route[route.length - 1];
  if (distanceMeters(projection, finalCoordinate) <= (Number(options.completionThresholdMeters) || 12)) {
    return { coordinates: [], segmentIndex: route.length - 2, snapped: true };
  }
  return {
    coordinates: [projection, ...route.slice(segmentIndex + 1)],
    segmentIndex,
    snapped: true,
  };
};

module.exports = { trimRouteToProgress };

