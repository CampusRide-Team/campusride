import api from '../axios';

export const bookingService = {
  createBooking: async (payload) => {
    const response = await api.post('/bookings', payload);
    return response.data;
  },

  getBookingById: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  getBookingHistory: async () => {
    const response = await api.get('/bookings/history');
    return response.data;
  },

  getCurrentBooking: async () => {
    const response = await api.get('/bookings/current');
    return response.data;
  },

  getScheduledBookings: async () => {
    const response = await api.get('/bookings/scheduled');
    return response.data;
  },

  cancelBooking: async (bookingId, reason = 'Cancelled by user') => {
    const response = await api.post(`/bookings/${bookingId}/cancel`, { reason });
    return response.data;
  },

  dispatchBooking: async (bookingId) => {
    const response = await api.post(`/bookings/${bookingId}/dispatch`);
    return response.data;
  },
};

export default bookingService;
