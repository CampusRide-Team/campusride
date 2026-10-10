import mongoose from 'mongoose';

const tripStopSchema = new mongoose.Schema(
  {
    stopId: {
      type: String,
      required: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RideBooking',
      required: true
    },
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    stopType: {
      type: String,
      enum: ['pickup', 'dropoff', 'intermediate'],
      required: true
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
          message: 'Stop coordinates must be valid GeoJSON [longitude, latitude]'
        }
      }
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    sequenceOrder: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approaching', 'arrived', 'completed', 'skipped', 'cancelled'],
      default: 'pending'
    },
    arrivedAt: {
      type: Date,
      default: null
    },
    departedAt: {
      type: Date,
      default: null
    },
    estimatedDistanceMeters: {
      type: Number,
      default: null
    },
    estimatedDurationSeconds: {
      type: Number,
      default: null
    }
  },
  { _id: false }
);

const currentRouteSchema = new mongoose.Schema(
  {
    polyline: { type: String, default: null },
    distanceMeters: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    calculatedAt: { type: Date, default: Date.now },
    routeVersion: { type: Number, default: 1 }
  },
  { _id: false }
);

const driverTripSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver ID is required for a DriverTrip']
    },
    tripType: {
      type: String,
      enum: ['solo', 'shared'],
      required: true
    },
    status: {
      type: String,
      enum: ['dispatched', 'active', 'completed', 'cancelled'],
      default: 'dispatched'
    },
    maxCapacity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Trip capacity must be at least 1']
    },
    activePassengerCount: {
      type: Number,
      default: 0,
      min: [0, 'Active passenger count cannot be negative']
    },
    reservedPassengerCount: {
      type: Number,
      default: 0,
      min: [0, 'Reserved passenger count cannot be negative']
    },
    tripStops: {
      type: [tripStopSchema],
      default: []
    },
    currentRoute: {
      type: currentRouteSchema,
      default: () => ({ routeVersion: 1, calculatedAt: new Date() })
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'driver_trips'
  }
);

driverTripSchema.index({ driverId: 1, status: 1 });
driverTripSchema.index({ status: 1, tripType: 1 });
driverTripSchema.index({ tripType: 1, status: 1, reservedPassengerCount: 1, maxCapacity: 1 });
driverTripSchema.index({ "tripStops.bookingId": 1 });
driverTripSchema.index({ "tripStops.passengerId": 1 });
driverTripSchema.index({ createdAt: -1 });

export default mongoose.model('DriverTrip', driverTripSchema);
