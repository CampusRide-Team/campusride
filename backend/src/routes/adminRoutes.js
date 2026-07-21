import express from 'express';
import { 
  getDashboardData,
  getCampusDemand, 
  getPendingDrivers, 
  approveDriver,
  updateUserStatus,
  handleDriverRejection,
  broadcastNotification, 
  getNotificationsSnapshot, 
  deleteNotification,
  getUserDirectory
} from '../controllers/adminController.js';

import { getAdminProfile } from '../controllers/adminProfileController.js';
import { getGlobalSettings, updateGlobalSettings } from '../controllers/settingController.js';
import { getAnalyticsSnapshot } from '../controllers/analyticsController.js';
import { getMonitoringSnapshot, handleDriverIntervention } from '../controllers/monitoringController.js';

// import { protect, requireRole } from '../middleware/authMiddleware.js'; //  Temporarily comment out for dev

const router = express.Router();

// router.use(protect);
// router.use(requireRole('admin'));

// Dashboard & Metrics
router.get('/dashboard', getDashboardData);
router.get('/dashboard/demand', getCampusDemand);

// Drivers Approve / Reject
router.get('/drivers/pending', getPendingDrivers);
router.put('/drivers/:id/approve', approveDriver);
router.put('/drivers/:id/reject', handleDriverRejection);

// Monitoring & Enforcement
router.get('/monitoring/snapshot', getMonitoringSnapshot);
router.post('/monitoring/driver/:id/action', handleDriverIntervention);

// User Directory & Account Enforcement
router.get('/users', getUserDirectory);  
router.patch('/users/:id/status', updateUserStatus); 

// Analytics
router.get('/analytics/snapshot', getAnalyticsSnapshot);

// Global Settings & Profile
router.get('/settings', getGlobalSettings);
router.put('/settings', updateGlobalSettings);
router.get('/profile', getAdminProfile);

// Clean Notification System Endpoints
router.get('/notifications/snapshot', getNotificationsSnapshot); 
router.post('/notifications/broadcast', broadcastNotification);   
router.delete('/notifications/:id', deleteNotification);       

export default router;