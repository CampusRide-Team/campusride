// backend/src/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['system', 'driver', 'rides'],
    required: true,
    default: 'system'
  },
  type: {
    type: String,
    default: 'alert'
  },
  title: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    required: true
  },
  urgency: {
    type: String,
    enum: ['INFO', 'CRITICAL'],
    default: 'INFO'
  },
  targetRecipient: {
    type: String,
    enum: ['ALL', 'DRIVERS', 'RIDERS'],
    default: 'ALL'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);