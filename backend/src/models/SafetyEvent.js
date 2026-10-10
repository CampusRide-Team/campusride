import mongoose from 'mongoose';

const safetyLocationSchema = new mongoose.Schema(
  {
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: null,
      validate: {
        validator: (coords) => {
          if (!coords || coords.length === 0) return true;
          return (
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 && coords[0] <= 180 &&
            coords[1] >= -90 && coords[1] <= 90
          );
        },
        message: 'Location coordinates must be valid GeoJSON [longitude, latitude]'
      }
    },
    accuracy: { type: Number, default: null },
    isAvailable: { type: Boolean, default: false },
    capturedAt: { type: Date, default: null }
  },
  { _id: false }
);

const timelineEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'event_created',
        'location_updated',
        'operator_acknowledged',
        'category_updated',
        'contact_notification_attempted',
        'contact_notification_result',
        'escalation_recorded',
        'status_changed',
        'passenger_reported_safe',
        'false_alarm_reported',
        'resolved'
      ]
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actorRole: {
      type: String,
      enum: ['passenger', 'driver', 'admin', 'system'],
      default: 'system'
    },
    message: {
      type: String,
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const contactSnapshotSchema = new mongoose.Schema(
  {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustedContact',
      required: true
    },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    relationship: { type: String, default: 'other' },
    deliveryStatus: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'failed', 'unavailable'],
      default: 'unavailable'
    },
    deliveryError: { type: String, default: null },
    notifiedAt: { type: Date, default: null }
  },
  { _id: false }
);

const safetyEventSchema = new mongoose.Schema(
  {
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Passenger identifier is required'],
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RideBooking',
      default: null,
      index: true
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DriverTrip',
      default: null,
      index: true
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'responding', 'resolved'],
      default: 'active',
      index: true
    },
    category: {
      type: String,
      enum: ['medical', 'accident_vehicle', 'personal_safety_threat', 'other'],
      default: null
    },
    source: {
      type: String,
      enum: ['passenger_sos', 'driver_sos', 'system'],
      default: 'passenger_sos'
    },
    location: {
      type: safetyLocationSchema,
      default: () => ({ isAvailable: false, coordinates: null })
    },
    acknowledgement: {
      acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      operatorName: { type: String, default: null },
      acknowledgedAt: { type: Date, default: null }
    },
    escalation: {
      isRecorded: { type: Boolean, default: false },
      escalatedTo: { type: String, default: null },
      escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      escalatedAt: { type: Date, default: null },
      notes: { type: String, default: null }
    },
    resolution: {
      reason: {
        type: String,
        enum: ['user_reported_safe', 'false_alarm', 'resolved_by_operator', 'other'],
        default: null
      },
      notes: { type: String, default: null },
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      resolvedByRole: {
        type: String,
        enum: ['passenger', 'driver', 'admin', 'system'],
        default: null
      },
      resolvedAt: { type: Date, default: null }
    },
    passengerResolutionIntent: {
      intent: {
        type: String,
        enum: ['safe', 'false_alarm'],
        default: null
      },
      notes: { type: String, default: null },
      reportedAt: { type: Date, default: null }
    },
    timeline: {
      type: [timelineEntrySchema],
      default: []
    },
    trustedContactsSnapshot: {
      type: [contactSnapshotSchema],
      default: []
    },
    idempotencyKey: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'safety_events'
  }
);

safetyEventSchema.index({ passengerId: 1, status: 1 });
safetyEventSchema.index({ passengerId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
safetyEventSchema.index({ createdAt: -1 });

export default mongoose.model('SafetyEvent', safetyEventSchema);
