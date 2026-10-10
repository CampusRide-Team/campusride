const DEFAULT_BASE_URL = 'https://nominatim.openstreetmap.org';
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MIN_REQUEST_INTERVAL_MS = 1100;

// University of Ghana/Legon campus and immediate access roads.
export const CAMPUS_BOUNDS = Object.freeze({
  west: -0.205,
  south: 5.63,
  east: -0.165,
  north: 5.675,
});

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const isWithinCampusBounds = (longitude, latitude, bounds = CAMPUS_BOUNDS) => (
  Number.isFinite(longitude)
  && Number.isFinite(latitude)
  && longitude >= bounds.west
  && longitude <= bounds.east
  && latitude >= bounds.south
  && latitude <= bounds.north
);

const deriveName = (result) => normalizeText(
  result?.namedetails?.name
  || result?.name
  || result?.address?.amenity
  || result?.address?.building
  || result?.address?.road
  || String(result?.display_name || '').split(',')[0]
);

const mapCategory = (result) => {
  const value = `${result?.category || ''} ${result?.type || ''} ${result?.addresstype || ''}`.toLowerCase();
  if (/library/.test(value)) return 'library';
  if (/hostel|dormitory|residential/.test(value)) return 'hostel';
  if (/college|university|school|faculty/.test(value)) return 'faculty';
  if (/market|food_court/.test(value)) return 'market';
  if (/gate|entrance|bus_stop/.test(value)) return 'gate';
  if (/administrative|government|townhall/.test(value)) return 'administration';
  if (/stadium|sports/.test(value)) return 'sports';
  return 'other';
};

export class GeocodingService {
  constructor(options = {}) {
    this.baseUrl = String(options.baseUrl || process.env.NOMINATIM_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.minRequestIntervalMs = options.minRequestIntervalMs ?? DEFAULT_MIN_REQUEST_INTERVAL_MS;
    this.bounds = options.bounds || CAMPUS_BOUNDS;
    this.userAgent = options.userAgent || process.env.GEOCODING_USER_AGENT || 'CampusRide/1.0 (University of Ghana campus transport demo)';
    this.cache = new Map();
    this.lastRequestAt = 0;
    this.requestQueue = Promise.resolve();
    this.pendingRequests = 0;
    this.maxPendingRequests = options.maxPendingRequests ?? 10;
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.storedAt > this.cacheTtlMs) {
      this.cache.delete(key);
      return null;
    }
    return cached.value;
  }

  setCached(key, value) {
    this.cache.set(key, { storedAt: Date.now(), value });
    return value;
  }

  scheduleRequest(operation) {
    if (this.pendingRequests >= this.maxPendingRequests) {
      return Promise.reject(new Error('GEOCODING_UNAVAILABLE: request queue is full'));
    }
    this.pendingRequests += 1;
    const execute = async () => {
      const delay = Math.max(0, this.minRequestIntervalMs - (Date.now() - this.lastRequestAt));
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      this.lastRequestAt = Date.now();
      return operation();
    };
    const queued = this.requestQueue.then(execute, execute);
    this.requestQueue = queued.catch(() => {});
    return queued.finally(() => {
      this.pendingRequests = Math.max(0, this.pendingRequests - 1);
    });
  }

  async request(path, params) {
    if (typeof this.fetchImpl !== 'function') throw new Error('GEOCODING_UNAVAILABLE: fetch is unavailable');
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }

    return this.scheduleRequest(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await this.fetchImpl(url.toString(), {
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`GEOCODING_UNAVAILABLE: provider returned HTTP ${response.status}`);
        return response.json();
      } finally {
        clearTimeout(timer);
      }
    });
  }

  normalizeResult(result, selectedCoordinates = null) {
    const longitude = Number(result?.lon);
    const latitude = Number(result?.lat);
    const name = deriveName(result);
    if (!name || !isWithinCampusBounds(longitude, latitude, this.bounds)) return null;

    const osmType = normalizeText(result?.osm_type);
    const osmId = normalizeText(result?.osm_id);
    return {
      name,
      displayName: normalizeText(result?.display_name) || name,
      coordinates: selectedCoordinates || [longitude, latitude],
      featureCoordinates: [longitude, latitude],
      category: mapCategory(result),
      campusZone: 'University of Ghana',
      source: selectedCoordinates ? 'reverse_geocoded' : 'poi',
      externalRef: osmType && osmId ? {
        provider: 'openstreetmap',
        osmType,
        osmId,
        osmKey: `${osmType}:${osmId}`,
      } : undefined,
      coordinateProvenance: {
        type: 'imported',
        source: osmType && osmId ? `OpenStreetMap ${osmType}/${osmId}` : 'OpenStreetMap Nominatim',
      },
    };
  }

  async search(query, limit = 8) {
    const cleanQuery = normalizeText(query);
    if (cleanQuery.length < 3) return [];
    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 10);
    const cacheKey = `search:${cleanQuery.toLowerCase()}:${safeLimit}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const rows = await this.request('/search', {
      format: 'jsonv2',
      // The bounded viewbox already constrains results to campus. Appending the
      // campus name breaks valid OSM short names/acronyms such as UGMC.
      q: cleanQuery,
      countrycodes: 'gh',
      addressdetails: 1,
      namedetails: 1,
      limit: safeLimit,
      bounded: 1,
      viewbox: `${this.bounds.west},${this.bounds.north},${this.bounds.east},${this.bounds.south}`,
    });
    const normalized = (Array.isArray(rows) ? rows : [])
      .map((row) => this.normalizeResult(row))
      .filter(Boolean);
    return this.setCached(cacheKey, normalized);
  }

  async reverse(longitudeInput, latitudeInput) {
    const longitude = Number(longitudeInput);
    const latitude = Number(latitudeInput);
    if (!isWithinCampusBounds(longitude, latitude, this.bounds)) {
      throw new Error('LOCATION_OUTSIDE_CAMPUS: Select a point within the University of Ghana campus area');
    }
    const cacheKey = `reverse:${longitude.toFixed(5)}:${latitude.toFixed(5)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const row = await this.request('/reverse', {
      format: 'jsonv2',
      lat: latitude,
      lon: longitude,
      zoom: 18,
      addressdetails: 1,
      namedetails: 1,
    });
    const normalized = this.normalizeResult(row, [longitude, latitude]);
    return this.setCached(cacheKey, normalized);
  }
}

export const geocodingService = new GeocodingService();

export default geocodingService;
