
import express from 'express';
import { getAdminProfile } from '../controllers/adminProfileController.js';
import {
   getGlobalSettings, 
   updateGlobalSettings 
  } from '../controllers/settingController.js';
import {
   getNotificationSnapshot,
  sendGlobalBroadcast 
  } from '../controllers/notificationController.js';
import {
   getAnalyticsSnapshot 
  } from '../controllers/analyticsController.js';
import { 
  getMonitoringSnapshot, handleDriverIntervention 
} from '../controllers/monitoringController.js';
import {
   getUserDirectory, handleEnforcementAction 
  } from '../controllers/userDirectoryController.js';
// import { protect, requireRole } from '../middleware/authMiddleware.js'; // 💡 Temporarily comment out
import { 
  getPendingDrivers, 
  approveDriver,
  getDashboardData,
  handleDriverRejection 
} from '../controllers/adminController.js';

const router = express.Router();

 // router.use(protect);
// router.use(requireRole('admin'));

router.get('/dashboard', getDashboardData);
router.get('/drivers/pending', getPendingDrivers);
router.put('/drivers/:id/approve', approveDriver);
router.get('/monitoring/snapshot', getMonitoringSnapshot);
router.post('/monitoring/driver/:id/action', handleDriverIntervention);
router.put('/drivers/:id/reject', handleDriverRejection);
router.get('/users', getUserDirectory);
router.patch('/users/:id/status', handleEnforcementAction);
router.get('/analytics/snapshot', getAnalyticsSnapshot);
router.get('/notifications/snapshot', getNotificationSnapshot);
router.post('/notifications/broadcast', sendGlobalBroadcast);
router.get('/settings', getGlobalSettings);
router.put('/settings', updateGlobalSettings);
router.get('/profile', getAdminProfile);

export default router;