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
    const formattedETA = `${Math.ceil(route.durationSeconds / 60)} mins`;

    res.json({
      success: true,
      data: {
        polyline: route.polyline,
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
        formattedETA,
        calculatedAt: route.calculatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};
