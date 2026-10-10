import CampusPOI from '../models/CampusPOI.js';
import geocodingService from './geocodingService.js';

const osmMetadata = (osmType, osmId) => ({
  coordinateProvenance: {
    type: 'imported',
    source: `OpenStreetMap ${osmType}/${osmId}`
  },
  externalRef: {
    provider: 'openstreetmap',
    osmType,
    osmId: String(osmId),
    osmKey: `${osmType}:${osmId}`
  }
});

// Canonical University of Ghana (Legon) Campus POI Seed Dataset
// High-confidence entries use OpenStreetMap feature centroids. Ambiguous legacy
// approximations remain inactive until an exact campus feature/gate is verified.
export const CANONICAL_CAMPUS_POIS = [
  {
    name: 'Balme Library',
    aliases: ['Balme', 'Library', 'Main Library', 'Balme Library Complex'],
    category: 'library',
    coordinates: { type: 'Point', coordinates: [-0.1870475, 5.6520294] },
    campusZone: 'Central',
    ...osmMetadata('relation', '7304886'),
    isActive: true
  },
  {
    name: 'Pentagon Hostel',
    aliases: ['Pent', 'Pentagon', 'Pentagon Hall', 'African Union Hall', 'Ghana Hostels', 'GHL'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.1814755, 5.6565261] },
    campusZone: 'Diaspora',
    ...osmMetadata('node', '9659844417'),
    isActive: true
  },
  {
    name: 'Evandy Hostel',
    aliases: ['Evandy', 'Evandy Gate', 'Evandy Hostel Gate'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.1818104, 5.6631104] },
    campusZone: 'Diaspora',
    ...osmMetadata('node', '9658883717'),
    isActive: true
  },
  {
    name: 'Bani Hostel',
    aliases: ['Bani', 'Bani Hall', 'Bani Hostel Gate'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.1799969, 5.6632559] },
    campusZone: 'Diaspora',
    ...osmMetadata('way', '368856637'),
    isActive: true
  },
  {
    name: 'James Topp Nelson Yankah Hall',
    aliases: ['TF', 'TF Hostel', 'James Topp', 'Nelson Yankah', 'JTN Hall', 'TF Hostel Gate'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.1820882, 5.6662750] },
    campusZone: 'Diaspora',
    ...osmMetadata('way', '286261174'),
    isActive: true
  },
  {
    name: 'Night Market',
    aliases: ['Night Market', 'NM', 'Market', 'Night Market Taxi Rank'],
    category: 'market',
    coordinates: { type: 'Point', coordinates: [-0.1856043, 5.6421513] },
    campusZone: 'South',
    ...osmMetadata('way', '773864855'),
    isActive: true
  },
  {
    name: 'University Main Gate',
    aliases: ['Main Gate', 'UG Gate', 'Okponglo Gate', 'UG Main Gate'],
    category: 'gate',
    coordinates: { type: 'Point', coordinates: [-0.1852, 5.6425] },
    campusZone: 'South',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: false
  },
  {
    name: 'University of Ghana Business School',
    aliases: ['Business School', 'UGBS', 'UGBS Graduate Building', 'UGBS Grad', 'Graduate School'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.1886270, 5.6528087] },
    campusZone: 'Central',
    ...osmMetadata('node', '9659866317'),
    isActive: true
  },
  {
    name: 'Great Hall',
    aliases: ['Great Hall', 'Tower', 'UG Great Hall'],
    category: 'administration',
    coordinates: { type: 'Point', coordinates: [-0.1962160, 5.6506780] },
    campusZone: 'North',
    ...osmMetadata('way', '720486436'),
    isActive: true
  },
  {
    name: 'Volta Hall',
    aliases: ['Volta', 'Volta Hall'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.1894806, 5.6517282] },
    campusZone: 'Central',
    ...osmMetadata('way', '320072537'),
    isActive: true
  },
  {
    name: 'Commonwealth Hall',
    aliases: ['Vandal City', 'Commonwealth', 'Vandals'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.1926480, 5.6505213] },
    campusZone: 'North',
    ...osmMetadata('way', '497853937'),
    isActive: true
  },
  {
    name: 'Akuafo Hall',
    aliases: ['Akuafo', 'Akuafo Roundabout', 'Akuafo Hall'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.18600894, 5.64971649] },
    campusZone: 'Central',
    ...osmMetadata('way', '421358833'),
    isActive: true
  },
  {
    name: 'Legon Hall',
    aliases: ['Legon', 'Legon Hall'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.1885152, 5.6474406] },
    campusZone: 'Central',
    ...osmMetadata('way', '1548976998'),
    isActive: true
  },
  {
    name: 'Mensah Sarbah Hall',
    aliases: ['Sarbah', 'Okpo', 'Sarbah Hall', 'Mensah Sarbah'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.1865983, 5.6456695] },
    campusZone: 'South',
    ...osmMetadata('way', '497853938'),
    isActive: true
  },
  {
    name: 'UG Fire Station / Central Admin',
    aliases: ['Fire Station', 'Central Admin', 'UG Central Administration'],
    category: 'administration',
    coordinates: { type: 'Point', coordinates: [-0.1850, 5.6470] },
    campusZone: 'South',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: false
  },
  {
    name: 'University of Ghana Medical Centre',
    aliases: ['UGMC', 'UG Medical Centre', 'UG Medical Center', 'University of Ghana Medical Center', 'University of Ghana Medical Center Limited'],
    category: 'other',
    coordinates: { type: 'Point', coordinates: [-0.1861142, 5.6322812] },
    campusZone: 'South',
    ...osmMetadata('way', '464683570'),
    isActive: true
  },
  {
    name: 'University of Ghana Hospital',
    aliases: ['UG Hospital', 'Legon Hospital', 'University Hospital', 'UG Clinic'],
    category: 'other',
    coordinates: { type: 'Point', coordinates: [-0.1781098, 5.6518437] },
    campusZone: 'East',
    ...osmMetadata('way', '278268702'),
    isActive: true
  },
  {
    name: 'International Students Hostel 1',
    aliases: ['ISH 1', 'ISH1', 'International Hostel 1', 'International Students Hostel One'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.18513193, 5.63979423] },
    campusZone: 'South',
    ...osmMetadata('way', '278303018'),
    isActive: true
  },
  {
    name: 'International Students Hostel 2',
    aliases: ['ISH 2', 'ISH2', 'International Hostel 2', 'International Students Hostel Two'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.18608129, 5.64157339] },
    campusZone: 'South',
    ...osmMetadata('way', '278303020'),
    isActive: true
  },
  {
    name: 'Hilla Limann Hall',
    aliases: ['Limann', 'Hilla Limann', 'Limann Hall'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.1846508, 5.6374645] },
    campusZone: 'South',
    ...osmMetadata('node', '7147521853'),
    isActive: true
  },
  {
    name: 'Alexander Kwapong Hall',
    aliases: ['Kwapong', 'Kwapong Hall', 'Alex Kwapong', 'Alexander Adum Kwapong Hall'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.1850026, 5.6364947] },
    campusZone: 'South',
    ...osmMetadata('node', '7147491430'),
    isActive: true
  },
  {
    name: 'Central Cafeteria',
    aliases: ['Central Cafeteria CC', 'CC', 'Central Cafe', 'Central Cafeteria, CC'],
    category: 'market',
    coordinates: { type: 'Point', coordinates: [-0.18713522, 5.647002] },
    campusZone: 'Central',
    ...osmMetadata('way', '278303032'),
    isActive: true
  },
  {
    name: 'University of Ghana Bookshop',
    aliases: ['UG Bookshop', 'Legon Bookshop', 'University Bookshop', 'Bookshop'],
    category: 'other',
    coordinates: { type: 'Point', coordinates: [-0.1866655, 5.65113656] },
    campusZone: 'Central',
    ...osmMetadata('way', '278303014'),
    isActive: true
  },
  {
    name: 'University of Ghana Registry',
    aliases: ['UG Registry', 'Registry', 'Academic Registry'],
    category: 'administration',
    coordinates: { type: 'Point', coordinates: [-0.1953859, 5.6502253] },
    campusZone: 'North',
    ...osmMetadata('node', '4392733689'),
    isActive: true
  },
  {
    name: 'University of Ghana Botanical Gardens',
    aliases: ['Botanical Gardens', 'Legon Botanical Gardens', 'UG Botanical Gardens', 'Botanical Garden'],
    category: 'other',
    coordinates: { type: 'Point', coordinates: [-0.18735334, 5.66295286] },
    campusZone: 'North',
    ...osmMetadata('way', '335456879'),
    isActive: true
  },
  {
    name: 'University of Ghana Sports Stadium',
    aliases: ['UG Sports Stadium', 'Legon Stadium', 'Sports Stadium', 'UG Stadium'],
    category: 'sports',
    coordinates: { type: 'Point', coordinates: [-0.1800851, 5.6390270] },
    campusZone: 'South',
    ...osmMetadata('way', '1273337678'),
    isActive: true
  },
  {
    name: 'Computer Science Department',
    aliases: ['Computer Science', 'CS Department', 'CS Dept', 'Department of Computer Science'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.18377758, 5.65445108] },
    campusZone: 'Central',
    ...osmMetadata('way', '665125612'),
    isActive: true
  },
  {
    name: 'Chemistry Department',
    aliases: ['Chemistry', 'Chemistry Department University of Ghana', 'Chem Dept'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.18570112, 5.65204854] },
    campusZone: 'Central',
    ...osmMetadata('way', '318247933'),
    isActive: true
  },
  {
    name: 'School of Engineering Sciences',
    aliases: ['School of Engineering', 'Engineering School', 'Engineering', 'SES'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.1830511, 5.6555123] },
    campusZone: 'Central',
    ...osmMetadata('node', '9659871717'),
    isActive: true
  },
  {
    name: 'School of Law',
    aliases: ['Law School', 'UG Law School', 'Faculty of Law', 'Law Faculty'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.18322012, 5.65422462] },
    campusZone: 'Central',
    ...osmMetadata('way', '430197431'),
    isActive: true
  },
  {
    name: 'School of Nursing and Midwifery',
    aliases: ['Nursing School', 'School of Nursing', 'Nursing and Midwifery', 'SONM'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.19009302, 5.65353082] },
    campusZone: 'Central',
    ...osmMetadata('way', '394125223'),
    isActive: true
  },
  {
    name: 'School of Performing Arts',
    aliases: ['Performing Arts', 'SPA', 'School of Performing Art'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.18134432, 5.6497655] },
    campusZone: 'Central',
    ...osmMetadata('way', '430197435'),
    isActive: true
  },
  {
    name: 'Department of Economics',
    aliases: ['Economics Department', 'Economics', 'Econs Department'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.18741634, 5.65112675] },
    campusZone: 'Central',
    ...osmMetadata('way', '278303013'),
    isActive: true
  },
  {
    name: 'Political Science Department',
    aliases: ['Political Science', 'Poli Sci', 'Political Science Dept'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.18640504, 5.65492176] },
    campusZone: 'Central',
    ...osmMetadata('way', '335456886'),
    isActive: true
  },
  {
    name: 'Psychology Department',
    aliases: ['Psychology', 'Psych Department', 'Psychology Dept'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.18673503, 5.65510149] },
    campusZone: 'Central',
    ...osmMetadata('way', '335456881'),
    isActive: true
  },
  {
    name: 'Department of Geography and Resource Development',
    aliases: ['Geography Department', 'Geography', 'Geography and Resource Development', 'DGRD'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.1833029, 5.65097312] },
    campusZone: 'Central',
    ...osmMetadata('way', '394125206'),
    isActive: true
  },
  {
    name: 'Department of Physics',
    aliases: ['Physics Department', 'Physics', 'Physics Dept'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.1860522, 5.6514369] },
    campusZone: 'Central',
    ...osmMetadata('node', '9660304007'),
    isActive: true
  },
  {
    name: 'University of Ghana Computing Systems',
    aliases: ['UGCS', 'Computing Systems', 'University of Ghana Computing Systems UGCS'],
    category: 'administration',
    coordinates: { type: 'Point', coordinates: [-0.18809832, 5.65220608] },
    campusZone: 'Central',
    ...osmMetadata('way', '130857930'),
    isActive: true
  },
  {
    name: 'University of Ghana Guest Centre',
    aliases: ['UG Guest Centre', 'Guest Centre', 'Legon Guest Centre', 'Guest Center'],
    category: 'other',
    coordinates: { type: 'Point', coordinates: [-0.19002444, 5.64513768] },
    campusZone: 'South',
    ...osmMetadata('way', '492729606'),
    isActive: true
  },
  {
    name: 'Cedi Conference Centre',
    aliases: ['Cedi Centre', 'Cedi Center', 'Cedi Conference Center'],
    category: 'other',
    coordinates: { type: 'Point', coordinates: [-0.1883128, 5.6516108] },
    campusZone: 'Central',
    ...osmMetadata('way', '670708229'),
    isActive: true
  },
  {
    name: 'West Africa Centre for Crop Improvement',
    aliases: ['WACCI', 'Crop Improvement Centre', 'West African Centre for Crop Improvement'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.1841306, 5.6491112] },
    campusZone: 'Central',
    ...osmMetadata('node', '4637583291'),
    isActive: true
  },
  {
    name: 'West African Centre for Cell Biology of Infectious Pathogens',
    aliases: ['WACCBIP', 'Cell Biology Centre', 'West African Centre for Cell Biology'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.18955062, 5.65483991] },
    campusZone: 'Central',
    ...osmMetadata('way', '278303028'),
    isActive: true
  },
  {
    name: 'Valco Trust Hostel Phase 1',
    aliases: ['Valco Hostel 1', 'Valco Phase 1', 'Valco Trust Hostel 1'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.1868115, 5.64476996] },
    campusZone: 'South',
    ...osmMetadata('way', '278303038'),
    isActive: true
  },
  {
    name: 'Valco Trust Hostel Phase 2',
    aliases: ['Valco Hostel 2', 'Valco Phase 2', 'Valco Trust Hostel 2'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.18678034, 5.644228] },
    campusZone: 'South',
    ...osmMetadata('way', '278303034'),
    isActive: true
  }
];

