import express from 'express';
import { searchPOIs, findNearestPOI } from '../services/poiService.js';
import CampusPOI from '../models/CampusPOI.js';

const router = express.Router();

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
    const { query, category, campusZone, limit } = req.query;
    const pois = await searchPOIs({
      query,
      category,
      campusZone,
      limit: limit ? Number(limit) : 20
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
