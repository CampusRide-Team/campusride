import express from 'express';
import { getRoute } from '../controllers/routingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/v1/routing/route?origin=lng,lat&destination=lng,lat
router.get('/route', protect, getRoute);

export default router;
