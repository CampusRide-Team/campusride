import User from '../models/User.js';
import Ride from '../models/Ride.js';

export const processPrivateMatch = async (rideId, io, batchIndex = 0) => {
  const ride = await Ride.findById(rideId).populate('passenger', 'fullName phoneNumber');
  if (!ride || ride.status !== 'pending') return;

  // Fallback: Find any online driver if geo-query returns nothing
  let nearestDrivers = await User.find({
    role: 'driver',
    isOnline: true,
    currentLocation: {
      $near: {
        $geometry: { type: 'Point', coordinates: ride.pickupCoordinates?.coordinates || [0, 0] },
        $maxDistance: 50000 // expanded range
      }
    }
  }).limit(10); 

  if (nearestDrivers.length === 0) {
    console.log("⚠️ Geo-query found no drivers nearby. Falling back to any online driver...");
    nearestDrivers = await User.find({ role: 'driver', isOnline: true }).limit(10);
  }

  const batch = nearestDrivers.slice(batchIndex * 3, (batchIndex + 1) * 3);

  if (batch.length === 0) {
    console.log("❌ No online drivers found anywhere in database.");
    if (batchIndex === 0) {
       ride.status = 'failed_no_drivers';
       await ride.save();
       io.to(ride.passenger._id.toString()).emit('student:ride-failed', { message: 'No drivers available nearby.' });
    }
    return;
  }

  console.log(`🚀 Emitting 'driver:incoming-request' to ${batch.length} driver(s)`);
  batch.forEach(driver => {
    io.to(driver._id.toString()).emit('driver:incoming-request', ride);
  });

  setTimeout(async () => {
    const checkRide = await Ride.findById(rideId);
    if (checkRide && checkRide.status === 'pending') {
      batch.forEach(driver => io.to(driver._id.toString()).emit('driver:remove-request', rideId));
      if ((batchIndex + 1) * 3 < 10) {
        processPrivateMatch(rideId, io, batchIndex + 1);
      } else {
        checkRide.status = 'failed_no_drivers';
        await checkRide.save();
        io.to(checkRide.passenger._id.toString()).emit('student:ride-failed', { message: 'Drivers are busy. Please try again.' });
      }
    }
  }, 15000); 
};

export const findSharedRideMatch = async (pickupCoords, dropoffCoords) => {
  const eligibleDrivers = await User.find({
    role: 'driver',
    isOnline: true,
    currentLocation: {
      $near: {
        $geometry: { type: 'Point', coordinates: pickupCoords },
        $maxDistance: 1500 
      }
    }
  });

  if (eligibleDrivers.length === 0) return null;

  for (let driver of eligibleDrivers) {
    const activeSharedTrips = await Ride.countDocuments({
      driver: driver._id,
      status: { $in: ['accepted', 'in_progress'] },
      rideMode: 'shared'
    });
    if (activeSharedTrips > 0 && activeSharedTrips < 3) return driver._id; 
  }
  return null;
};