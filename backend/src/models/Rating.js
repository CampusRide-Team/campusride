import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RideBooking',
      required: [true, 'Booking reference is required'],
      unique: true // Guarantees exactly one rating per completed booking
    },
    driverTripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DriverTrip',
      default: null
    },
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Passenger reference is required']
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver reference is required']
    },
    score: {
      type: Number,
      required: [true, 'Rating score is required'],
      min: [1, 'Score cannot be less than 1'],
      max: [5, 'Score cannot be greater than 5']
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true,
    collection: 'ratings'
  }
);

ratingSchema.index({ driverId: 1 });
ratingSchema.index({ passengerId: 1 });
ratingSchema.index({ createdAt: -1 });

export default mongoose.model('Rating', ratingSchema);
