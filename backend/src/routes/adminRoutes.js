import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { getPendingDrivers, approveDriver } from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('admin'));

router.get('/drivers/pending', getPendingDrivers);
router.put('/drivers/:id/approve', approveDriver);

export default router;