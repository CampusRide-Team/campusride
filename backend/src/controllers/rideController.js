import mongoose from 'mongoose';
import User from '../models/User.js';
import Ride from '../models/Ride.js';
import { isInsideUG } from '../utils/geofence.js';
import { processPrivateMatch, findSharedRideMatch } from '../services/matchmakingService.js';

export const toggleDriverStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    if (isOnline && req.user.walletBalance < -50) {
      return res.status(403).json({ success: false, error: { message: 'Outstanding commission debt.' } });
    }
    const driver = await User.findByIdAndUpdate(req.user.id || req.user._id, { isOnline }, { new: true }).select('-password');
    res.json({ success: true, data: { isOnline: driver.isOnline } });
  } catch (error) { 
    next(error); 
  }
};

export const requestRide = async (req, res, next) => {
  try {
    let { pickupLocation, dropoffLocation, pickupCoordinates, dropoffCoordinates, fare, rideMode, driverId } = req.body;

    console.log(" [REQUEST RIDE CALLED]");
    console.log("   - Target driverId in req.body:", driverId ? driverId : "NONE (General Broadcast)");
    console.log("   - Received pickupCoordinates:", pickupCoordinates);

    const validPickup = (Array.isArray(pickupCoordinates) && pickupCoordinates.length >= 2 && !(pickupCoordinates[0] === 0 && pickupCoordinates[1] === 0))
      ? pickupCoordinates
      : [-0.1870, 5.6037];

    const validDropoff = (Array.isArray(dropoffCoordinates) && dropoffCoordinates.length >= 2 && !(dropoffCoordinates[0] === 0 && dropoffCoordinates[1] === 0))
      ? dropoffCoordinates
      : [-0.1852, 5.6595];

    if (!isInsideUG(validPickup[0], validPickup[1])) {
      console.log("⚠️ Warning: Pickup location is outside strict UG geofence boundary, allowing for testing.");
    }

    const newRide = await Ride.create({
      passenger: req.user.id || req.user._id,
      driver: driverId || undefined,
      pickupLocation: pickupLocation || 'Campus Pickup Point', 
      dropoffLocation: dropoffLocation || 'Campus Destination',
      pickupCoordinates: { type: 'Point', coordinates: validPickup },
      dropoffCoordinates: { type: 'Point', coordinates: validDropoff },
      fare: fare || 0, 
      rideMode: rideMode || 'shared',
      status: 'pending'
    });

    const populatedRide = await Ride.findById(newRide._id).populate('passenger', 'fullName phoneNumber avatarUri');
    const io = req.app.get('io');
    
    if (io) {
      const payload = {
        ...populatedRide.toObject(),
        id: populatedRide._id,
        pickup: populatedRide.pickupLocation,
        destination: populatedRide.dropoffLocation,
        passengerName: populatedRide.passenger?.fullName || 'Student Rider',
        passengerPhone: populatedRide.passenger?.phoneNumber || 'N/A',
      };

      if (driverId) {
        console.log(`Emitting 'driver:incoming-request' to room: ${driverId.toString()}`);
        io.to(driverId.toString()).emit('driver:incoming-request', payload);
      } else {
        console.log("Emitting 'driver:incoming-broadcast' globally");
        io.emit('driver:incoming-broadcast', payload);
      }
    } else {
      console.log("CRITICAL: Socket.io instance ('io') not found on req.app!");
    }
    
    res.status(201).json({ success: true, data: populatedRide });
  } catch (error) { 
    console.error("requestRide Error:", error);
    next(error); 
  }
};

