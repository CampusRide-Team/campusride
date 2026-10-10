import api from '../axios';

export const ratingService = {
  submitRating: async (payload) => {
    const response = await api.post('/ratings', payload);
    return response.data;
  },

  getDriverRatings: async (driverId) => {
    const response = await api.get(`/ratings/driver/${driverId}`);
    return response.data;
  },
};

export default ratingService;
