// rideRoutes.js
import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { 
  toggleDriverStatus, 
  requestRide, 
  getRideQueue, 
  acceptRide, 
  declineRide,
  updateRideStatus,
  scheduleRide,
  getScheduledRides,
  broadcastRide,
  cancelScheduledRide,
  cancelActiveRide,
  getRideById
} from '../controllers/rideController.js';

const router = express.Router();

router.get('/pending', protect, getRideQueue);
router.get('/scheduled', protect, requireRole('student'), getScheduledRides);
router.get('/:id', protect, getRideById);

router.use(protect);

router.put('/driver/status', requireRole('driver'), toggleDriverStatus);
router.post('/request', requireRole('student'), requestRide);
router.post('/broadcast', requireRole('student'), broadcastRide);

router.put('/:rideId/accept', requireRole('driver'), acceptRide);
router.put('/accept/:id', requireRole('driver'), acceptRide);
router.put('/:rideId/decline', declineRide);
router.put('/:id/status', requireRole('driver'), updateRideStatus);

router.post('/schedule', requireRole('student'), scheduleRide);
router.delete('/scheduled/:id', requireRole('student'), cancelScheduledRide);
router.post('/:id/cancel', cancelActiveRide);

// 🔑 Dynamic ID route placed at the bottom to prevent route collision
router.get('/:id', getRideById);

export default router;