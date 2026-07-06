import User from '../models/User.js';
import Ride from '../models/Ride.js';

export const processPrivateMatch = async (rideId, io, batchIndex = 0) => {
  const ride = await Ride.findById(rideId).populate('passenger', 'fullName phoneNumber');
  if (!ride || ride.status !== 'pending') return;

  const nearestDrivers = await User.find({
    role: 'driver',
    isOnline: true,
    currentLocation: {
      $near: {
        $geometry: { type: 'Point', coordinates: ride.pickupCoordinates.coordinates },
        $maxDistance: 2500 
      }
    }
  }).limit(10); 

  // BUG 1 FIXED: Proper array slicing for batch progression
  const batch = nearestDrivers.slice(batchIndex * 3, (batchIndex + 1) * 3);

  if (batch.length === 0) {
    if (batchIndex === 0) {
       ride.status = 'failed_no_drivers';
       await ride.save();
       io.to(ride.passenger._id.toString()).emit('student:ride-failed', { message: 'No drivers available nearby.' });
    }
    return;
  }

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