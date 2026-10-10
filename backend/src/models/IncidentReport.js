import mongoose from 'mongoose';

const incidentReportSchema = new mongoose.Schema(
  {
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Passenger reference is required'],
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
      default: null
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reportReference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    category: {
      type: String,
      enum: [
        'dangerous_driving',
        'harassment',
        'physical_threat',
        'vehicle_condition',
        'inappropriate_behavior',
        'overcharging',
        'other'
      ],
      required: [true, 'Incident category is required']
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'investigating', 'resolved', 'dismissed'],
      default: 'submitted',
      index: true
    },
    resolutionNotes: {
      type: String,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'incident_reports'
  }
);

incidentReportSchema.index({ createdAt: -1 });

export default mongoose.model('IncidentReport', incidentReportSchema);
