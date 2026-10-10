import express from 'express';
import { protect, requirePassenger } from '../middleware/authMiddleware.js';
import { createRideBooking, cancelBooking } from '../services/bookingService.js';
import { dispatchSoloBooking } from '../services/dispatchService.js';
import RideBooking from '../models/RideBooking.js';
import { getRedispatchValidationError } from '../utils/bookingAuthorization.js';
import DriverTrip from '../models/DriverTrip.js';
import { serializeTrip } from '../services/tripDtoService.js';

const router = express.Router();

// GET /api/v1/bookings/current - Recover the current passenger booking after reconnect/relaunch
router.get('/current', protect, requirePassenger, async (req, res, next) => {
  try {
    const booking = await RideBooking.findOne({
      passengerId: req.user._id,
      status: { $in: ['pending', 'driver_assigned', 'arrived_at_pickup', 'in_progress'] }
    }).sort({ createdAt: -1 })
      .populate('driverId', 'fullName phoneNumber avatarUri driverProfile currentLocation');
    let data = booking ? booking.toObject() : null;
    if (booking?.driverTripId) {
      const trip = await DriverTrip.findById(booking.driverTripId).populate('tripStops.passengerId', 'fullName avatarUri');
      if (trip) data.currentTrip = serializeTrip(trip, { viewerId: req.user._id });
    }
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// GET /api/v1/bookings/scheduled - Future bookings owned by this passenger
router.get('/scheduled', protect, requirePassenger, async (req, res, next) => {
  try {
    const bookings = await RideBooking.find({
      passengerId: req.user._id,
      status: 'scheduled',
      scheduledTime: { $gt: new Date() }
    }).sort({ scheduledTime: 1 });
    res.json({ success: true, data: bookings });
  } catch (error) { next(error); }
});

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
    if (error.message?.startsWith('ROAD_ROUTE_UNAVAILABLE')) {
      return res.status(503).json({
        success: false,
        error: { code: 'ROAD_ROUTE_UNAVAILABLE', message: error.message }
      });
    }
    if (error.message?.startsWith('STALE_ROUTE')) {
      return res.status(409).json({ success: false, error: { code: 'STALE_ROUTE', message: error.message } });
    }
    if (error.message?.startsWith('INVALID_SCHEDULE_TIME')) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_SCHEDULE_TIME', message: error.message } });
    }
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

    const validationError = getRedispatchValidationError(booking, req.user);
    if (validationError) {
      return res.status(validationError.status).json({
        success: false,
        error: { code: validationError.code, message: validationError.message }
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
    if (io) {
      const payload = {
        bookingId: updated._id,
        cancelledBy: req.user._id,
        reason,
        status: updated.status
      };
      io.to(`user:${updated.passengerId.toString()}`).emit('booking:status_changed', payload);
      if (updated.driverId) io.to(`user:${updated.driverId.toString()}`).emit('booking:status_changed', payload);
      if (updated.driverTripId) io.to(`trip:${updated.driverTripId.toString()}`).emit('ride:cancelled', payload);
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
