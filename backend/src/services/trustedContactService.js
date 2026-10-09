import TrustedContact from '../models/TrustedContact.js';
import User from '../models/User.js';
import { normalizePhoneNumber } from '../utils/phoneNormalizer.js';
import { sendSms } from './notificationDeliveryService.js';

export const MAX_TRUSTED_CONTACTS = 5;

/**
 * Get all trusted contacts for a passenger
 */
export const getContacts = async (passengerId) => {
  if (!passengerId) throw new Error('MISSING_PASSENGER_ID');

  const contacts = await TrustedContact.find({ passengerId }).sort({ createdAt: 1 });
  return contacts;
};

/**
 * Add a new trusted contact
 * Enforces: Maximum 5 contacts per passenger, Phone normalization, Duplicate prevention
 */
export const addContact = async (passengerId, { name, phoneNumber, relationship = 'friend' }) => {
  if (!passengerId) throw new Error('MISSING_PASSENGER_ID');
  if (!name || name.trim().length < 2) {
    throw new Error('INVALID_NAME: Contact name must be at least 2 characters');
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // Check self-number
  const passenger = await User.findById(passengerId).select('phoneNumber');
  if (passenger && passenger.phoneNumber) {
    let passengerNormalized = null;
    try {
      passengerNormalized = normalizePhoneNumber(passenger.phoneNumber);
    } catch {
      passengerNormalized = passenger.phoneNumber;
    }
    if (passengerNormalized === normalizedPhone) {
      throw new Error('SELF_CONTACT_NOT_ALLOWED: You cannot add your own phone number as a trusted contact');
    }
  }

  // Enforce Max Limit: 5 contacts
  const currentCount = await TrustedContact.countDocuments({ passengerId });
  if (currentCount >= MAX_TRUSTED_CONTACTS) {
    throw new Error(`MAX_CONTACTS_REACHED: Maximum of ${MAX_TRUSTED_CONTACTS} trusted contacts allowed`);
  }

  // Enforce Unique per Passenger
  const duplicate = await TrustedContact.findOne({ passengerId, phoneNumber: normalizedPhone });
  if (duplicate) {
    throw new Error('DUPLICATE_CONTACT: This phone number is already registered in your trusted contacts');
  }

  const validRelationships = ['parent', 'sibling', 'friend', 'partner', 'guardian', 'other'];
  const sanitizedRel = validRelationships.includes(relationship) ? relationship : 'friend';

  const contact = await TrustedContact.create({
    passengerId,
    name: name.trim(),
    phoneNumber: normalizedPhone,
    relationship: sanitizedRel,
    verificationStatus: 'pending'
  });

  return contact;
};

/**
 * Update an existing trusted contact
 */
export const updateContact = async (passengerId, contactId, { name, phoneNumber, relationship, notificationPreferences }) => {
  const contact = await TrustedContact.findById(contactId);
  if (!contact) {
    throw new Error('CONTACT_NOT_FOUND: Trusted contact does not exist');
  }

  if (contact.passengerId.toString() !== passengerId.toString()) {
    throw new Error('UNAUTHORIZED_ACCESS: You do not own this trusted contact');
  }

  if (name && name.trim().length >= 2) {
    contact.name = name.trim();
  }

  if (phoneNumber) {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (normalizedPhone !== contact.phoneNumber) {
      // Check duplicate
      const duplicate = await TrustedContact.findOne({
        passengerId,
        phoneNumber: normalizedPhone,
        _id: { $ne: contactId }
      });
      if (duplicate) {
        throw new Error('DUPLICATE_CONTACT: This phone number is already registered in another contact');
      }
      contact.phoneNumber = normalizedPhone;
      contact.verificationStatus = 'pending'; // Reset verification on phone change
    }
  }

  const validRelationships = ['parent', 'sibling', 'friend', 'partner', 'guardian', 'other'];
  if (relationship && validRelationships.includes(relationship)) {
    contact.relationship = relationship;
  }

  if (notificationPreferences && typeof notificationPreferences === 'object') {
    if (typeof notificationPreferences.emergencySms === 'boolean') {
      contact.notificationPreferences.emergencySms = notificationPreferences.emergencySms;
    }
    if (typeof notificationPreferences.rideStartShare === 'boolean') {
      contact.notificationPreferences.rideStartShare = notificationPreferences.rideStartShare;
    }
    if (['every_ride', 'night_only', 'never'].includes(notificationPreferences.rideShareMode)) {
      contact.notificationPreferences.rideShareMode = notificationPreferences.rideShareMode;
      contact.notificationPreferences.rideStartShare = notificationPreferences.rideShareMode !== 'never';
    }
  }

  await contact.save();
  return contact;
};

/**
 * Delete a trusted contact
 */
export const deleteContact = async (passengerId, contactId) => {
  const contact = await TrustedContact.findById(contactId);
  if (!contact) {
    throw new Error('CONTACT_NOT_FOUND: Trusted contact does not exist');
  }

  if (contact.passengerId.toString() !== passengerId.toString()) {
    throw new Error('UNAUTHORIZED_ACCESS: You do not own this trusted contact');
  }

  await TrustedContact.findByIdAndDelete(contactId);

  // Clean from user safety preferences
  await User.findByIdAndUpdate(passengerId, {
    $pull: { 'safetyPreferences.selectedTrustedContactIds': contactId }
  });

  return { success: true, message: 'Trusted contact deleted successfully' };
};

/**
 * Request Contact Verification (Dispatches SMS OTP if configured)
 * Enforces: Does NOT fake verified state when SMS provider is unconfigured.
 */
export const requestContactVerification = async (passengerId, contactId) => {
  const contact = await TrustedContact.findById(contactId);
  if (!contact) {
    throw new Error('CONTACT_NOT_FOUND');
  }

  if (contact.passengerId.toString() !== passengerId.toString()) {
    throw new Error('UNAUTHORIZED_ACCESS');
  }

  if (contact.verificationStatus === 'verified') {
    return {
      success: true,
      status: 'verified',
      message: 'Contact is already verified'
    };
  }

  // Generate 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  contact.verificationCode = verificationCode;
  contact.verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiration
  await contact.save();

  const smsResult = await sendSms(
    contact.phoneNumber,
    `CampusRide: You have been added as an emergency trusted contact. Your verification code is ${verificationCode}.`
  );

  return {
    success: true,
    contactId: contact._id,
    verificationStatus: contact.verificationStatus, // Remains 'pending'
    delivery: smsResult
  };
};

export default {
  MAX_TRUSTED_CONTACTS,
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  requestContactVerification
};
