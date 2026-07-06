import cron from 'node-cron';
import Ride from '../models/Ride.js';
import User from '../models/User.js';

export const initCronJobs = () => {
  console.log('⏳ Background Cron Jobs Initialized');

  // JOB 1: Expire Stale Rides (Runs every 1 minute)
  // If a ride is stuck in 'pending' for more than 5 minutes, kill it.
  cron.schedule('* * * * *', async () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await Ride.updateMany(
      { status: 'pending', createdAt: { $lt: fiveMinsAgo } },
      { $set: { status: 'cancelled_timeout' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`🧹 Cleaned up ${result.modifiedCount} stale ride requests.`);
    }
  });

  // JOB 2: Driver Inactivity Timeout (Runs every 10 minutes)
  // Safety feature: Force drivers offline if they haven't sent a GPS update in 30 mins
  cron.schedule('*/10 * * * *', async () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    await User.updateMany(
      { role: 'driver', isOnline: true, updatedAt: { $lt: thirtyMinsAgo } },
      { $set: { isOnline: false } }
    );
  });
};