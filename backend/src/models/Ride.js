import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, required: true },
  pickupCoordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  dropoffCoordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled_timeout', 'failed_no_drivers'], 
    default: 'pending' 
  },
  fare: { type: Number, required: true },
  rideMode: { type: String, enum: ['shared', 'private'], default: 'private' }
}, { timestamps: true });

rideSchema.index({ status: 1 });
rideSchema.index({ passenger: 1, driver: 1 });
rideSchema.index({ createdAt: -1 });

export default mongoose.model('Ride', rideSchema);