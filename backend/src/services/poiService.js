import CampusPOI from '../models/CampusPOI.js';

// Canonical University of Ghana (Legon) Campus POI Seed Dataset
// NOTE: Coordinates below are development landmark approximations within UG campus bounds.
// They are explicitly marked with provenance: 'development_estimate' and are subject to future official GIS survey calibration.
export const CANONICAL_CAMPUS_POIS = [
  {
    name: 'Balme Library',
    aliases: ['Balme', 'Library', 'Main Library', 'Balme Library Complex'],
    category: 'library',
    coordinates: { type: 'Point', coordinates: [-0.1870, 5.6508] },
    campusZone: 'Central',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: true
  },
  {
    name: 'Pentagon Hostel',
    aliases: ['Pent', 'Pentagon', 'Block A', 'Block B', 'Block C', 'Pentagon Hall'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.1865, 5.6631] },
    campusZone: 'Diaspora',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: true
  },
  {
    name: 'Evandy Hostel',
    aliases: ['Evandy', 'Evandy Gate', 'Evandy Hostel Gate'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.1882, 5.6610] },
    campusZone: 'Diaspora',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: true
  },
  {
    name: 'Bani Hostel',
    aliases: ['Bani', 'Bani Hall', 'Bani Hostel Gate'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.1895, 5.6625] },
    campusZone: 'Diaspora',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: true
  },
  {
    name: 'TF Hostel',
    aliases: ['TF', 'James Topp', 'Nelson Yankah', 'TF Hostel Gate'],
    category: 'hostel',
    coordinates: { type: 'Point', coordinates: [-0.1834, 5.6645] },
    campusZone: 'Diaspora',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: true
  },
  {
    name: 'Legon Night Market',
    aliases: ['Night Market', 'NM', 'Market', 'Night Market Taxi Rank'],
    category: 'market',
    coordinates: { type: 'Point', coordinates: [-0.1848, 5.6560] },
    campusZone: 'Central',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
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
    isActive: true
  },
  {
    name: 'UGBS Graduate Building',
    aliases: ['Business School', 'UGBS', 'UGBS Grad', 'Graduate School'],
    category: 'faculty',
    coordinates: { type: 'Point', coordinates: [-0.1868, 5.6480] },
    campusZone: 'Central',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: true
  },
  {
    name: 'Great Hall',
    aliases: ['Great Hall', 'Tower', 'UG Great Hall'],
    category: 'administration',
    coordinates: { type: 'Point', coordinates: [-0.1892, 5.6558] },
    campusZone: 'North',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: true
  },
  {
    name: 'Volta Hall',
    aliases: ['Volta', 'Volta Hall'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.1855, 5.6535] },
    campusZone: 'Central',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: true
  },
  {
    name: 'Commonwealth Hall',
    aliases: ['Vandal City', 'Commonwealth', 'Vandals'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.1905, 5.6550] },
    campusZone: 'North',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: true
  },
  {
    name: 'Akuafo Hall',
    aliases: ['Akuafo', 'Akuafo Roundabout', 'Akuafo Hall'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.1880, 5.6515] },
    campusZone: 'Central',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: true
  },
  {
    name: 'Legon Hall',
    aliases: ['Legon', 'Legon Hall'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.1860, 5.6520] },
    campusZone: 'Central',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
    isActive: true
  },
  {
    name: 'Mensah Sarbah Hall',
    aliases: ['Sarbah', 'Okpo', 'Sarbah Hall', 'Mensah Sarbah'],
    category: 'hall',
    coordinates: { type: 'Point', coordinates: [-0.1890, 5.6500] },
    campusZone: 'South',
    coordinateProvenance: {
      type: 'development_estimate',
      source: 'University of Ghana Legon campus landmark development approximation'
    },
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
    const result = await CampusPOI.findOneAndUpdate(
      { name: poi.name },
      { $set: poi },
      { upsert: true, returnDocument: 'after', rawResult: true }
    );
    if (result.lastErrorObject?.updatedExisting) {
      updatedCount++;
    } else {
      createdCount++;
    }
  }

  return { total: CANONICAL_CAMPUS_POIS.length, createdCount, updatedCount };
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
    const cleanQuery = query.trim();
    const regex = new RegExp(cleanQuery, 'i');
    filter.$or = [
      { name: regex },
      { aliases: regex }
    ];
  }

  return await CampusPOI.find(filter).limit(limit).sort({ name: 1 });
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

/**
 * Resolves a human-entered landmark or location name into a structured RideLocation object
 */
export const resolveLocation = async (locationInput, fallbackCoords = [-0.1870, 5.6508]) => {
  if (!locationInput) {
    return {
      name: 'Campus Central Location',
      poiId: null,
      coordinates: { type: 'Point', coordinates: fallbackCoords },
      source: 'gps_pin'
    };
  }

  // If locationInput is already a structured object with coordinates
  if (typeof locationInput === 'object' && locationInput.coordinates) {
    const coords = Array.isArray(locationInput.coordinates) 
      ? locationInput.coordinates 
      : locationInput.coordinates.coordinates || fallbackCoords;
    
    return {
      name: locationInput.name || 'Campus Location',
      poiId: locationInput.poiId || null,
      coordinates: { type: 'Point', coordinates: coords },
      source: locationInput.source || 'gps_pin'
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

  // Fallback if no named landmark matched
  return {
    name: queryStr,
    poiId: null,
    coordinates: { type: 'Point', coordinates: fallbackCoords },
    source: 'reverse_geocoded'
  };
};
