import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { 
    type: String, required: true, unique: true,
    match: [/[a-zA-Z0-9._%+-]+@(st\.ug\.edu\.gh|ug\.edu\.gh)$/, 'Must be a valid UG email'] 
  },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'driver', 'admin'], default: 'student' },
  isOnline: { type: Boolean, default: false },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  walletBalance: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.index({ currentLocation: '2dsphere' });
userSchema.index({ isOnline: 1, role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);