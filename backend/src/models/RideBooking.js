import mongoose from 'mongoose';

const rideLocationSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    poiId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'CampusPOI', 
      default: null 
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: (coords) => (
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 && coords[0] <= 180 &&
            coords[1] >= -90 && coords[1] <= 90
          ),
          message: 'Location coordinates must be valid GeoJSON [longitude, latitude]'
        }
      }
    },
    source: {
      type: String,
      enum: ['poi', 'gps_pin', 'reverse_geocoded'],
      default: 'gps_pin'
    }
  },
  { _id: false }
);

const fareAdjustmentSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true },
    additionalAmount: { type: Number, required: true },
    adjustedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const fareBreakdownSchema = new mongoose.Schema(
  {
    baseFare: { type: Number, default: 0 },
    distanceFare: { type: Number, default: 0 },
    timeFare: { type: Number, default: 0 },
    surgeMultiplier: { type: Number, default: 1.0 },
    discountAmount: { type: Number, default: 0 },
    totalFare: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'GHS' },
    pricingModel: {
      type: String,
      enum: ['platform_calculated', 'driver_proposed', 'negotiated'],
      default: 'platform_calculated'
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'authorized', 'paid', 'refunded'],
      default: 'unpaid'
    },
    adjustments: [fareAdjustmentSchema]
  },
  { _id: false }
);

const cancellationDetailsSchema = new mongoose.Schema(
  {
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledByRole: { 
      type: String, 
      enum: ['passenger', 'driver', 'admin', 'system'] 
    },
    reason: { type: String, default: 'No reason provided' },
    penaltyAmount: { type: Number, default: 0 },
    cancelledAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const rideBookingSchema = new mongoose.Schema(
  {
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Passenger reference is required']
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    driverTripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DriverTrip',
      default: null
    },
    rideMode: {
      type: String,
      enum: ['solo', 'shared'],
      required: [true, 'Ride mode must be solo or shared'],
      default: 'solo'
    },
    status: {
      type: String,
      enum: [
        'pending',
        'driver_assigned',
        'arrived_at_pickup',
        'in_progress',
        'completed',
        'cancelled',
        'cancelled_timeout',
        'failed_no_drivers',
        'emergency_cancelled'
      ],
      default: 'pending'
    },
    pickup: {
      type: rideLocationSchema,
      required: [true, 'Pickup location details are required']
    },
    dropoff: {
      type: rideLocationSchema,
      required: [true, 'Dropoff location details are required']
    },
    intermediateStops: {
      type: [rideLocationSchema],
      default: []
    },
    fare: {
      type: fareBreakdownSchema,
      required: true,
      default: () => ({ totalFare: 0, currency: 'GHS' })
    },
    scheduledTime: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 60 * 1000) // Default 15-minute search window
    },
    dispatchedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    cancellation: {
      type: cancellationDetailsSchema,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'ride_bookings'
  }
);

rideBookingSchema.index({ "pickup.coordinates": "2dsphere" });
rideBookingSchema.index({ "dropoff.coordinates": "2dsphere" });
rideBookingSchema.index({ passengerId: 1, status: 1 });
rideBookingSchema.index({ driverId: 1, status: 1 });
rideBookingSchema.index({ driverTripId: 1 });
rideBookingSchema.index({ scheduledTime: 1, status: 1 });
rideBookingSchema.index({ createdAt: -1 });

export default mongoose.model('RideBooking', rideBookingSchema);
