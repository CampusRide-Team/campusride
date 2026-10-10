import cron from 'node-cron';
import Ride from '../models/Ride.js';
import RideBooking from '../models/RideBooking.js';
import User from '../models/User.js';
import DriverTrip from '../models/DriverTrip.js';
import { expireDispatchOffers } from './dispatchOfferService.js';

export const activateDueScheduledBookings = async (now = new Date(), io = null) => {
  const dueIds = await RideBooking.find({
    status: 'scheduled',
    scheduledTime: { $lte: now }
  }).select('_id');

  let activatedCount = 0;
  for (const candidate of dueIds) {
    const booking = await RideBooking.findOneAndUpdate(
      { _id: candidate._id, status: 'scheduled', scheduledTime: { $lte: now } },
      { $set: { status: 'pending', activatedAt: now, expiresAt: new Date(now.getTime() + 15 * 60 * 1000) } },
      { returnDocument: 'after' }
    );
    if (!booking) continue;

    activatedCount += 1;
    io?.to(`user:${booking.passengerId.toString()}`).emit('booking:scheduled_activated', {
      bookingId: booking._id,
      status: booking.status,
      scheduledTime: booking.scheduledTime
    });

    try {
      const dispatch = await import('./dispatchService.js');
      if (booking.rideMode === 'shared') await dispatch.dispatchSharedBooking(booking._id, io);
      else await dispatch.dispatchSoloBooking(booking._id, io);
    } catch (error) {
      console.warn(`[Scheduling] Dispatch failed for activated booking [${booking._id}]:`, error.message);
    }
  }
  return { activatedCount };
};

export const expireStaleBookings = async (now = new Date(), io = null) => {
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // Canonical RideBooking timeout for pending requests exceeding 15 minutes
  const staleBookings = await RideBooking.find({ status: 'pending', expiresAt: { $lt: now } }).select('_id passengerId driverId');
  const bookingTimeoutResult = await RideBooking.updateMany(
    { 
      status: 'pending', 
      expiresAt: { $lt: now }
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
    for (const booking of staleBookings) {
      const payload = { bookingId: booking._id, status: 'cancelled_timeout', reason: 'No driver accepted in time' };
      io?.to(`user:${booking.passengerId.toString()}`).emit('booking:status_changed', payload);
      if (booking.driverId) io?.to(`user:${booking.driverId.toString()}`).emit('booking:status_changed', payload);
    }
  }

  const offerExpiryResult = await expireDispatchOffers(now);

  // Legacy Ride cleanup
  const result = await Ride.updateMany(
    { status: 'pending', scheduledTime: { $exists: false }, createdAt: { $lt: fiveMinsAgo } },
    { $set: { status: 'cancelled_timeout' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`🧹 Cleaned up ${result.modifiedCount} stale legacy ride requests.`);
  }

  return { bookingTimeoutResult, offerExpiryResult, legacyResult: result };
};

export const initCronJobs = (ioInstance) => {
  console.log(' Background Cron Jobs Initialized');

  // JOB 1: Expire Stale Canonical RideBookings & Legacy Rides (Runs every 1 minute)
  cron.schedule('* * * * *', async () => {
    try {
      await expireStaleBookings(new Date(), ioInstance);
    } catch (err) {
      console.error('Cron Job 1 Error:', err);
    }
  });

  // Activate future bookings near their requested time. Atomic status transition
  // prevents duplicate dispatch if multiple scheduler ticks overlap.
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await activateDueScheduledBookings(new Date(), ioInstance);
    } catch (err) {
      console.error('Scheduled Ride Activation Error:', err);
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
