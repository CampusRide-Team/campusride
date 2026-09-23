import api from '../axios';

export const routingService = {
  getRoute: async (originLng, originLat, destLng, destLat) => {
    const origin = `${originLng},${originLat}`;
    const destination = `${destLng},${destLat}`;
    const response = await api.get(`/routing/route?origin=${origin}&destination=${destination}`);
    return response.data;
  },
};

export default routingService;