// 🔑 Foolproof Get Ride By ID with Guaranteed Population
export const getRideById = async (req, res, next) => {
  try {
    const rideId = req.params.id || req.params.rideId;
    const ride = await Ride.findById(rideId)
      .populate('passenger', 'fullName phoneNumber avatarUri')
      .populate('driver', 'fullName phoneNumber vehicleModel vehicleLicensePlate avatarUri');

    if (!ride) {
      return res.status(404).json({ success: false, error: { message: 'Ride not found' } });
    }

    const rideObj = ride.toObject();
    res.json({
      success: true,
      data: {
        ...rideObj,
        id: rideObj._id,
        pickup: rideObj.pickupLocation || rideObj.pickup || 'Campus Pickup Point',
        destination: rideObj.dropoffLocation || rideObj.destination || 'Campus Destination',
        passengerName: rideObj.passenger?.fullName || 'Student Rider',
        passengerPhone: rideObj.passenger?.phoneNumber || 'N/A',
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRideQueue = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const pendingRides = await Ride.find({ 
      status: 'pending',
      $or: [
        { driver: { $exists: false } },
        { driver: null },
        ...(userId ? [{ driver: userId }] : [])
      ]
    })
      .populate('passenger', 'fullName phoneNumber avatarUri')
      .sort({ createdAt: -1 });

    const formattedRides = pendingRides.map(ride => {
      const rideObj = ride.toObject();
      return {
        ...rideObj,
        id: rideObj._id,
        pickup: rideObj.pickupLocation || rideObj.pickup || 'Campus Pickup Point',
        destination: rideObj.dropoffLocation || rideObj.destination || 'Campus Destination',
        passengerName: rideObj.passenger?.fullName || 'Student Rider',
        passengerPhone: rideObj.passenger?.phoneNumber || 'N/A',
      };
    });

    res.json({ success: true, data: formattedRides });
  } catch (error) { 
    next(error); 
  }
};

// 🔑 Foolproof Accept Ride with Guaranteed Population
export const acceptRide = async (req, res, next) => {
  try {
    const rideId = req.params.rideId || req.params.id;
    const driverId = req.user._id;

    // Step 1: Perform the update
    await Ride.findByIdAndUpdate(
      rideId,
      { driver: driverId, status: 'accepted' },
      { returnDocument: 'after' }
    );

    // Step 2: Fetch fresh with full population to guarantee nested passenger details exist
    const ride = await Ride.findById(rideId)
      .populate('passenger', 'fullName phoneNumber avatarUri')
      .populate('driver', 'fullName phoneNumber vehicleModel vehicleLicensePlate avatarUri');

    if (!ride) {
      return res.status(404).json({ success: false, error: { message: 'Ride not found' } });
    }

    const rideObj = ride.toObject();
    const formattedRide = {
      ...rideObj,
      id: rideObj._id,
      pickup: rideObj.pickupLocation || rideObj.pickup || 'Campus Pickup Point',
      destination: rideObj.dropoffLocation || rideObj.destination || 'Campus Destination',
      passengerName: rideObj.passenger?.fullName || 'Student Rider',
      passengerPhone: rideObj.passenger?.phoneNumber || 'N/A',
    };

    const io = req.app.get('io');
    if (io) {
      const passengerId = ride.passenger?._id ? ride.passenger._id.toString() : ride.passenger?.toString();
      if (passengerId) {
        io.emit(`rideAccepted_${passengerId}`, formattedRide);
      }
    }

    res.json({ success: true, data: formattedRide });
  } catch (error) {
    next(error);
  }
};

export const declineRide = async (req, res, next) => {
  try {
    const rideId = req.params.rideId || req.params.id;

    const ride = await Ride.findByIdAndUpdate(
      rideId,
      { status: 'cancelled' },
      { returnDocument: 'after' }
    );

    if (!ride) {
      return res.status(404).json({ success: false, error: { message: 'Ride not found' } });
    }

    const io = req.app.get('io');
    if (io) {
      const passengerId = ride.passenger?._id ? ride.passenger._id.toString() : ride.passenger?.toString();
      if (passengerId) {
        io.emit(`rideDeclined_${passengerId}`, { rideId });
      }
      io.emit('driver:remove-request', rideId);
      console.log(`❌ Ride ${rideId} declined and removed from queues`);
    }

    res.json({ success: true, message: 'Ride declined successfully' });
  } catch (error) {
    next(error);
  }
};

const VALID_TRANSITIONS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled']
};

export const updateRideStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status } = req.body; 
    const userId = req.user.id || req.user._id;
    
    const ride = await Ride.findById(req.params.id).session(session);
    if (!ride) throw new Error('Ride not found');

    if (!ride.driver || ride.driver.toString() !== userId.toString()) {
      throw new Error('Not authorized to update this ride');
    }

    if (!VALID_TRANSITIONS[ride.status] || !VALID_TRANSITIONS[ride.status].includes(status)) {
       throw new Error(`Invalid state transition from ${ride.status} to ${status}`);
    }

    ride.status = status;
    await ride.save({ session });

    if (status === 'completed' && ride.fare) {
      const commission = ride.fare * 0.10;
      await User.findByIdAndUpdate(userId, { $inc: { walletBalance: -commission } }, { session });
    }

    await session.commitTransaction();
    res.json({ success: true, data: ride });
  } catch (error) { 
    await session.abortTransaction();
    res.status(400).json({ success: false, error: { message: error.message } });
  } finally {
    session.endSession();
  }
};

export const getPendingCampusRequests = async (req, res, next) => {
  try {
    const pendingRides = await Ride.find({ 
      status: "pending" 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingRides,
    });
  } catch (error) {
    next(error);
  }
};

