// web-admin/src/api/safetyApi.js
import api from './axios';

export const safetyApi = {
  // Emergency Queue & Events
  getEmergencyQueue: async ({ status, page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (status && status !== 'all') {
      params.status = status;
    }
    const response = await api.get('/safety/admin/queue', { params });
    return response.data;
  },

  getEmergencyById: async (id) => {
    const response = await api.get(`/safety/emergency/${id}`);
    return response.data;
  },

  acknowledgeEmergency: async (id) => {
    const response = await api.post(`/safety/admin/emergency/${id}/ack`);
    return response.data;
  },

  updateEmergencyStatus: async (id, { status, notes, outcome }) => {
    const response = await api.post(`/safety/admin/emergency/${id}/status`, {
      status,
      notes,
      outcome
    });
    return response.data;
  },

  recordEscalation: async (id, { escalatedTo = 'campus_security', notes = '' }) => {
    const response = await api.post(`/safety/admin/emergency/${id}/escalate`, {
      escalatedTo,
      notes
    });
    return response.data;
  },

  // Incident Reports
  getIncidents: async ({ status, category, page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (status && status !== 'all') params.status = status;
    if (category && category !== 'all') params.category = category;
    const response = await api.get('/safety/admin/incidents', { params });
    return response.data;
  }
};

export default safetyApi;
