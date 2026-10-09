import express from 'express';
import {
  protect,
  requirePassenger,
  requireAdmin
} from '../middleware/authMiddleware.js';
import {
  triggerEmergencySOS,
  getActiveEmergency,
  getEmergencyById,
  updateEmergencyCategory,
  resolveEmergency,
  getTrustedContacts,
  addTrustedContact,
  updateTrustedContact,
  deleteTrustedContact,
  verifyTrustedContact,
  getSafetyPreferences,
  updateSafetyPreferences,
  recordDisclosureAcceptance,
  createIncidentReport,
  getPassengerIncidents,
  getIncidentById,
  adminGetEmergencyQueue,
  adminAcknowledgeEmergency,
  adminUpdateEmergencyStatus,
  adminRecordEscalation,
  adminGetIncidents
} from '../controllers/safetyController.js';

const router = express.Router();

/**
 * ============================================================================
 * PASSENGER EMERGENCY / SOS ENDPOINTS
 * ============================================================================
 */
router.post('/emergency', protect, requirePassenger, triggerEmergencySOS);
router.get('/emergency/active', protect, requirePassenger, getActiveEmergency);
router.get('/emergency/:id', protect, getEmergencyById);
router.patch('/emergency/:id/category', protect, requirePassenger, updateEmergencyCategory);
router.post('/emergency/:id/resolve', protect, requirePassenger, resolveEmergency);

/**
 * ============================================================================
 * TRUSTED CONTACTS ENDPOINTS (MAX 5)
 * ============================================================================
 */
router.get('/contacts', protect, requirePassenger, getTrustedContacts);
router.post('/contacts', protect, requirePassenger, addTrustedContact);
router.patch('/contacts/:id', protect, requirePassenger, updateTrustedContact);
router.delete('/contacts/:id', protect, requirePassenger, deleteTrustedContact);
router.post('/contacts/:id/verify', protect, requirePassenger, verifyTrustedContact);

/**
 * ============================================================================
 * SAFETY PREFERENCES & DISCLOSURE
 * ============================================================================
 */
router.get('/preferences', protect, requirePassenger, getSafetyPreferences);
router.patch('/preferences', protect, requirePassenger, updateSafetyPreferences);
router.post('/disclosure', protect, requirePassenger, recordDisclosureAcceptance);

/**
 * ============================================================================
 * INCIDENT REPORTING ENDPOINTS
 * ============================================================================
 */
router.post('/reports', protect, requirePassenger, createIncidentReport);
router.get('/reports', protect, requirePassenger, getPassengerIncidents);
router.get('/reports/:id', protect, getIncidentById);

/**
 * ============================================================================
 * ADMIN SAFETY & EMERGENCY DISPATCH OPERATIONS
 * ============================================================================
 */
router.get('/admin/queue', protect, requireAdmin, adminGetEmergencyQueue);
router.patch('/admin/emergency/:id/ack', protect, requireAdmin, adminAcknowledgeEmergency);
router.patch('/admin/emergency/:id/status', protect, requireAdmin, adminUpdateEmergencyStatus);
router.post('/admin/emergency/:id/escalate', protect, requireAdmin, adminRecordEscalation);
router.get('/admin/reports', protect, requireAdmin, adminGetIncidents);

export default router;
