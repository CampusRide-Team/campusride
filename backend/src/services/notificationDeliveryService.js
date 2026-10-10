import { sendPushNotification } from './notificationService.js';
import TrustedContact from '../models/TrustedContact.js';
import User from '../models/User.js';

/**
 * Multi-channel Notification Delivery Service
 * Truthfully orchestrates Push and SMS channels without faking delivery.
 */

export const sendSms = async (phoneNumber, message) => {
  // Check if live SMS provider is configured (e.g. Hubtel, Twilio, Arkesel)
  const isSmsConfigured = Boolean(
    (process.env.HUBTEL_CLIENT_ID && process.env.HUBTEL_CLIENT_SECRET) ||
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  );

  if (!isSmsConfigured) {
    return {
      success: false,
      status: 'unavailable',
      error: 'SMS_PROVIDER_NOT_CONFIGURED',
      timestamp: new Date()
    };
  }

  // When a production SMS provider is provisioned, actual HTTP dispatch occurs here.
  // Currently, we return unconfigured state without faking success.
  return {
    success: false,
    status: 'unavailable',
    error: 'SMS_PROVIDER_NOT_CONFIGURED',
    timestamp: new Date()
  };
};

/**
 * Dispatches emergency SMS to verified trusted contacts
 * Enforces: SOS event creation NEVER fails due to SMS unavailability.
 */
export const dispatchEmergencyToContacts = async (contacts, emergencyContext) => {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return [];
  }

  const results = [];

  for (const contact of contacts) {
    // Only dispatch to contacts who have verified status and have emergencySms enabled
    if (contact.verificationStatus !== 'verified' || contact.notificationPreferences?.emergencySms === false) {
      continue;
    }

    const message = `CampusRide Emergency Alert: ${emergencyContext.passengerName || 'A passenger'} has activated SOS. Context: ${emergencyContext.summary || 'Emergency in progress'}.`;
    
    const deliveryResult = await sendSms(contact.phoneNumber, message);

    results.push({
      contactId: contact._id,
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      relationship: contact.relationship,
      deliveryStatus: deliveryResult.status || 'unavailable',
      deliveryError: deliveryResult.error || null,
      notifiedAt: new Date()
    });
  }

  return results;
};

export const shouldShareRideAt = (mode, at = new Date()) => {
  if (mode === 'every_ride') return true;
  if (mode !== 'night_only') return false;
  const hour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra',
    hour: '2-digit',
    hourCycle: 'h23'
  }).format(at));
  return hour >= 21 || hour < 6;
};

/**
 * Attempts ride-assignment sharing only for verified contacts who opted in.
 * Delivery results remain truthful when an SMS provider is not configured.
 */
export const dispatchRideStartToContacts = async (booking) => {
  const passenger = await User.findById(booking.passengerId).select('fullName');
  const contacts = await TrustedContact.find({
    passengerId: booking.passengerId,
    verificationStatus: 'verified'
  });
  const now = new Date();
  const eligible = contacts.filter((contact) => shouldShareRideAt(
    contact.notificationPreferences?.rideShareMode
      || (contact.notificationPreferences?.rideStartShare ? 'every_ride' : 'never'),
    now
  ));

  const results = [];
  for (const contact of eligible) {
    const message = `CampusRide ride update: ${passenger?.fullName || 'Your trusted passenger'} is starting a ride from ${booking.pickup?.name || 'their pickup'} to ${booking.dropoff?.name || 'their destination'}.`;
    const delivery = await sendSms(contact.phoneNumber, message);
    results.push({ contactId: contact._id, status: delivery.status, error: delivery.error || null });
  }
  return results;
};

export default {
  sendPushNotification,
  sendSms,
  dispatchEmergencyToContacts,
  dispatchRideStartToContacts
};
