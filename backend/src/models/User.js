import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { 
      type: String,  
      enum: ["ride_request", "rating", "verification", "cancelled", "general", "critical"], 
      default: "general" 
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const warningSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const vehicleDetailsSchema = new mongoose.Schema(
  {
    make: { type: String, trim: true, default: null },
    model: { type: String, trim: true, default: 'Not Specified' },
    licensePlate: { type: String, trim: true, default: 'N/A' },
    color: { type: String, trim: true, default: 'Unspecified' },
    physicalCapacity: { type: Number, default: 4, min: 1, max: 20 }
  },
  { _id: false }
);

const driverCapacitySchema = new mongoose.Schema(
  {
    chosenSharedCapacity: { type: Number, default: 3, min: 1, max: 20 }
  },
  { _id: false }
);

const driverDocumentsSchema = new mongoose.Schema(
  {
    licenseImg: { type: String, default: null },
    ghanaCardFront: { type: String, default: null },
    ghanaCardBack: { type: String, default: null },
    insuranceImg: { type: String, default: null },
    registrationImg: { type: String, default: null }
  },
  { _id: false }
);

const driverProfileSchema = new mongoose.Schema(
  {
    vehicle: { 
      type: vehicleDetailsSchema, 
      default: () => ({ model: 'Not Specified', licensePlate: 'N/A', physicalCapacity: 4 }) 
    },
    capacity: { 
      type: driverCapacitySchema, 
      default: () => ({ chosenSharedCapacity: 3 }) 
    },
    documents: { 
      type: driverDocumentsSchema, 
      default: () => ({}) 
    },
    rejectionReason: { type: String, default: null }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please include a valid email address",
      ],
    },
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    
    // Canonical Role: passenger, driver, admin (with backward-compatible transitional acceptance of student)
    role: {
      type: String,
      enum: ["passenger", "driver", "admin", "student"], // 'student' allowed during migration window
      default: "passenger",
    },
    
    avatarUri: { type: String, default: null },
    avatarUrl: { type: String, default: null },

    expoPushToken: { type: String, default: null },

    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    heading: { type: Number, default: 0 },
    
    currentLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    },
    
    walletBalance: { type: Number, default: 0 },
    
    // Authoritative Driver Approval Model
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    // Account safety & moderation
    isSuspended: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    warnings: [warningSchema],

    // OTP Verification Fields
    otpCode: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },

    // Driver Profile Subdocument (Driver-only attributes)
    driverProfile: {
      type: driverProfileSchema,
      default: () => ({})
    },

    // Denormalized aggregate rating summary
    ratingAverage: { type: Number, default: 5.0 },
    ratingCount: { type: Number, default: 0 },
    totalTrips: { type: Number, default: 0 },
    tripsToday: { type: Number, default: 0 },

    // Google OAuth Identifier
    googleId: { type: String, default: null, sparse: true },

    notifications: [notificationSchema],
  },
  { 
    timestamps: true,
    collection: 'users',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Backward Compatibility Virtual for `isApproved` derived from `approvalStatus`
userSchema.virtual('isApproved').get(function () {
  return this.approvalStatus === 'approved';
}).set(function (val) {
  this.approvalStatus = val ? 'approved' : 'pending';
});

// Backward Compatibility Virtual for rating (aliases ratingAverage)
userSchema.virtual('rating').get(function () {
  return this.ratingAverage;
}).set(function (val) {
  this.ratingAverage = val;
});

// Backward Compatibility Virtuals for top-level vehicle & document access
userSchema.virtual('vehicleModel').get(function () {
  return this.driverProfile?.vehicle?.model || null;
});
userSchema.virtual('vehicleLicensePlate').get(function () {
  return this.driverProfile?.vehicle?.licensePlate || null;
});
userSchema.virtual('vehicleColor').get(function () {
  return this.driverProfile?.vehicle?.color || null;
});
userSchema.virtual('vehicleType').get(function () {
  return this.driverProfile?.vehicle?.model || null;
});
userSchema.virtual('licenseImg').get(function () {
  return this.driverProfile?.documents?.licenseImg || null;
});
userSchema.virtual('ghanaCardImg').get(function () {
  return this.driverProfile?.documents?.ghanaCardFront || null;
});
userSchema.virtual('ghanaCardBackImg').get(function () {
  return this.driverProfile?.documents?.ghanaCardBack || null;
});
userSchema.virtual('insuranceImg').get(function () {
  return this.driverProfile?.documents?.insuranceImg || null;
});
userSchema.virtual('registrationImg').get(function () {
  return this.driverProfile?.documents?.registrationImg || null;
});

// Indexes for high-frequency queries
userSchema.index({ currentLocation: "2dsphere" });
userSchema.index({ role: 1, isOnline: 1, approvalStatus: 1 });
userSchema.index({ lastSeen: 1 });

// Capacity Invariant Pre-Save Hook: chosenSharedCapacity <= physicalCapacity
userSchema.pre("save", async function () {
  // Hash password if modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Validate driver capacity invariant if role is driver
  if (this.role === 'driver' && this.driverProfile) {
    const physical = this.driverProfile.vehicle?.physicalCapacity || 4;
    const chosen = this.driverProfile.capacity?.chosenSharedCapacity || 3;

    if (chosen > physical) {
      throw new Error(`Chosen shared capacity (${chosen}) cannot exceed physical vehicle capacity (${physical})`);
    }
  }

  // Normalize legacy 'student' role to canonical 'passenger'
  if (this.role === 'student') {
    this.role = 'passenger';
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);