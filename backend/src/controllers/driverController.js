import User from '../models/User.js';
import Ride from '../models/Ride.js';

export const getDriverProfile = async (req, res, next) => {
  try {
    const driver = await User.findById(req.user.id).select('-password');
    if (!driver) return res.status(404).json({ success: false, error: { message: 'Driver not found' } });
    res.json({ success: true, data: driver });
  } catch (error) { next(error); }
};

export const updateDriverProfile = async (req, res, next) => {
  try {
    // BUG 9 FIXED: Explicit Payload Whitelisting (No mass assignment)
    const allowedUpdates = {};
    if (req.body.fullName) allowedUpdates.fullName = req.body.fullName;
    if (req.body.phoneNumber) allowedUpdates.phoneNumber = req.body.phoneNumber;
    // Do not allow updating 'walletBalance', 'isApproved', 'role' here!

    const driver = await User.findByIdAndUpdate(req.user.id, allowedUpdates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, data: driver });
  } catch (error) { next(error); }
};

export const getDriverEarnings = async (req, res, next) => {
  try {
    const completedRides = await Ride.find({ driver: req.user.id, status: 'completed' }).sort({ createdAt: -1 });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalEarnings = 0;
    let todaysEarnings = 0;

    completedRides.forEach(ride => {
      totalEarnings += ride.fare;
      if (new Date(ride.updatedAt) >= today) todaysEarnings += ride.fare;
    });

    res.json({
      success: true,
      data: {
        metrics: { totalEarnings, todaysEarnings, totalTrips: completedRides.length },
        recentTrips: completedRides.slice(0, 10)
      }
    });
  } catch (error) { next(error); }
};