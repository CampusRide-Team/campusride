import CampusPOI from '../models/CampusPOI.js';
import { CAMPUS_BOUNDS } from '../services/geocodingService.js';

const ALLOWED_CATEGORIES = new Set([
  'hall', 'hostel', 'library', 'faculty', 'gate', 'market', 'administration', 'sports', 'other'
]);

const normalizeName = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const insideCampus = (lng, lat) => (
  Number.isFinite(lng) && Number.isFinite(lat)
  && lng >= CAMPUS_BOUNDS.west && lng <= CAMPUS_BOUNDS.east
  && lat >= CAMPUS_BOUNDS.south && lat <= CAMPUS_BOUNDS.north
);

export const submitCampusPOI = async (req, res, next) => {
  try {
    const name = normalizeName(req.body?.name);
    const category = ALLOWED_CATEGORIES.has(req.body?.category) ? req.body.category : 'other';
    const coordinates = req.body?.coordinates;
    const lng = Number(coordinates?.[0]);
    const lat = Number(coordinates?.[1]);

    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PLACE_NAME', message: 'Place name must be between 3 and 100 characters' } });
    }
    if (!insideCampus(lng, lat)) {
      return res.status(400).json({ success: false, error: { code: 'LOCATION_OUTSIDE_CAMPUS', message: 'Added places must be within the University of Ghana campus area' } });
    }

    const duplicate = await CampusPOI.findOne({ name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
    if (duplicate) {
      return res.status(409).json({ success: false, error: { code: 'PLACE_ALREADY_EXISTS', message: 'A place with this name already exists or is awaiting review' } });
    }

    const poi = await CampusPOI.create({
      name,
      aliases: [],
      category,
      coordinates: { type: 'Point', coordinates: [lng, lat] },
      campusZone: normalizeName(req.body?.campusZone) || 'University of Ghana',
      coordinateProvenance: { type: 'user_submitted', source: 'CampusRide passenger map submission' },
      submittedBy: req.user._id,
      moderationStatus: 'pending',
      isActive: false
    });

    return res.status(201).json({
      success: true,
      data: poi,
      message: 'Place saved for this ride and submitted for campus review'
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, error: { code: 'PLACE_ALREADY_EXISTS', message: 'This place has already been submitted' } });
    }
    return next(error);
  }
};

export const getMyCampusPOISubmissions = async (req, res, next) => {
  try {
    const pois = await CampusPOI.find({ submittedBy: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, data: pois });
  } catch (error) { return next(error); }
};

export const moderateCampusPOI = async (req, res, next) => {
  try {
    const decision = req.body?.decision;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DECISION', message: 'Decision must be approved or rejected' } });
    }
    const poi = await CampusPOI.findOneAndUpdate(
      { _id: req.params.id, moderationStatus: 'pending' },
      { $set: { moderationStatus: decision, isActive: decision === 'approved', moderationNote: normalizeName(req.body?.note) } },
      { returnDocument: 'after' }
    );
    if (!poi) return res.status(404).json({ success: false, error: { code: 'SUBMISSION_NOT_FOUND', message: 'Pending place submission not found' } });
    return res.json({ success: true, data: poi });
  } catch (error) { return next(error); }
};
