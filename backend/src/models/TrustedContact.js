import mongoose from 'mongoose';

const trustedContactSchema = new mongoose.Schema(
  {
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Passenger reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      minlength: [2, 'Contact name must be at least 2 characters'],
      maxlength: [80, 'Contact name cannot exceed 80 characters']
    },
    phoneNumber: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true
    },
    relationship: {
      type: String,
      enum: ['parent', 'sibling', 'friend', 'partner', 'guardian', 'other'],
      default: 'friend'
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'expired', 'rejected'],
      default: 'pending'
    },
    verificationCode: {
      type: String,
      default: null,
      select: false
    },
    verificationExpiresAt: {
      type: Date,
      default: null
    },
    notificationPreferences: {
      emergencySms: { type: Boolean, default: true },
      rideStartShare: { type: Boolean, default: false },
      rideShareMode: {
        type: String,
        enum: ['every_ride', 'night_only', 'never'],
        default: 'never'
      }
    }
  },
  {
    timestamps: true,
    collection: 'trusted_contacts'
  }
);

// Prevent adding the same normalized phone number multiple times for the same passenger
trustedContactSchema.index({ passengerId: 1, phoneNumber: 1 }, { unique: true });
trustedContactSchema.index({ passengerId: 1, verificationStatus: 1 });

export default mongoose.model('TrustedContact', trustedContactSchema);