/**
 * Idempotently seeds canonical campus POIs into the database.
 * Safe to execute on server bootstrap or via migration script.
 */
export const seedCampusPOIs = async () => {
  let createdCount = 0;
  let updatedCount = 0;

  for (const poi of CANONICAL_CAMPUS_POIS) {
    const identityFilters = [{ name: poi.name }];
    if (poi.externalRef?.osmKey) {
      identityFilters.push({ 'externalRef.osmKey': poi.externalRef.osmKey });
    }
    const existing = await CampusPOI.findOne({ $or: identityFilters });
    if (existing) {
      Object.assign(existing, poi);
      existing.moderationStatus = 'approved';
      await existing.save();
      updatedCount++;
    } else {
      await CampusPOI.create({ ...poi, moderationStatus: 'approved' });
      createdCount++;
    }
  }

  // These identities were replaced by verified OSM-backed canonical names.
  await CampusPOI.updateMany(
    { name: { $in: ['UGBS Graduate Building', 'Legon Night Market', 'TF Hostel'] } },
    { $set: { isActive: false } }
  );

  return { total: CANONICAL_CAMPUS_POIS.length, createdCount, updatedCount };
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSearchText = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const rankPOIsForQuery = (pois, query) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [...pois].sort((left, right) => left.name.localeCompare(right.name));
  }

  const score = (poi) => {
    const name = normalizeSearchText(poi.name);
    const aliases = (poi.aliases || []).map(normalizeSearchText);
    const allNames = [name, ...aliases];
    if (name === normalizedQuery) return 0;
    if (aliases.includes(normalizedQuery)) return 1;
    if (allNames.some((value) => value.startsWith(normalizedQuery))) return 2;
    if (allNames.some((value) => value.split(' ').some((word) => word.startsWith(normalizedQuery)))) return 3;
    if (allNames.some((value) => value.includes(normalizedQuery))) return 4;
    return 5;
  };

  return [...pois].sort((left, right) => (
    score(left) - score(right)
    || left.name.localeCompare(right.name)
  ));
};

