import express from 'express';
import {
  searchPOIs,
  searchPOIsWithExternal,
  findNearestPOI,
  reverseGeocodeLocation,
} from '../services/poiService.js';
import CampusPOI from '../models/CampusPOI.js';
import { protect, requireAdmin, requirePassenger } from '../middleware/authMiddleware.js';
import { getMyCampusPOISubmissions, moderateCampusPOI, submitCampusPOI } from '../controllers/poiSubmissionController.js';

const router = express.Router();

router.post('/submissions', protect, requirePassenger, submitCampusPOI);
router.get('/submissions/mine', protect, requirePassenger, getMyCampusPOISubmissions);
router.patch('/submissions/:id/moderate', protect, requireAdmin, moderateCampusPOI);

// GET /api/v1/pois/nearest?lng=-0.1870&lat=5.6508&maxDistance=500
router.get('/nearest', async (req, res, next) => {
  try {
    const { lng, lat, maxDistance } = req.query;
    if (lng === undefined || lat === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_COORDINATES', message: 'lng and lat query parameters are required' }
      });
    }

    const maxDist = maxDistance ? Number(maxDistance) : 500;
    const nearest = await findNearestPOI(Number(lng), Number(lat), maxDist);

    res.json({
      success: true,
      data: nearest
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/pois/search?query=balme&category=library
router.get('/search', async (req, res, next) => {
  try {
    const { query, category, campusZone, limit, external } = req.query;
    const searchInput = {
      query,
      category,
      campusZone,
      limit: limit ? Number(limit) : 20
    };
    const result = external === 'true'
      ? await searchPOIsWithExternal(searchInput)
      : { pois: await searchPOIs(searchInput), externalStatus: 'not_requested' };

    res.json({
      success: true,
      count: result.pois.length,
      data: result.pois,
      externalStatus: result.externalStatus,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/pois/reverse?lng=-0.1870&lat=5.6508
router.get('/reverse', async (req, res, next) => {
  try {
    const longitude = Number(req.query.lng);
    const latitude = Number(req.query.lat);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Valid lng and lat query parameters are required' }
      });
    }
    const location = await reverseGeocodeLocation(longitude, latitude);
    return res.json({ success: true, data: location });
  } catch (error) {
    if (error.message?.startsWith('LOCATION_OUTSIDE_CAMPUS')) {
      return res.status(400).json({ success: false, error: { code: 'LOCATION_OUTSIDE_CAMPUS', message: error.message } });
    }
    if (error.message?.startsWith('GEOCODING_UNAVAILABLE')) {
      return res.status(503).json({ success: false, error: { code: 'GEOCODING_UNAVAILABLE', message: 'Location naming is temporarily unavailable' } });
    }
    return next(error);
  }
});

// GET /api/v1/pois/:id
router.get('/:id', async (req, res, next) => {
  try {
    const poi = await CampusPOI.findById(req.params.id);
    if (!poi) {
      return res.status(404).json({
        success: false,
        error: { code: 'POI_NOT_FOUND', message: 'Campus POI not found' }
      });
    }
    res.json({
      success: true,
      data: poi
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/pois
router.get('/', async (req, res, next) => {
  try {
    const { query, category, campusZone, limit } = req.query;
    const pois = await searchPOIs({
      query,
      category,
      campusZone,
      limit: limit ? Number(limit) : 50
    });

    res.json({
      success: true,
      count: pois.length,
      data: pois
    });
  } catch (error) {
    next(error);
  }
});

export default router;
