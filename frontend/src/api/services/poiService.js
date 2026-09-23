import api from '../axios';

export const poiService = {
  searchPOIs: async (query = '', category = '', limit = 20) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    if (limit) params.append('limit', limit);

    const response = await api.get(`/pois/search?${params.toString()}`);
    return response.data;
  },

  getNearestPOI: async (lng, lat, maxDistance = 500) => {
    const response = await api.get(`/pois/nearest?lng=${lng}&lat=${lat}&maxDistance=${maxDistance}`);
    return response.data;
  },

  getAllPOIs: async (limit = 50) => {
    const response = await api.get(`/pois?limit=${limit}`);
    return response.data;
  },

  getPOIById: async (id) => {
    const response = await api.get(`/pois/${id}`);
    return response.data;
  },
};

export default poiService;