export const scheduleRide = async (req, res, next) => {
  try {
    const { pickup, destination, rideType, scheduledTime, fare } = req.body;
    
    if (!destination || !scheduledTime) {
      return res.status(400).json({ success: false, error: { message: 'Destination and scheduled time are required.' } });
    }

    const passengerId = req.user.id || req.user._id;

    const newSchedule = await Ride.create({
      passenger: passengerId,
      pickupLocation: pickup || 'Current Campus Location',
      dropoffLocation: destination,
      rideMode: rideType || 'shared',
      scheduledTime: new Date(scheduledTime),
      fare: fare || 0,
      status: 'Scheduled',
    });

    return res.status(201).json({ success: true, data: newSchedule });
  } catch (error) {
    console.error("CRITICAL SCHEDULE ERROR:", error);
    return res.status(500).json({ success: false, error: { message: error.message || 'Internal server error scheduling ride.' } });
  }
};

export const getScheduledRides = async (req, res, next) => {
  try {
    const passengerId = req.user.id || req.user._id;
    const rides = await Ride.find({ 
      passenger: passengerId, 
      status: 'Scheduled' 
    }).sort({ scheduledTime: 1 });

    res.json({ success: true, data: rides });
  } catch (error) {
    next(error);
  }
};

export const broadcastRide = async (req, res, next) => {
  try {
    const { pickup, destination, rideType, notes, coordinates, driverId } = req.body;

    if (!destination) {
      return res.status(400).json({ success: false, error: { message: 'Destination is required.' } });
    }

    const passengerId = req.user.id || req.user._id;
    const validCoords = (Array.isArray(coordinates) && coordinates.length >= 2) ? coordinates : [-0.1870, 5.6037];

    const newBroadcast = await Ride.create({
      passenger: passengerId,
      driver: driverId || undefined,
      pickupLocation: pickup || 'Current Campus Location',
      dropoffLocation: destination,
      rideMode: rideType || 'shared',
      notes,
      pickupCoordinates: { type: 'Point', coordinates: validCoords },
      dropoffCoordinates: { type: 'Point', coordinates: validCoords },
      status: 'pending',
    });

    const populatedBroadcast = await Ride.findById(newBroadcast._id).populate('passenger', 'fullName phoneNumber avatarUri');
    
    const io = req.app.get('io');
    if (io) {
      const payload = {
        ...populatedBroadcast.toObject(),
        id: populatedBroadcast._id,
        pickup: populatedBroadcast.pickupLocation,
        destination: populatedBroadcast.dropoffLocation,
        passengerName: populatedBroadcast.passenger?.fullName || 'Student Rider',
        passengerPhone: populatedBroadcast.passenger?.phoneNumber || 'N/A',
        latitude: validCoords[1],
        longitude: validCoords[0],
      };

      io.emit('driver:incoming-broadcast', payload);
    }

    res.status(201).json({ success: { rideId: newBroadcast._id, ...populatedBroadcast.toObject() } });
  } catch (error) {
    next(error);
  }
};

export const rateDriver = async (req, res, next) => {
  try {
    const { driverId, rating, comment } = req.body;
    const passengerId = req.user.id || req.user._id;
    
    if (driverId) {
      await User.findByIdAndUpdate(driverId, {
        $push: { ratings: { passenger: passengerId, rating, comment, createdAt: new Date() } }
      });
    }

    res.json({ success: true, message: 'Rating submitted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const cancelScheduledRide = async (req, res, next) => {
  try {
    const passengerId = req.user.id || req.user._id;
    const rideId = req.params.id;

    const deletedRide = await Ride.findOneAndDelete({
      _id: rideId,
      passenger: passengerId,
      status: 'Scheduled'
    });

    if (!deletedRide) {
      return res.status(404).json({ success: false, error: { message: 'Scheduled ride not found or already processed.' } });
    }

    res.json({ success: true, message: 'Scheduled ride cancelled successfully.' });
  } catch (error) {
    next(error);
  }
};

export const cancelActiveRide = async (req, res, next) => {
  try {
    const passengerId = req.user.id || req.user._id;
    const rideId = req.params.id;

    const cancelledRide = await Ride.findOneAndUpdate(
      { _id: rideId, passenger: passengerId },
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('driver:remove-request', rideId);
      if (cancelledRide && cancelledRide._id) {
        io.emit('driver:remove-request', cancelledRide._id.toString());
        if (cancelledRide.driver) {
          io.to(cancelledRide.driver.toString()).emit('driver:remove-request', cancelledRide._id.toString());
        }
      }
    }

    res.json({ success: true, message: 'Broadcast cancelled successfully.' });
  } catch (error) {
    next(error);
  }
};