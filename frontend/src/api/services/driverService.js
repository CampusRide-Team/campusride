import api from '../axios';

export const driverService = {
  updateAvailability: async (isOnline) => {
    const response = await api.put('/driver/availability', { isOnline });
    return response.data;
  },

  updateLocation: async (coordinates) => {
    const response = await api.put('/driver/location', { coordinates });
    return response.data;
  },

  updateTelemetry: async (telemetry) => {
    const response = await api.put('/driver/telemetry', telemetry);
    return response.data;
  },

  getDriverProfile: async () => {
    const response = await api.get('/driver/profile');
    return response.data;
  },

  getDriverEarnings: async () => {
    const response = await api.get('/driver/earnings');
    return response.data;
  },

  getDriverAnalytics: async () => {
    const response = await api.get('/driver/analytics');
    return response.data;
  },

  getPendingRequests: async () => {
    const response = await api.get('/driver/pending-requests');
    return response.data;
  },

  getActiveDriverLocations: async () => {
    const response = await api.get('/driver/active-locations');
    return response.data;
  },

  getActiveTrip: async () => {
    const response = await api.get('/trips/active');
    return response.data;
  },

  claimSoloBooking: async (bookingId) => {
    const response = await api.post('/trips/solo', { bookingId });
    return response.data;
  },

  executeTripStop: async (tripId, stopId, payload) => {
    const response = await api.post(`/trips/${tripId}/stops/${stopId}/execute`, payload);
    return response.data;
  },
};

export default driverService;
