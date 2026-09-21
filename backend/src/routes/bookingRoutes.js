import express from 'express';
import { protect, requirePassenger } from '../middleware/authMiddleware.js';
import { createRideBooking, cancelBooking } from '../services/bookingService.js';
import { dispatchSoloBooking } from '../services/dispatchService.js';
import RideBooking from '../models/RideBooking.js';

const router = express.Router();

// POST /api/v1/bookings - Create new RideBooking and dispatch
router.post('/', protect, requirePassenger, async (req, res, next) => {
  try {
    const booking = await createRideBooking(req.user._id, req.body);

    const io = req.app.get('io');
    if (booking.status === 'pending') {
      if (booking.rideMode === 'shared') {
        const { dispatchSharedBooking } = await import('../services/dispatchService.js');
        dispatchSharedBooking(booking._id, io).catch(err => {
          console.warn(`[Dispatch] Auto-dispatch shared booking failed [${booking._id}]:`, err.message);
        });
      } else {
        dispatchSoloBooking(booking._id, io).catch(err => {
          console.warn(`[Dispatch] Auto-dispatch solo booking failed [${booking._id}]:`, err.message);
        });
      }
    }

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/bookings/:id/dispatch - Manually trigger / re-trigger dispatch
router.post('/:id/dispatch', protect, async (req, res, next) => {
  try {
    const booking = await RideBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' }
      });
    }

    const io = req.app.get('io');
    let result = null;
    if (booking.rideMode === 'shared') {
      const { dispatchSharedBooking } = await import('../services/dispatchService.js');
      result = await dispatchSharedBooking(booking._id, io);
    } else {
      result = await dispatchSoloBooking(booking._id, io);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/bookings/history - Get booking history for current user
router.get('/history', protect, async (req, res, next) => {
  try {
    const filter = req.user.role === 'driver' 
      ? { driverId: req.user._id }
      : { passengerId: req.user._id };

    const bookings = await RideBooking.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('passengerId', 'fullName phoneNumber avatarUri')
      .populate('driverId', 'fullName phoneNumber avatarUri driverProfile');

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/bookings/:id - Get specific booking details
router.get('/:id', protect, async (req, res, next) => {
  try {
    const booking = await RideBooking.findById(req.params.id)
      .populate('passengerId', 'fullName phoneNumber avatarUri')
      .populate('driverId', 'fullName phoneNumber avatarUri driverProfile');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' }
      });
    }

    // Ownership validation: only passenger, assigned driver, or admin can view
    const isOwner = booking.passengerId?._id?.toString() === req.user._id.toString() ||
                    booking.passengerId?.toString() === req.user._id.toString() ||
                    booking.driverId?._id?.toString() === req.user._id.toString() ||
                    booking.driverId?.toString() === req.user._id.toString() ||
                    req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to access this booking' }
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/bookings/:id/cancel - Cancel booking
router.post('/:id/cancel', protect, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await RideBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' }
      });
    }

    // Ownership check
    const isPassenger = booking.passengerId.toString() === req.user._id.toString();
    const isDriver = booking.driverId && booking.driverId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPassenger && !isDriver && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to cancel this booking' }
      });
    }

    const cancelledRole = isAdmin ? 'admin' : (isDriver ? 'driver' : 'passenger');
    const updated = await cancelBooking(booking._id, req.user._id, cancelledRole, reason);

    const io = req.app.get('io');
    if (io && updated.driverTripId) {
      io.to(`trip:${updated.driverTripId.toString()}`).emit('ride:cancelled', {
        bookingId: updated._id,
        cancelledBy: req.user._id,
        reason
      });
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

export default router;
