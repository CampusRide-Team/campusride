import User from '../models/User.js';

// @desc    Get all pending drivers for approval
// @route   GET /api/v1/admin/drivers/pending
export const getPendingDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: 'driver', isApproved: false }).select('-password');
    res.json({ success: true, data: drivers });
  } catch (error) { next(error); }
};

// @desc    Approve a driver
// @route   PUT /api/v1/admin/drivers/:id/approve
export const approveDriver = async (req, res, next) => {
  try {
    const driver = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!driver) return res.status(404).json({ success: false, error: { message: 'Driver not found' }});
    res.json({ success: true, data: { message: 'Driver approved successfully', driver } });
  } catch (error) { next(error); }
};