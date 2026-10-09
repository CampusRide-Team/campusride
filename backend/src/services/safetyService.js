import mongoose from 'mongoose';
import SafetyEvent from '../models/SafetyEvent.js';
import TrustedContact from '../models/TrustedContact.js';
import RideBooking from '../models/RideBooking.js';
import User from '../models/User.js';
import { dispatchEmergencyToContacts } from './notificationDeliveryService.js';

/**
 * Sanitizes SafetyEvent payload for Passenger consumption.
 * Enforces: Shared-ride privacy (never leaks co-passenger or raw internal credentials).
 */
export const sanitizeSafetyEventForPassenger = (event) => {
  if (!event) return null;
  const doc = event.toObject ? event.toObject() : event;

  return {
    _id: doc._id,
    id: doc._id,
    status: doc.status,
    category: doc.category,
    source: doc.source,
    location: doc.location,
    acknowledgement: doc.acknowledgement?.acknowledgedAt ? {
      acknowledgedAt: doc.acknowledgement.acknowledgedAt,
      operatorName: doc.acknowledgement.operatorName || 'CampusRide Operator'
    } : null,
    escalation: doc.escalation?.isRecorded ? {
      isRecorded: true,
      escalatedTo: doc.escalation.escalatedTo,
      escalatedAt: doc.escalation.escalatedAt
    } : null,
    resolution: doc.resolution,
    passengerResolutionIntent: doc.passengerResolutionIntent || null,
    trustedContactsSnapshot: (doc.trustedContactsSnapshot || []).map(c => ({
      contactId: c.contactId,
      name: c.name,
      phoneNumber: c.phoneNumber,
      relationship: c.relationship,
      deliveryStatus: c.deliveryStatus,
      notifiedAt: c.notifiedAt
    })),
    timeline: (doc.timeline || []).map(t => ({
      type: t.type,
      message: t.message,
      actorRole: t.actorRole,
      timestamp: t.timestamp
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

/**
 * Sanitizes SafetyEvent payload for Admin / Operator consumption.
 */
export const sanitizeSafetyEventForAdmin = (event) => {
  if (!event) return null;
  return event.toObject ? event.toObject() : event;
};

/**
 * 1. Create Safety Emergency Event (SOS)
 */
export const createSafetyEvent = async ({
  passengerId,
  bookingId = null,
  tripId = null,
  location = null,
  category = null,
  source = 'passenger_sos',
  idempotencyKey = null,
  io = null
}) => {
  if (!passengerId) {
    throw new Error('MISSING_PASSENGER_ID: Passenger ID is required');
  }

  // Enforce Passenger existence
  const passenger = await User.findById(passengerId).select('fullName phoneNumber role isSuspended isBlocked');
  if (!passenger) {
    throw new Error('USER_NOT_FOUND: Passenger account does not exist');
  }
  if (passenger.isSuspended || passenger.isBlocked) {
    throw new Error('ACCOUNT_SUSPENDED: Suspended accounts cannot perform this action');
  }

  // Enforce Idempotency: return existing event if idempotency key matches for this passenger
  if (idempotencyKey) {
    const existingByIdempotency = await SafetyEvent.findOne({
      passengerId,
      idempotencyKey
    });
    if (existingByIdempotency) {
      return {
        event: existingByIdempotency,
        isExisting: true
      };
    }
  }

  // Active Emergency Check: if passenger already has an active or acknowledged emergency, return it
  const existingActive = await SafetyEvent.findOne({
    passengerId,
    status: { $in: ['active', 'acknowledged', 'responding'] }
  });
  if (existingActive) {
    // If location update is provided, update existing active event's location
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      existingActive.location = {
        isAvailable: true,
        coordinates: location.coordinates,
        accuracy: location.accuracy || null,
        capturedAt: new Date()
      };
      existingActive.timeline.push({
        type: 'location_updated',
        actor: passengerId,
        actorRole: 'passenger',
        message: 'Updated emergency location recorded',
        timestamp: new Date()
      });
      await existingActive.save();
    }
    return {
      event: existingActive,
      isExisting: true
    };
  }

  // Context validation: Associated Booking
  let derivedDriverId = null;
  let derivedTripId = tripId;

  if (bookingId) {
    const booking = await RideBooking.findById(bookingId).select('passengerId driverId driverTripId status');
    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND: Associated booking does not exist');
    }
    // Prevent cross-user booking injection
    if (booking.passengerId.toString() !== passengerId.toString()) {
      throw new Error('UNAUTHORIZED_BOOKING: Booking does not belong to this passenger');
    }
    derivedDriverId = booking.driverId;
    if (!derivedTripId && booking.driverTripId) {
      derivedTripId = booking.driverTripId;
    }
  }

  // Format Location Boundary (Location is optional and never blocks SOS creation)
  let formattedLocation = {
    isAvailable: false,
    coordinates: null,
    accuracy: null,
    capturedAt: null
  };

  if (
    location &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2 &&
    !isNaN(location.coordinates[0]) &&
    !isNaN(location.coordinates[1])
  ) {
    const [lng, lat] = location.coordinates;
    if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
      formattedLocation = {
        isAvailable: true,
        coordinates: [lng, lat],
        accuracy: location.accuracy || null,
        capturedAt: new Date()
      };
    }
  }

  // Validate category if provided
  const validCategories = ['medical', 'accident_vehicle', 'personal_safety_threat', 'other'];
  const sanitizedCategory = category && validCategories.includes(category) ? category : null;

  // Retrieve Passenger's Verified Trusted Contacts for notification snapshot
  const contacts = await TrustedContact.find({
    passengerId,
    verificationStatus: 'verified'
  });

  // Attempt notification delivery to contacts (asynchronous and non-blocking)
  let contactSnapshots = [];
  try {
    contactSnapshots = await dispatchEmergencyToContacts(contacts, {
      passengerName: passenger.fullName,
      summary: sanitizedCategory ? `Category: ${sanitizedCategory}` : 'SOS Activated'
    });
  } catch (err) {
    // Safe fallback: contact notification failure must never crash SOS creation
    contactSnapshots = contacts.map(c => ({
      contactId: c._id,
      name: c.name,
      phoneNumber: c.phoneNumber,
      relationship: c.relationship,
      deliveryStatus: 'failed',
      deliveryError: err.message,
      notifiedAt: new Date()
    }));
  }

  // Construct initial timeline
  const initialTimeline = [
    {
      type: 'event_created',
      actor: passengerId,
      actorRole: 'passenger',
      message: 'Emergency SOS activated by passenger',
      details: { category: sanitizedCategory, source, locationAvailable: formattedLocation.isAvailable },
      timestamp: new Date()
    }
  ];

  if (contactSnapshots.length > 0) {
    initialTimeline.push({
      type: 'contact_notification_attempted',
      actor: null,
      actorRole: 'system',
      message: `Emergency notification attempted for ${contactSnapshots.length} trusted contact(s)`,
      details: { count: contactSnapshots.length },
      timestamp: new Date()
    });
  }

  const safetyEvent = await SafetyEvent.create({
    passengerId,
    bookingId: bookingId || null,
    tripId: derivedTripId || null,
    driverId: derivedDriverId || null,
    status: 'active',
    category: sanitizedCategory,
    source,
    location: formattedLocation,
    trustedContactsSnapshot: contactSnapshots,
    timeline: initialTimeline,
    idempotencyKey: idempotencyKey || null
  });

  // Realtime Broadcasts
  if (io) {
    // 1. Alert Admin Safety Room
    io.to('admin:safety').emit('safety:new_emergency', {
      event: sanitizeSafetyEventForAdmin(safetyEvent),
      passenger: {
        id: passenger._id,
        fullName: passenger.fullName,
        phoneNumber: passenger.phoneNumber
      }
    });

    // 2. Alert Passenger Room with authoritative acknowledgment
    io.to(`user:${passengerId}`).emit('safety:emergency_update', {
      event: sanitizeSafetyEventForPassenger(safetyEvent)
    });
  }

  return {
    event: safetyEvent,
    isExisting: false
  };
};

/**
 * 2. Get Active Emergency for Passenger
 */
export const getPassengerActiveEmergency = async (passengerId) => {
  if (!passengerId) throw new Error('MISSING_PASSENGER_ID');

  const event = await SafetyEvent.findOne({
    passengerId,
    status: { $in: ['active', 'acknowledged', 'responding'] }
  })
    .populate('passengerId', 'fullName phoneNumber')
    .populate('driverId', 'fullName phoneNumber vehicleModel vehicleLicensePlate')
    .sort({ createdAt: -1 });

  return event;
};

/**
 * 3. Get Safety Event by ID (with authorization check)
 */
export const getSafetyEventById = async (eventId, user) => {
  if (!eventId) throw new Error('MISSING_EVENT_ID');

  const event = await SafetyEvent.findById(eventId)
    .populate('passengerId', 'fullName phoneNumber')
    .populate('driverId', 'fullName phoneNumber vehicleModel vehicleLicensePlate')
    .populate('bookingId', 'pickup dropoff rideMode status');

  if (!event) {
    throw new Error('EVENT_NOT_FOUND: Safety event does not exist');
  }

  const userId = user._id ? user._id.toString() : user.id?.toString();
  const isOwner = event.passengerId?._id?.toString() === userId || event.passengerId?.toString() === userId;
  const isDriver = event.source !== 'passenger_sos' && (event.driverId?._id?.toString() === userId || event.driverId?.toString() === userId);
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isDriver && !isAdmin) {
    throw new Error('UNAUTHORIZED_ACCESS: You do not have access to this safety event');
  }

  return event;
};

/**
 * 4. Update Emergency Category (Passenger Refinement)
 */
export const updateEmergencyCategory = async ({ eventId, passengerId, category, io }) => {
  const validCategories = ['medical', 'accident_vehicle', 'personal_safety_threat', 'other'];
  if (!category || !validCategories.includes(category)) {
    throw new Error(`INVALID_CATEGORY: Category must be one of [${validCategories.join(', ')}]`);
  }

  const event = await SafetyEvent.findById(eventId);
  if (!event) {
    throw new Error('EVENT_NOT_FOUND');
  }

  if (event.passengerId.toString() !== passengerId.toString()) {
    throw new Error('UNAUTHORIZED_ACCESS: You do not own this emergency event');
  }

  if (event.status === 'resolved') {
    throw new Error('EVENT_ALREADY_RESOLVED: Cannot update category on resolved event');
  }

  event.category = category;
  event.timeline.push({
    type: 'category_updated',
    actor: passengerId,
    actorRole: 'passenger',
    message: `Emergency category refined to: ${category}`,
    details: { category },
    timestamp: new Date()
  });

  await event.save();

  if (io) {
    io.to('admin:safety').emit('safety:emergency_update', {
      event: sanitizeSafetyEventForAdmin(event)
    });
    io.to(`user:${passengerId}`).emit('safety:emergency_update', {
      event: sanitizeSafetyEventForPassenger(event)
    });
  }

  return event;
};

/**
 * 5. Report Passenger Safe / False Alarm
 * Note: Operator retains authoritative resolution authority.
 * This records passenger resolution intent and appends to the timeline.
 */
export const reportPassengerSafe = async ({ eventId, passengerId, reason = 'user_reported_safe', notes = '', io }) => {
  const validReasons = ['user_reported_safe', 'false_alarm'];
  if (!validReasons.includes(reason)) {
    throw new Error(`INVALID_RESOLUTION_REASON: Reason must be one of [${validReasons.join(', ')}]`);
  }

  const event = await SafetyEvent.findById(eventId);
  if (!event) {
    throw new Error('EVENT_NOT_FOUND');
  }

  if (event.passengerId.toString() !== passengerId.toString()) {
    throw new Error('UNAUTHORIZED_ACCESS: You do not own this emergency event');
  }

  const mappedIntent = reason === 'false_alarm' ? 'false_alarm' : 'safe';
  event.passengerResolutionIntent = {
    intent: mappedIntent,
    notes: notes || null,
    reportedAt: new Date()
  };

  event.timeline.push({
    type: reason === 'false_alarm' ? 'false_alarm_reported' : 'passenger_reported_safe',
    actor: passengerId,
    actorRole: 'passenger',
    message: reason === 'false_alarm' ? 'Passenger indicated false alarm' : 'Passenger indicated they are safe',
    details: { notes, intent: mappedIntent },
    timestamp: new Date()
  });

  await event.save();

  if (io) {
    io.to('admin:safety').emit('safety:emergency_update', {
      event: sanitizeSafetyEventForAdmin(event)
    });
    io.to(`user:${passengerId}`).emit('safety:emergency_update', {
      event: sanitizeSafetyEventForPassenger(event)
    });
  }

  return event;
};

/**
 * 6. Admin Acknowledge Emergency
 */
export const adminAcknowledgeEmergency = async ({ eventId, adminUser, io }) => {
  if (!adminUser || adminUser.role !== 'admin') {
    throw new Error('UNAUTHORIZED_ADMIN: Admin privilege required');
  }

  const event = await SafetyEvent.findById(eventId);
  if (!event) {
    throw new Error('EVENT_NOT_FOUND');
  }

  // Idempotent check
  if (event.acknowledgement?.acknowledgedAt) {
    return event;
  }

  event.status = event.status === 'active' ? 'acknowledged' : event.status;
  event.acknowledgement = {
    acknowledgedBy: adminUser._id,
    operatorName: adminUser.fullName || 'CampusRide Operator',
    acknowledgedAt: new Date()
  };

  event.timeline.push({
    type: 'operator_acknowledged',
    actor: adminUser._id,
    actorRole: 'admin',
    message: `Emergency acknowledged by operator ${adminUser.fullName || 'CampusRide Operator'}`,
    timestamp: new Date()
  });

  await event.save();

  if (io) {
    io.to('admin:safety').emit('safety:emergency_update', {
      event: sanitizeSafetyEventForAdmin(event)
    });
    io.to(`user:${event.passengerId}`).emit('safety:operator_ack', {
      eventId: event._id,
      event: sanitizeSafetyEventForPassenger(event)
    });
    io.to(`user:${event.passengerId}`).emit('safety:emergency_update', {
      event: sanitizeSafetyEventForPassenger(event)
    });
  }

  return event;
};

/**
 * 7. Admin Update Emergency Status / Resolution
 */
export const adminUpdateEmergencyStatus = async ({ eventId, adminUser, status, notes, outcome, io }) => {
  if (!adminUser || adminUser.role !== 'admin') {
    throw new Error('UNAUTHORIZED_ADMIN: Admin privilege required');
  }

  const validStatuses = ['acknowledged', 'responding', 'resolved'];
  if (!validStatuses.includes(status)) {
    throw new Error(`INVALID_STATUS: Status must be one of [${validStatuses.join(', ')}]`);
  }

  const event = await SafetyEvent.findById(eventId);
  if (!event) {
    throw new Error('EVENT_NOT_FOUND');
  }

  const oldStatus = event.status;
  event.status = status;

  if (status === 'resolved') {
    event.resolution = {
      reason: outcome || 'resolved_by_operator',
      notes: notes || null,
      resolvedBy: adminUser._id,
      resolvedByRole: 'admin',
      resolvedAt: new Date()
    };
  }

  event.timeline.push({
    type: status === 'resolved' ? 'resolved' : 'status_changed',
    actor: adminUser._id,
    actorRole: 'admin',
    message: `Status updated from ${oldStatus} to ${status} by operator ${adminUser.fullName || 'Admin'}`,
    details: { notes, outcome },
    timestamp: new Date()
  });

  await event.save();

  if (io) {
    io.to('admin:safety').emit('safety:emergency_update', {
      event: sanitizeSafetyEventForAdmin(event)
    });
    io.to(`user:${event.passengerId}`).emit('safety:emergency_update', {
      event: sanitizeSafetyEventForPassenger(event)
    });
  }

  return event;
};

/**
 * 8. Admin Record Escalation
 */
export const adminRecordEscalation = async ({ eventId, adminUser, escalatedTo = 'campus_security', notes = '', io }) => {
  if (!adminUser || adminUser.role !== 'admin') {
    throw new Error('UNAUTHORIZED_ADMIN: Admin privilege required');
  }

  const event = await SafetyEvent.findById(eventId);
  if (!event) {
    throw new Error('EVENT_NOT_FOUND');
  }

  event.escalation = {
    isRecorded: true,
    escalatedTo,
    escalatedBy: adminUser._id,
    escalatedAt: new Date(),
    notes: notes || null
  };

  event.timeline.push({
    type: 'escalation_recorded',
    actor: adminUser._id,
    actorRole: 'admin',
    message: `Escalation recorded to ${escalatedTo} by operator ${adminUser.fullName || 'Admin'}`,
    details: { escalatedTo, notes },
    timestamp: new Date()
  });

  await event.save();

  if (io) {
    io.to('admin:safety').emit('safety:emergency_update', {
      event: sanitizeSafetyEventForAdmin(event)
    });
    io.to(`user:${event.passengerId}`).emit('safety:emergency_update', {
      event: sanitizeSafetyEventForPassenger(event)
    });
  }

  return event;
};

/**
 * 9. Admin Get Emergency Queue
 */
export const adminGetEmergencyQueue = async ({ status = null, page = 1, limit = 20 }) => {
  const query = {};
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    SafetyEvent.find(query)
      .populate('passengerId', 'fullName phoneNumber email')
      .populate('driverId', 'fullName phoneNumber driverProfile')
      .populate('bookingId', 'pickup dropoff status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SafetyEvent.countDocuments(query)
  ]);

  return {
    events: events.map(sanitizeSafetyEventForAdmin),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

export default {
  createSafetyEvent,
  getPassengerActiveEmergency,
  getSafetyEventById,
  updateEmergencyCategory,
  reportPassengerSafe,
  adminAcknowledgeEmergency,
  adminUpdateEmergencyStatus,
  adminRecordEscalation,
  adminGetEmergencyQueue,
  sanitizeSafetyEventForPassenger,
  sanitizeSafetyEventForAdmin
};
