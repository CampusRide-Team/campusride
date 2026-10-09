import mongoose from 'mongoose';

const dispatchOfferSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideBooking', required: true, index: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverTrip', default: null },
  dispatchRoundId: { type: String, required: true },
  rideMode: { type: String, enum: ['solo', 'shared'], required: true },
  offerType: { type: String, enum: ['solo_trip', 'new_shared_trip', 'pool_join'], required: true },
  pickup: {
    name: { type: String, required: true },
    coordinates: { type: [Number], required: true }
  },
  dropoff: {
    name: { type: String, required: true },
    coordinates: { type: [Number], required: true }
  },
  routeMetrics: {
    distanceMeters: Number,
    durationSeconds: Number
  },
  detourMetrics: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled', 'superseded'],
    default: 'pending',
    index: true
  },
  expiresAt: { type: Date, required: true, index: true },
  respondedAt: { type: Date, default: null }
}, { timestamps: true });

dispatchOfferSchema.index({ bookingId: 1, driverId: 1, dispatchRoundId: 1 }, { unique: true });
dispatchOfferSchema.index({ driverId: 1, status: 1, expiresAt: 1 });

export default mongoose.model('DispatchOffer', dispatchOfferSchema);
