// frontend/src/api/services/safetyService.js
import api from '../axios';

export const safetyService = {
  // 1. Emergency SOS Operations
  triggerSOS: async ({ bookingId, tripId, location, category, source = 'passenger_sos', idempotencyKey } = {}) => {
    const payload = {
      bookingId: bookingId || null,
      tripId: tripId || null,
      location: location || null,
      category: category || null,
      source,
      idempotencyKey: idempotencyKey || null,
    };
    const response = await api.post('/safety/emergency', payload);
    return response.data;
  },

  getActiveEmergency: async () => {
    const response = await api.get('/safety/emergency/active');
    return response.data;
  },

  getEmergencyById: async (id) => {
    const response = await api.get(`/safety/emergency/${id}`);
    return response.data;
  },

  updateCategory: async (id, category) => {
    const response = await api.patch(`/safety/emergency/${id}/category`, { category });
    return response.data;
  },

  reportSafe: async (id, { reason = 'user_reported_safe', notes = '' } = {}) => {
    const response = await api.post(`/safety/emergency/${id}/resolve`, { reason, notes });
    return response.data;
  },

  // 2. Trusted Contacts Operations
  getTrustedContacts: async () => {
    const response = await api.get('/safety/contacts');
    return response.data;
  },

  addTrustedContact: async ({ name, phoneNumber, relationship }) => {
    const response = await api.post('/safety/contacts', { name, phoneNumber, relationship });
    return response.data;
  },

  updateTrustedContact: async (id, { name, phoneNumber, relationship, notificationPreferences }) => {
    const response = await api.patch(`/safety/contacts/${id}`, {
      name,
      phoneNumber,
      relationship,
      notificationPreferences,
    });
    return response.data;
  },

  deleteTrustedContact: async (id) => {
    const response = await api.delete(`/safety/contacts/${id}`);
    return response.data;
  },

  requestContactVerification: async (id) => {
    const response = await api.post(`/safety/contacts/${id}/verify`);
    return response.data;
  },

  // 3. Safety Preferences & Disclosure
  getSafetyPreferences: async () => {
    const response = await api.get('/safety/preferences');
    return response.data;
  },

  updateSafetyPreferences: async ({ autoShareAllRides, selectedTrustedContactIds }) => {
    const response = await api.patch('/safety/preferences', {
      autoShareAllRides,
      selectedTrustedContactIds,
    });
    return response.data;
  },

  recordDisclosureAcceptance: async (version = '1.0') => {
    const response = await api.post('/safety/disclosure', { version });
    return response.data;
  },

  // 4. Safety Concerns & Incident Reporting
  createIncidentReport: async ({ bookingId, category, description, severity = 'medium' }) => {
    const response = await api.post('/safety/reports', {
      bookingId: bookingId || null,
      category,
      description,
      severity,
    });
    return response.data;
  },

  getPassengerIncidents: async () => {
    const response = await api.get('/safety/reports');
    return response.data;
  },

  getIncidentById: async (id) => {
    const response = await api.get(`/safety/reports/${id}`);
    return response.data;
  },
};

export default safetyService;
