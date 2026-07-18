import express from 'express';
// Unified Admin Controller Imports
import { 
  getDashboardData,
  getPendingDrivers, 
  approveDriver,
  handleDriverRejection,
  broadcastNotification, 
  getNotificationsSnapshot, 
  deleteNotification 
} from '../controllers/adminController.js';

import { getAdminProfile } from '../controllers/adminProfileController.js';
import { getGlobalSettings, updateGlobalSettings } from '../controllers/settingController.js';
import { getAnalyticsSnapshot } from '../controllers/analyticsController.js';
import { getMonitoringSnapshot, handleDriverIntervention } from '../controllers/monitoringController.js';
import { getUserDirectory, handleEnforcementAction } from '../controllers/userDirectoryController.js';

// import { protect, requireRole } from '../middleware/authMiddleware.js'; // 💡 Temporarily comment out

const router = express.Router();

// router.use(protect);
// router.use(requireRole('admin'));

// Dashboard & Metrics
router.get('/dashboard', getDashboardData);

// Drivers Approve / Reject
router.get('/drivers/pending', getPendingDrivers);
router.put('/drivers/:id/approve', approveDriver);
router.put('/drivers/:id/reject', handleDriverRejection);

// Monitoring & Enforcement
router.get('/monitoring/snapshot', getMonitoringSnapshot);
router.post('/monitoring/driver/:id/action', handleDriverIntervention);
router.get('/users', getUserDirectory);
router.patch('/users/:id/status', handleEnforcementAction);

// Analytics
router.get('/analytics/snapshot', getAnalyticsSnapshot);

// Global Settings & Profile
router.get('/settings', getGlobalSettings);
router.put('/settings', updateGlobalSettings);
router.get('/profile', getAdminProfile);

// 🔔 Clean Notification System Endpoints
router.get('/notifications/snapshot', getNotificationsSnapshot); // Points directly to adminController
router.post('/notifications/broadcast', broadcastNotification);   // Points directly to adminController
router.delete('/notifications/:id', deleteNotification);          // Points directly to adminController

export default router;