import routingService from '../services/routingService.js';

/**
 * Controller for driving route calculations and ETA queries.
 * Validates coordinate bounds and proxies through routingService.
 */
export const getRoute = async (req, res, next) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_COORDINATES', message: 'Both origin and destination query parameters are required in format: lng,lat' }
      });
    }

    const parseCoordinate = (str) => {
      const parts = str.split(',').map(p => parseFloat(p.trim()));
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        return null;
      }
      const [lng, lat] = parts;
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return null;
      }
      return [lng, lat];
    };

    const originCoords = parseCoordinate(origin);
    if (!originCoords) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Origin coordinates must be valid GeoJSON [longitude, latitude] within valid boundaries' }
      });
    }

    const destCoords = parseCoordinate(destination);
    if (!destCoords) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Destination coordinates must be valid GeoJSON [longitude, latitude] within valid boundaries' }
      });
    }

    const route = await routingService.getRoute([originCoords, destCoords]);
    const geometryCoordinates = route?.geometry?.type === 'LineString' ? route.geometry.coordinates : null;
    if (route?.estimateOnly === true || !Array.isArray(geometryCoordinates) || geometryCoordinates.length < 3) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'ROAD_ROUTE_UNAVAILABLE',
          message: 'A road-following route is currently unavailable. Straight-line estimates are not used for navigation.'
        },
        data: {
          source: route?.source || 'unavailable',
          estimateOnly: true,
          fallbackReason: route?.fallbackReason || null
        }
      });
    }
    const formattedETA = `${Math.ceil(route.durationSeconds / 60)} mins`;
    const requestKey = routingService.getCacheKey([originCoords, destCoords]);

    res.json({
      success: true,
      data: {
        geometry: route.geometry,
        polyline: route.polyline,
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
        formattedETA,
        source: route.source,
        fallbackUsed: route.fallbackUsed,
        estimateOnly: route.estimateOnly,
        fallbackReason: route.fallbackReason,
        cacheHit: route.cacheHit,
        calculatedAt: route.calculatedAt
        ,requestKey
      }
    });
  } catch (error) {
    next(error);
  }
};
