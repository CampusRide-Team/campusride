import api from '../axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_LOCATIONS_STORAGE_KEY = '@campusride_recent_locations';

export const poiService = {
  searchPOIs: async (query = '', category = '', limit = 20, options = {}) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    if (limit) params.append('limit', limit);
    if (options.external === true) params.append('external', 'true');

    const response = await api.get(`/pois/search?${params.toString()}`);
    return response.data;
  },

  searchOpenStreetMap: async (query = '', limit = 8) => (
    poiService.searchPOIs(query, '', limit, { external: true })
  ),

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

  submitCampusPlace: async ({ name, category, coordinates, campusZone }) => {
    const response = await api.post('/pois/submissions', { name, category, coordinates, campusZone });
    return response.data;
  },

  getMySubmissions: async () => {
    const response = await api.get('/pois/submissions/mine');
    return response.data;
  },

  // TODO(CAMPUSRIDE-BACKEND):
  // Backend integration/evolution required.
  // Required capability: Dedicated analytics-driven popular POI ranking endpoint (e.g. GET /api/v1/pois/popular or isPopular filter).
  // Frontend UX/state boundary is intentionally implemented now with curated fallback from existing POIs.
  getPopularPOIs: async (limit = 8) => {
    try {
      const response = await api.get(`/pois?limit=${limit}`);
      return response.data;
    } catch (err) {
      console.warn('[poiService] Failed to load popular POIs:', err);
      return { success: false, data: [] };
    }
  },

  resolveLocationCoordinates: async (lng, lat, maxDistance = 250) => {
    try {
      const response = await api.get(`/pois/reverse?lng=${lng}&lat=${lat}`);
      if (response.data?.success && response.data?.data) return response.data;
      throw new Error('No reverse-geocoding result');
    } catch (err) {
      return {
        success: true,
        data: {
          name: `Pinned location (${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)})`,
          isExactPoi: false,
          coordinates: [lng, lat],
          geocodingUnavailable: true,
        },
      };
    }
  },

  // TODO(CAMPUSRIDE-BACKEND):
  // Backend integration/evolution required.
  // Required capability: Cloud persistence and cross-device sync for passenger recent locations (e.g. GET/POST /api/v1/users/recent-locations).
  // Frontend UX/state boundary is intentionally implemented now with local AsyncStorage persistence.
  getRecentLocations: async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_LOCATIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  refreshRecentLocations: async (campusPois = []) => {
    const recent = await poiService.getRecentLocations();
    const currentById = new Map(
      campusPois
        .filter((poi) => poi?._id || poi?.id)
        .map((poi) => [String(poi._id || poi.id), poi])
    );
    const refreshed = recent.map((location) => {
      const poiId = location?.poiId;
      if (!poiId) return location;
      const current = currentById.get(String(poiId));
      if (!current) return null;
      const coordinates = current.coordinates?.coordinates || current.coordinates;
      return {
        ...location,
        name: current.name,
        coordinates,
        category: current.category,
        campusZone: current.campusZone,
        coordinateProvenance: current.coordinateProvenance,
        source: 'poi',
      };
    }).filter(Boolean);
    await AsyncStorage.setItem(RECENT_LOCATIONS_STORAGE_KEY, JSON.stringify(refreshed));
    return refreshed;
  },

  saveRecentLocation: async (location) => {
    try {
      if (!location || !location.name) return;
      const existing = await poiService.getRecentLocations();
      const locationId = location.poiId ? `poi:${location.poiId}` : `coord:${location.coordinates?.join(':')}`;
      const filtered = existing.filter((item) => {
        const itemId = item.poiId ? `poi:${item.poiId}` : `coord:${item.coordinates?.join(':')}`;
        return itemId !== locationId;
      });
      const updated = [location, ...filtered].slice(0, 5);
      await AsyncStorage.setItem(RECENT_LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[poiService] Failed to save recent location:', e);
    }
  },
};

export default poiService;
