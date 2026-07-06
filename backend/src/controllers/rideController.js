import mongoose from 'mongoose';
import User from '../models/User.js';
import Ride from '../models/Ride.js';
import { isInsideUG } from '../utils/geofence.js';
import { processPrivateMatch, findSharedRideMatch } from '../services/matchmakingService.js';

export const toggleDriverStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    if (isOnline && req.user.walletBalance < -50) {
      return res.status(403).json({ success: false, error: { message: 'Outstanding commission debt.' }});
    }
    const driver = await User.findByIdAndUpdate(req.user.id, { isOnline }, { new: true }).select('-password');
    res.json({ success: true, data: { isOnline: driver.isOnline }});
  } catch (error) { next(error); }
};

export const requestRide = async (req, res, next) => {
  try {
    const { pickupLocation, dropoffLocation, pickupCoordinates, dropoffCoordinates, fare, rideMode } = req.body;

    if (!isInsideUG(pickupCoordinates[0], pickupCoordinates[1])) {
      return res.status(400).json({ success: false, error: { message: 'Pickup location is outside Legon.' } });
    }

    const newRide = await Ride.create({
      passenger: req.user.id,
      pickupLocation, dropoffLocation,
      pickupCoordinates: { type: 'Point', coordinates: pickupCoordinates },
      dropoffCoordinates: { type: 'Point', coordinates: dropoffCoordinates },
      fare, rideMode
    });

    const populatedRide = await Ride.findById(newRide._id).populate('passenger', 'fullName phoneNumber');
    const io = req.app.get('io');
    
    if (io) {
      if (rideMode === 'shared') {
        const sharedDriverId = await findSharedRideMatch(pickupCoordinates, dropoffCoordinates);
        if (sharedDriverId) io.to(sharedDriverId.toString()).emit('driver:incoming-request', populatedRide);
        else processPrivateMatch(newRide._id, io);
      } else {
        processPrivateMatch(newRide._id, io);
      }
    }
    res.status(201).json({ success: true, data: populatedRide });
  } catch (error) { next(error); }
};

export const getRideQueue = async (req, res, next) => {
  try {
    const pendingRides = await Ride.find({ status: 'pending' }).populate('passenger', 'fullName').sort({ createdAt: 1 });
    res.json({ success: true, data: pendingRides });
  } catch (error) { next(error); }
};

export const acceptRide = async (req, res, next) => {
  try {
    // BUG 6 FIXED: Atomic findOneAndUpdate resolves the concurrency race condition.
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' }, 
      { driver: req.user.id, status: 'accepted' }, 
      { new: true }
    );

    if (!ride) {
      return res.status(400).json({ success: false, error: { message: 'Ride already accepted by another driver or cancelled.' } });
    }

    const io = req.app.get('io');
    if (io) io.to(ride.passenger.toString()).emit('student:ride-matched', { driverId: req.user.id, rideId: ride._id });
    if (io) io.emit('driver:remove-request', ride._id); 

    res.json({ success: true, data: ride });
  } catch (error) { next(error); }
};

// BUG 10 FIXED: Strict State Machine defining valid workflows
const VALID_TRANSITIONS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled']
};

export const updateRideStatus = async (req, res, next) => {
  // BUG 11 FIXED: Implemented MongoDB Transactions for data consistency
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status } = req.body; 
    
    // Retrieve inside transaction
    const ride = await Ride.findById(req.params.id).session(session);
    if (!ride) throw new Error('Ride not found');

    if (ride.driver.toString() !== req.user.id) {
      throw new Error('Not authorized to update this ride');
    }

    // State Machine Validation
    if (!VALID_TRANSITIONS[ride.status] || !VALID_TRANSITIONS[ride.status].includes(status)) {
       throw new Error(`Invalid state transition from ${ride.status} to ${status}`);
    }

    ride.status = status;
    await ride.save({ session });

    // Deduct wallet strictly within the transaction scope
    if (status === 'completed') {
      const commission = ride.fare * 0.10;
      await User.findByIdAndUpdate(req.user.id, { $inc: { walletBalance: -commission } }, { session });
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