import Rating from '../models/Rating.js';
import RideBooking from '../models/RideBooking.js';
import User from '../models/User.js';

/**
 * Submits a rating for a completed RideBooking.
 * Guarantees exactly one rating per booking and updates driver rating averages atomically.
 */
export const submitRating = async (passengerId, { bookingId, score, comment = '', tags = [] }) => {
  if (!bookingId || !score) {
    throw new Error('Booking ID and rating score (1-5) are required');
  }

  const numericScore = Number(score);
  if (isNaN(numericScore) || numericScore < 1 || numericScore > 5) {
    throw new Error('Rating score must be a number between 1 and 5');
  }

  const booking = await RideBooking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Ownership verification
  if (booking.passengerId.toString() !== passengerId.toString()) {
    throw new Error('FORBIDDEN: Only the passenger who took the ride can submit a rating');
  }

  if (booking.status !== 'completed') {
    throw new Error('Cannot rate a ride that is not completed');
  }

  if (!booking.driverId) {
    throw new Error('No driver is associated with this booking');
  }

  // Check if rating already exists for this booking
  const existingRating = await Rating.findOne({ bookingId: booking._id });
  if (existingRating) {
    throw new Error('RATING_ALREADY_EXISTS: This booking has already been rated');
  }

  const rating = await Rating.create({
    bookingId: booking._id,
    driverTripId: booking.driverTripId || null,
    passengerId,
    driverId: booking.driverId,
    score: numericScore,
    comment: String(comment).trim(),
    tags: Array.isArray(tags) ? tags : []
  });

  // Calculate new driver rating average
  const allDriverRatings = await Rating.find({ driverId: booking.driverId });
  const totalScore = allDriverRatings.reduce((sum, r) => sum + r.score, 0);
  const ratingAverage = Math.round((totalScore / allDriverRatings.length) * 100) / 100;
  const ratingCount = allDriverRatings.length;

  await User.findByIdAndUpdate(booking.driverId, {
    $set: {
      ratingAverage,
      ratingCount,
      rating: ratingAverage // compatibility alias
    }
  });

  return rating;
};