/**
 * Searches canonical POIs by name, alias, category, or zone
 */
export const searchPOIs = async ({ query, category, campusZone, limit = 10 }) => {
  const filter = { isActive: true };

  if (category) {
    filter.category = category;
  }
  if (campusZone) {
    filter.campusZone = campusZone;
  }
  if (query && query.trim()) {
    const cleanQuery = escapeRegExp(query.trim());
    const regex = new RegExp(cleanQuery, 'i');
    filter.$or = [
      { name: regex },
      { aliases: regex }
    ];
  }

  const requestedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const candidates = await CampusPOI.find(filter)
    .limit(query?.trim() ? Math.max(requestedLimit * 5, 100) : requestedLimit)
    .sort({ name: 1 });
  return rankPOIsForQuery(candidates, query).slice(0, requestedLimit);
};

const cacheExternalPOI = async (place) => {
  if (!place?.externalRef?.osmKey) return null;
  const payload = {
    name: place.name,
    category: place.category || 'other',
    coordinates: { type: 'Point', coordinates: place.featureCoordinates || place.coordinates },
    campusZone: place.campusZone || 'University of Ghana',
    coordinateProvenance: place.coordinateProvenance,
    externalRef: place.externalRef,
    isActive: true,
  };

  // Prefer the stable OSM identity, while allowing a verified canonical record
  // with the same name to acquire that identity on first lookup.
  const existing = await CampusPOI.findOne({
    $or: [
      { 'externalRef.osmKey': place.externalRef.osmKey },
      { name: place.name },
    ],
  });
  if (existing) {
    existing.coordinates = payload.coordinates;
    existing.coordinateProvenance = payload.coordinateProvenance;
    existing.externalRef = payload.externalRef;
    existing.isActive = true;
    return existing.save();
  }
  return CampusPOI.create({ ...payload, aliases: [] });
};

