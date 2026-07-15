 import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'global_config'
  },
  platformName: { type: String, default: 'CampusRide Admin Portal' },
  operatingHours: { type: String, default: '06:00 AM - 11:59 PM' },
  rideRadius: { type: String, default: '5 Miles' },
  enableRideNotifications: { type: Boolean, default: true },
  twoFactorAuth: { type: Boolean, default: false },
  sessionTimeout: { type: String, default: '30 Minutes of inactivity' },
  driverVerificationAlerts: { type: Boolean, default: true },
  rideActivityAlerts: { type: Boolean, default: true },
  riderActivityAlerts: { type: Boolean, default: false },
  systemMaintenanceAlerts: { type: Boolean, default: true },
  colorTheme: { type: String, default: 'light' },
  interfaceDensity: { type: String, default: 'comfortable' }
}, { timestamps: true });

export default mongoose.model('Setting', settingSchema);