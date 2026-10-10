import api from '../axios';

export const driverService = {
  updateAvailability: async (isOnline) => {
    const response = await api.put('/driver/availability', { isOnline });
    return response.data;
  },

  updateLocation: async (coordinates) => {
    const [longitude, latitude] = coordinates;
    const response = await api.put('/driver/location', { latitude, longitude });
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

  getDriverAnalytics: async () => {
    const response = await api.get('/driver/analytics');
    return response.data;
  },

  getPendingRequests: async () => {
    const response = await api.get('/dispatch-offers/pending');
    return response.data;
  },

  respondToOffer: async (offerId, responseValue) => {
    const response = await api.post(`/dispatch-offers/${offerId}/respond`, { response: responseValue });
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

  executeTripStop: async (tripId, stopId, payload) => {
    const response = await api.post(`/trips/${tripId}/stops/${stopId}/execute`, payload);
    return response.data;
  },
};

export default driverService;
