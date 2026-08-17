import cron from 'node-cron';
import Ride from '../models/Ride.js';
import User from '../models/User.js';

export const initCronJobs = (ioInstance) => {
  console.log(' Background Cron Jobs Initialized');

  // JOB 1: Expire Stale Rides & 15-Minute Broadcast Window (Runs every 1 minute)
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // A: Clean up regular stale pending rides stuck for > 5 minutes
      const result = await Ride.updateMany(
        { status: 'pending', scheduledTime: { $exists: false }, createdAt: { $lt: fiveMinsAgo } },
        { $set: { status: 'cancelled_timeout' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`🧹 Cleaned up ${result.modifiedCount} stale ride requests.`);
      }

      // B: Convert due 'Scheduled' rides to live 'pending' broadcasts automatically
      // (Handles auto-going-live if passenger doesn't manually click reminder)
      const dueSchedules = await Ride.find({
        status: 'Scheduled',
        scheduledTime: { $lte: now }
      });

      for (const ride of dueSchedules) {
        ride.status = 'pending';
        // Assign a 15-minute persistent search expiry window
        ride.expiresAt = new Date(now.getTime() + 15 * 60000);
        await ride.save();

        if (ioInstance) {
          ioInstance.emit('driver:incoming-broadcast', ride);
          console.log(`🚀 Scheduled ride ${ride._id} automatically went live.`);
        }
      }

      // C: Timeout check for persistent broadcasts that exceeded their 15-minute window without driver acceptance
      const expiredBroadcasts = await Ride.find({
        status: 'pending',
        expiresAt: { $lte: now },
        scheduledTime: { $exists: true }
      });

      for (const expiredRide of expiredBroadcasts) {
        expiredRide.status = 'failed_no_drivers';
        await expiredRide.save();

        if (ioInstance) {
          ioInstance.to(expiredRide.passenger.toString()).emit('passenger:ride-timeout', {
            rideId: expiredRide._id,
            message: 'No drivers accepted your ride within the 15-minute window.'
          });
          console.log(`⏱️ Broadcast ${expiredRide._id} timed out after 15 minutes.`);
        }
      }
    } catch (err) {
      console.error('Cron Job 1 Error:', err);
    }
  });

  // JOB 2: Driver Inactivity Timeout (Runs every 10 minutes)
  // Safety feature: Force drivers offline if they haven't updated in 30 mins
  cron.schedule('*/10 * * * *', async () => {
    try {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      await User.updateMany(
        { role: 'driver', isOnline: true, updatedAt: { $lt: thirtyMinsAgo } },
        { $set: { isOnline: false } }
      );
    } catch (err) {
      console.error('Cron Job 2 Error:', err);
    }
  });
};