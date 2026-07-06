import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { toggleDriverStatus, requestRide, getRideQueue, acceptRide, updateRideStatus } from '../controllers/rideController.js';

const router = express.Router();

router.use(protect);

router.put('/driver/status', requireRole('driver'), toggleDriverStatus);
router.post('/request', requireRole('student'), requestRide);
router.get('/queue', requireRole('driver'), getRideQueue);
router.put('/:id/accept', requireRole('driver'), acceptRide);
router.put('/:id/status', requireRole('driver'), updateRideStatus);

export default router;