import cron from 'node-cron';
import Ride from '../models/Ride.js';
import RideBooking from '../models/RideBooking.js';
import User from '../models/User.js';
import DriverTrip from '../models/DriverTrip.js';

export const expireStaleBookings = async (now = new Date()) => {
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // Canonical RideBooking timeout for pending requests exceeding 15 minutes
  const bookingTimeoutResult = await RideBooking.updateMany(
    { 
      status: 'pending', 
      createdAt: { $lt: fifteenMinsAgo } 
    },
    { 
      $set: { 
        status: 'cancelled_timeout',
        cancellation: {
          reason: 'Timed out - No available drivers accepted the dispatch offer within window',
          cancelledByRole: 'system',
          penaltyAmount: 0,
          cancelledAt: now
        }
      } 
    }
  );
  if (bookingTimeoutResult.modifiedCount > 0) {
    console.log(`🧹 Cleaned up ${bookingTimeoutResult.modifiedCount} stale RideBooking records.`);
  }

  // Legacy Ride cleanup
  const result = await Ride.updateMany(
    { status: 'pending', scheduledTime: { $exists: false }, createdAt: { $lt: fiveMinsAgo } },
    { $set: { status: 'cancelled_timeout' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`🧹 Cleaned up ${result.modifiedCount} stale legacy ride requests.`);
  }

  return { bookingTimeoutResult, legacyResult: result };
};

export const initCronJobs = (ioInstance) => {
  console.log(' Background Cron Jobs Initialized');

  // JOB 1: Expire Stale Canonical RideBookings & Legacy Rides (Runs every 1 minute)
  cron.schedule('* * * * *', async () => {
    try {
      await expireStaleBookings();
    } catch (err) {
      console.error('Cron Job 1 Error:', err);
    }
  });

  // JOB 2: Driver Inactivity Timeout (Runs every 10 minutes)
  // Force drivers offline if they haven't sent a heartbeat in 30 mins and have NO active trip
  cron.schedule('*/10 * * * *', async () => {
    try {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const activeTrips = await DriverTrip.find({
        status: { $in: ['dispatched', 'active'] }
      }).select('driverId');
      const activeDriverIds = activeTrips.map(t => t.driverId);

      await User.updateMany(
        { 
          role: 'driver', 
          isOnline: true, 
          lastSeen: { $lt: thirtyMinsAgo },
          _id: { $nin: activeDriverIds }
        },
        { $set: { isOnline: false } }
      );
    } catch (err) {
      console.error('Cron Job 2 Error:', err);
    }
  });
};