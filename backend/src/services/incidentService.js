import IncidentReport from '../models/IncidentReport.js';
import RideBooking from '../models/RideBooking.js';
import User from '../models/User.js';

export const VALID_INCIDENT_CATEGORIES = [
  'dangerous_driving',
  'harassment',
  'physical_threat',
  'vehicle_condition',
  'inappropriate_behavior',
  'overcharging',
  'other'
];

/**
 * Generates human-readable unique reference: REP-YYYYMMDD-XXXX
 */
const generateReportReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `REP-${dateStr}-${randStr}`;
};

/**
 * Create a structured incident report
 */
export const createIncidentReport = async (passengerId, { bookingId, category, description, severity = 'medium' }) => {
  if (!passengerId) throw new Error('MISSING_PASSENGER_ID');

  if (!category || !VALID_INCIDENT_CATEGORIES.includes(category)) {
    throw new Error(`INVALID_CATEGORY: Incident category must be one of [${VALID_INCIDENT_CATEGORIES.join(', ')}]`);
  }

  if (!description || description.trim().length < 10) {
    throw new Error('INVALID_DESCRIPTION: Description must be at least 10 characters');
  }

  let derivedDriverId = null;
  let derivedTripId = null;

  if (bookingId) {
    const booking = await RideBooking.findById(bookingId).select('passengerId driverId driverTripId');
    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND: Associated ride booking does not exist');
    }
    // Prevent cross-user booking reporting
    if (booking.passengerId.toString() !== passengerId.toString()) {
      throw new Error('UNAUTHORIZED_BOOKING: You can only report incidents on your own bookings');
    }
    derivedDriverId = booking.driverId;
    derivedTripId = booking.driverTripId;
  }

  const validSeverities = ['low', 'medium', 'high', 'critical'];
  const sanitizedSeverity = validSeverities.includes(severity) ? severity : 'medium';

  let reportReference = generateReportReference();
  let attempts = 0;
  while (await IncidentReport.exists({ reportReference }) && attempts < 5) {
    reportReference = generateReportReference();
    attempts++;
  }

  const report = await IncidentReport.create({
    passengerId,
    bookingId: bookingId || null,
    tripId: derivedTripId || null,
    driverId: derivedDriverId || null,
    reportReference,
    category,
    description: description.trim(),
    severity: sanitizedSeverity,
    status: 'submitted'
  });

  return report;
};

/**
 * Get all incident reports filed by a passenger
 */
export const getPassengerIncidents = async (passengerId) => {
  if (!passengerId) throw new Error('MISSING_PASSENGER_ID');

  const reports = await IncidentReport.find({ passengerId })
    .populate('driverId', 'fullName vehicleModel vehicleLicensePlate')
    .populate('bookingId', 'pickup dropoff status')
    .sort({ createdAt: -1 });

  return reports;
};

/**
 * Get a single incident report by ID
 */
export const getIncidentById = async (passengerId, incidentId, userRole = 'passenger') => {
  const report = await IncidentReport.findById(incidentId)
    .populate('passengerId', 'fullName phoneNumber email')
    .populate('driverId', 'fullName vehicleModel vehicleLicensePlate')
    .populate('bookingId', 'pickup dropoff status');

  if (!report) {
    throw new Error('REPORT_NOT_FOUND');
  }

  if (userRole !== 'admin' && report.passengerId._id.toString() !== passengerId.toString()) {
    throw new Error('UNAUTHORIZED_ACCESS: You do not have access to this incident report');
  }

  return report;
};

/**
 * Admin: Get incident queue
 */
export const adminGetIncidents = async ({ status = null, category = null, page = 1, limit = 20 }) => {
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;

  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    IncidentReport.find(query)
      .populate('passengerId', 'fullName phoneNumber email')
      .populate('driverId', 'fullName vehicleModel vehicleLicensePlate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    IncidentReport.countDocuments(query)
  ]);

  return {
    reports,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

export default {
  VALID_INCIDENT_CATEGORIES,
  createIncidentReport,
  getPassengerIncidents,
  getIncidentById,
  adminGetIncidents
};
