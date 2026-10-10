import api from '../axios';

// TODO(CAMPUSRIDE-BACKEND):
// Backend integration/evolution required.
// Required capability: authoritative road-following routing geometry,
// routed distance, and route duration for Passenger pickup → destination.
// Frontend route UX and map rendering boundary is intentionally implemented now.

export const routingService = {
  getRoute: async (originLng, originLat, destLng, destLat, options = {}) => {
    const origin = `${originLng},${originLat}`;
    const destination = `${destLng},${destLat}`;
    const response = await api.get(`/routing/route?origin=${origin}&destination=${destination}`, {
      signal: options.signal,
    });
    return response.data;
  },
};

export default routingService;