export const searchPOIsWithExternal = async ({ query, category, campusZone, limit = 10 }) => {
  const local = await searchPOIs({ query, category, campusZone, limit });
  const cleanQuery = String(query || '').trim();
  if (cleanQuery.length < 3) return { pois: local, externalStatus: 'not_requested' };

  try {
    const externalPlaces = await geocodingService.search(cleanQuery, Math.min(Number(limit) || 10, 8));
    const cachedExternal = (await Promise.all(externalPlaces.map(cacheExternalPOI))).filter(Boolean);
    const seen = new Set();
    const combined = [...local, ...cachedExternal].filter((poi) => {
      const key = poi.externalRef?.osmKey || `id:${poi._id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { pois: combined.slice(0, Number(limit) || 10), externalStatus: 'ok' };
  } catch (error) {
    console.warn('[geocoding] Search unavailable:', error.message);
    return { pois: local, externalStatus: 'unavailable' };
  }
};

export const reverseGeocodeLocation = async (longitude, latitude) => {
  const result = await geocodingService.reverse(longitude, latitude);
  if (!result) return null;
  return {
    name: result.name,
    displayName: result.displayName,
    coordinates: result.coordinates,
    source: 'reverse_geocoded',
    isExactPoi: false,
    nearbyPoi: {
      name: result.name,
      coordinates: result.featureCoordinates,
      category: result.category,
      externalRef: result.externalRef,
    },
    coordinateProvenance: result.coordinateProvenance,
  };
};

/**
 * Finds the nearest POI to given [longitude, latitude] coordinates
 */
export const findNearestPOI = async (longitude, latitude, maxDistanceMeters = 500) => {
  const pois = await CampusPOI.find({
    isActive: true,
    coordinates: {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: maxDistanceMeters
      }
    }
  }).limit(1);

  return pois.length > 0 ? pois[0] : null;
};

export const CANONICAL_LOCATION_SOURCES = Object.freeze([
  'poi',
  'device_gps',
  'map_pin',
  'reverse_geocoded'
]);

const LOCATION_SOURCE_ALIASES = Object.freeze({
  gps_current: 'device_gps',
  gps_pin: 'device_gps'
});

export const normalizeLocationSource = (source, fallback = 'map_pin') => {
  const normalized = LOCATION_SOURCE_ALIASES[source] || source || fallback;
  if (!CANONICAL_LOCATION_SOURCES.includes(normalized)) {
    throw new Error(`INVALID_LOCATION_SOURCE: Unsupported location source [${source}]`);
  }
  return normalized;
};

const normalizeGpsMetadata = (locationInput) => {
  const accuracyMeters = Number(locationInput?.gps?.accuracyMeters ?? locationInput?.accuracy);
  const capturedAtValue = locationInput?.gps?.capturedAt ?? locationInput?.locationTimestamp;
  const capturedAt = new Date(capturedAtValue);
  const ageMs = Date.now() - capturedAt.getTime();

  if (!Number.isFinite(accuracyMeters) || accuracyMeters < 0 || accuracyMeters > 100) {
    throw new Error('INVALID_GPS_ACCURACY: Device GPS accuracy must be between 0 and 100 meters');
  }
  if (Number.isNaN(capturedAt.getTime()) || ageMs > 2 * 60 * 1000 || ageMs < -30 * 1000) {
    throw new Error('STALE_GPS_LOCATION: Device GPS capture time must be current');
  }

  return { accuracyMeters, capturedAt };
};

/**
 * Resolves a human-entered landmark or location name into a structured RideLocation object
 */
export const resolveLocation = async (locationInput) => {
  if (!locationInput) {
    throw new Error('MISSING_LOCATION: Pickup and destination must include selected coordinates');
  }

  // If locationInput is already a structured object with coordinates
  if (typeof locationInput === 'object' && locationInput.coordinates) {
    const coords = Array.isArray(locationInput.coordinates) 
      ? locationInput.coordinates 
      : locationInput.coordinates.coordinates;
    const longitude = Number(coords?.[0]);
    const latitude = Number(coords?.[1]);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      throw new Error('INVALID_LOCATION_COORDINATES: Location must use valid [longitude, latitude] coordinates');
    }
    const source = normalizeLocationSource(locationInput.source, locationInput.poiId ? 'poi' : 'map_pin');
    const gps = source === 'device_gps' ? normalizeGpsMetadata(locationInput) : undefined;
    
    return {
      name: locationInput.name || 'Campus Location',
      poiId: locationInput.poiId || null,
      coordinates: { type: 'Point', coordinates: [longitude, latitude] },
      source,
      ...(gps ? { gps } : {})
    };
  }

  // String lookup in canonical POI database
  const queryStr = String(locationInput).trim();
  const matchedPOI = await CampusPOI.findOne({
    isActive: true,
    $or: [
      { name: new RegExp(`^${queryStr}$`, 'i') },
      { aliases: new RegExp(`^${queryStr}$`, 'i') },
      { name: new RegExp(queryStr, 'i') }
    ]
  });

  if (matchedPOI) {
    return {
      name: matchedPOI.name,
      poiId: matchedPOI._id,
      coordinates: matchedPOI.coordinates,
      source: 'poi'
    };
  }

  throw new Error(`UNRESOLVED_LOCATION: Select a search result or map pin for "${queryStr}"`);
};
