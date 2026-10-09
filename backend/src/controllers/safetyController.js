import safetyService, { sanitizeSafetyEventForPassenger, sanitizeSafetyEventForAdmin } from '../services/safetyService.js';
import trustedContactService from '../services/trustedContactService.js';
import incidentService from '../services/incidentService.js';
import User from '../models/User.js';

/**
 * ============================================================================
 * PASSENGER EMERGENCY / SOS CONTROLLERS
 * ============================================================================
 */

export const triggerEmergencySOS = async (req, res) => {
  try {
    const passengerId = req.user._id || req.user.id;
    const { bookingId, tripId, location, category, source, idempotencyKey } = req.body;
    const io = req.app.get('io');

    const result = await safetyService.createSafetyEvent({
      passengerId,
      bookingId,
      tripId,
      location,
      category,
      source: source || 'passenger_sos',
      idempotencyKey,
      io
    });

    return res.status(result.isExisting ? 200 : 201).json({
      success: true,
      data: {
        event: sanitizeSafetyEventForPassenger(result.event),
        isExisting: result.isExisting
      }
    });
  } catch (error) {
    return res.status(error.message.includes('UNAUTHORIZED') ? 403 : 400).json({
      success: false,
      error: {
        code: error.message.split(':')[0] || 'EMERGENCY_CREATION_FAILED',
        message: error.message
      }
    });
  }
};

export const getActiveEmergency = async (req, res) => {
  try {
    const passengerId = req.user._id || req.user.id;
    const event = await safetyService.getPassengerActiveEmergency(passengerId);

    return res.status(200).json({
      success: true,
      data: {
        event: event ? sanitizeSafetyEventForPassenger(event) : null
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'FETCH_ACTIVE_EMERGENCY_FAILED', message: error.message }
    });
  }
};

export const getEmergencyById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await safetyService.getSafetyEventById(id, req.user);

    const sanitized = req.user.role === 'admin'
      ? sanitizeSafetyEventForAdmin(event)
      : sanitizeSafetyEventForPassenger(event);

    return res.status(200).json({
      success: true,
      data: { event: sanitized }
    });
  } catch (error) {
    const statusCode = error.message.includes('UNAUTHORIZED') ? 403 : (error.message.includes('NOT_FOUND') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'FETCH_EMERGENCY_FAILED', message: error.message }
    });
  }
};

export const updateEmergencyCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const passengerId = req.user._id || req.user.id;
    const { category } = req.body;
    const io = req.app.get('io');

    const updated = await safetyService.updateEmergencyCategory({
      eventId: id,
      passengerId,
      category,
      io
    });

    return res.status(200).json({
      success: true,
      data: { event: sanitizeSafetyEventForPassenger(updated) }
    });
  } catch (error) {
    const statusCode = error.message.includes('UNAUTHORIZED') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'CATEGORY_UPDATE_FAILED', message: error.message }
    });
  }
};

export const resolveEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const passengerId = req.user._id || req.user.id;
    const { reason, notes } = req.body;
    const io = req.app.get('io');

    const resolved = await safetyService.reportPassengerSafe({
      eventId: id,
      passengerId,
      reason: reason || 'user_reported_safe',
      notes,
      io
    });

    return res.status(200).json({
      success: true,
      data: { event: sanitizeSafetyEventForPassenger(resolved) }
    });
  } catch (error) {
    const statusCode = error.message.includes('UNAUTHORIZED') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'EMERGENCY_RESOLUTION_FAILED', message: error.message }
    });
  }
};

/**
 * ============================================================================
 * TRUSTED CONTACTS CONTROLLERS
 * ============================================================================
 */

export const getTrustedContacts = async (req, res) => {
  try {
    const passengerId = req.user._id || req.user.id;
    const contacts = await trustedContactService.getContacts(passengerId);

    return res.status(200).json({
      success: true,
      data: { contacts }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'FETCH_CONTACTS_FAILED', message: error.message }
    });
  }
};

export const addTrustedContact = async (req, res) => {
  try {
    const passengerId = req.user._id || req.user.id;
    const { name, phoneNumber, relationship } = req.body;

    const contact = await trustedContactService.addContact(passengerId, {
      name,
      phoneNumber,
      relationship
    });

    return res.status(201).json({
      success: true,
      data: { contact }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'ADD_CONTACT_FAILED', message: error.message }
    });
  }
};

export const updateTrustedContact = async (req, res) => {
  try {
    const passengerId = req.user._id || req.user.id;
    const { id } = req.params;
    const { name, phoneNumber, relationship, notificationPreferences } = req.body;

    const contact = await trustedContactService.updateContact(passengerId, id, {
      name,
      phoneNumber,
      relationship,
      notificationPreferences
    });

    return res.status(200).json({
      success: true,
      data: { contact }
    });
  } catch (error) {
    const statusCode = error.message.includes('UNAUTHORIZED') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'UPDATE_CONTACT_FAILED', message: error.message }
    });
  }
};

export const deleteTrustedContact = async (req, res) => {
  try {
    const passengerId = req.user._id || req.user.id;
    const { id } = req.params;

    const result = await trustedContactService.deleteContact(passengerId, id);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const statusCode = error.message.includes('UNAUTHORIZED') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'DELETE_CONTACT_FAILED', message: error.message }
    });
  }
};

