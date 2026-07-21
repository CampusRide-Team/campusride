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

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please include a valid email address",
      ],
    },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "driver", "admin"],
      default: "student",
    },
    
    avatarUri: { type: String, default: null },
    avatarUrl: { type: String, default: null },

    expoPushToken: { type: String, default: null },

    isOnline: { type: Boolean, default: false },
    currentLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    walletBalance: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },

    // ACCOUNT ENFORCEMENT & SAFETY FIELDS (Added)
    isSuspended: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    warnings: [warningSchema],

    // Vehicle & Verification Data
    vehicleType: { type: String, default: null },
    vehicleModel: { type: String, default: null },
    vehicleLicensePlate: { type: String, default: null },
    vehicleColor: { type: String, default: null },
    nationalIdNumber: { type: String, default: null },

    // Upload asset document destinations
    licenseImg: { type: String, default: null },
    ghanaCardImg: { type: String, default: null },
    ghanaCardBackImg: { type: String, default: null },
    insuranceImg: { type: String, default: null },
    registrationImg: { type: String, default: null },

    notifications: [notificationSchema],
  },
  { 
    timestamps: true,
    collection: 'users' 
  }
);

userSchema.index({ currentLocation: "2dsphere" });
userSchema.index({ isOnline: 1, role: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);