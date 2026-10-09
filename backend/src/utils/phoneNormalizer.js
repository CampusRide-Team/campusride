/**
 * CampusRide E.164 Phone Normalization Utility
 * Standardizes Ghana and international phone numbers into E.164 format (+233...)
 */

export const normalizePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number is required and must be a string');
  }

  // Strip all non-digit characters except leading +
  let cleaned = phone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Format: 02XXXXXXXX or 05XXXXXXXX (10 digits starting with 0) -> +2332XXXXXXXX / +2335XXXXXXXX
  if (/^0[235][0-9]{8}$/.test(cleaned)) {
    return `+233${cleaned.substring(1)}`;
  }

  // Format: 2332XXXXXXXX or 2335XXXXXXXX (12 digits starting with 233)
  if (/^233[235][0-9]{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Standard international format with 10 to 15 digits
  if (/^[1-9][0-9]{9,14}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  throw new Error(`Invalid phone number format: "${phone}". Expected valid Ghana or international format.`);
};

export const isValidPhoneNumber = (phone) => {
  try {
    normalizePhoneNumber(phone);
    return true;
  } catch {
    return false;
  }
};

export default {
  normalizePhoneNumber,
  isValidPhoneNumber
};