export const verifyTrustedContact = async (req, res) => {
  try {
    const passengerId = req.user._id || req.user.id;
    const { id } = req.params;

    const result = await trustedContactService.requestContactVerification(passengerId, id);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'VERIFY_CONTACT_FAILED', message: error.message }
    });
  }
};

/**
 * ============================================================================
 * SAFETY PREFERENCES & DISCLOSURE
 * ============================================================================
 */

export const getSafetyPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select('safetyPreferences safetyDisclosure');

    return res.status(200).json({
      success: true,
      data: {
        safetyPreferences: user?.safetyPreferences || {
          autoShareAllRides: false,
          selectedTrustedContactIds: []
        },
        safetyDisclosure: user?.safetyDisclosure || {
          version: null,
          acceptedAt: null
        }
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'FETCH_PREFERENCES_FAILED', message: error.message }
    });
  }
};

export const updateSafetyPreferences = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { autoShareAllRides, selectedTrustedContactIds } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    if (typeof autoShareAllRides === 'boolean') {
      user.safetyPreferences.autoShareAllRides = autoShareAllRides;
    }
    if (Array.isArray(selectedTrustedContactIds)) {
      user.safetyPreferences.selectedTrustedContactIds = selectedTrustedContactIds;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: { safetyPreferences: user.safetyPreferences }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'UPDATE_PREFERENCES_FAILED', message: error.message }
    });
  }
};

export const recordDisclosureAcceptance = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { version } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    user.safetyDisclosure = {
      version: version || '1.0',
      acceptedAt: new Date(),
      ipAddress: typeof ipAddress === 'string' ? ipAddress : null
    };

    await user.save();

    return res.status(200).json({
      success: true,
      data: { safetyDisclosure: user.safetyDisclosure }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'DISCLOSURE_ACCEPTANCE_FAILED', message: error.message }
    });
  }
};

/**
 * ============================================================================
 * INCIDENT REPORTING CONTROLLERS
 * ============================================================================
 */

export const createIncidentReport = async (req, res) => {
  try {
    const passengerId = req.user._id || req.user.id;
    const { bookingId, category, description, severity } = req.body;

    const report = await incidentService.createIncidentReport(passengerId, {
      bookingId,
      category,
      description,
      severity
    });

    return res.status(201).json({
      success: true,
      data: { report }
    });
  } catch (error) {
    const statusCode = error.message.includes('UNAUTHORIZED') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'INCIDENT_REPORT_FAILED', message: error.message }
    });
  }
};

export const getPassengerIncidents = async (req, res) => {
  try {
    const passengerId = req.user._id || req.user.id;
    const reports = await incidentService.getPassengerIncidents(passengerId);

    return res.status(200).json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'FETCH_INCIDENTS_FAILED', message: error.message }
    });
  }
};

export const getIncidentById = async (req, res) => {
  try {
    const passengerId = req.user._id || req.user.id;
    const { id } = req.params;

    const report = await incidentService.getIncidentById(passengerId, id, req.user.role);

    return res.status(200).json({
      success: true,
      data: { report }
    });
  } catch (error) {
    const statusCode = error.message.includes('UNAUTHORIZED') ? 403 : 404;
    return res.status(statusCode).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'FETCH_INCIDENT_FAILED', message: error.message }
    });
  }
};

/**
 * ============================================================================
 * ADMIN SAFETY CONTROLLERS
 * ============================================================================
 */

export const adminGetEmergencyQueue = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const queue = await safetyService.adminGetEmergencyQueue({
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    });

    return res.status(200).json({
      success: true,
      data: queue
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'FETCH_QUEUE_FAILED', message: error.message }
    });
  }
};

export const adminAcknowledgeEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get('io');

    const event = await safetyService.adminAcknowledgeEmergency({
      eventId: id,
      adminUser: req.user,
      io
    });

    return res.status(200).json({
      success: true,
      data: { event: sanitizeSafetyEventForAdmin(event) }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'ADMIN_ACK_FAILED', message: error.message }
    });
  }
};

export const adminUpdateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, outcome } = req.body;
    const io = req.app.get('io');

    const event = await safetyService.adminUpdateEmergencyStatus({
      eventId: id,
      adminUser: req.user,
      status,
      notes,
      outcome,
      io
    });

    return res.status(200).json({
      success: true,
      data: { event: sanitizeSafetyEventForAdmin(event) }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'ADMIN_STATUS_UPDATE_FAILED', message: error.message }
    });
  }
};

export const adminRecordEscalation = async (req, res) => {
  try {
    const { id } = req.params;
    const { escalatedTo, notes } = req.body;
    const io = req.app.get('io');

    const event = await safetyService.adminRecordEscalation({
      eventId: id,
      adminUser: req.user,
      escalatedTo,
      notes,
      io
    });

    return res.status(200).json({
      success: true,
      data: { event: sanitizeSafetyEventForAdmin(event) }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: error.message.split(':')[0] || 'ADMIN_ESCALATION_FAILED', message: error.message }
    });
  }
};

export const adminGetIncidents = async (req, res) => {
  try {
    const { status, category, page, limit } = req.query;
    const queue = await incidentService.adminGetIncidents({
      status,
      category,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    });

    return res.status(200).json({
      success: true,
      data: queue
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'FETCH_ADMIN_INCIDENTS_FAILED', message: error.message }
    });
  }
};

export default {
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
};
