import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { getDriverProfile, updateDriverProfile, getDriverEarnings } from '../controllers/driverController.js';

const router = express.Router();

router.use(protect); 
router.use(requireRole('driver')); 

router.get('/profile', getDriverProfile);
router.put('/profile', updateDriverProfile);
router.get('/earnings', getDriverEarnings);

export default router;