import express from 'express';
import { protect, requireApprovedDriver } from '../middleware/authMiddleware.js';
import { createSoloTrip, claimBookingAtomic, executeTripStop } from '../services/tripService.js';
import { acceptSoloOffer } from '../services/dispatchService.js';
import DriverTrip from '../models/DriverTrip.js';
import { serializeTrip } from '../services/tripDtoService.js';

const router = express.Router();

// POST /api/v1/trips/solo - Create Solo DriverTrip from pending booking
router.post('/solo', protect, requireApprovedDriver, async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_BOOKING_ID', message: 'bookingId is required' }
      });
    }

    const io = req.app.get('io');
    const result = await acceptSoloOffer(req.user._id, bookingId, io);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message === 'BOOKING_ALREADY_CLAIMED') {
      return res.status(409).json({
        success: false,
        error: { code: 'BOOKING_ALREADY_CLAIMED', message: 'This ride has already been claimed by another driver' }
      });
    }
    if (error.message.startsWith('DRIVER_ALREADY_HAS_ACTIVE_TRIP')) {
      return res.status(409).json({
        success: false,
        error: { code: 'DRIVER_ALREADY_HAS_ACTIVE_TRIP', message: 'Driver already has an active trip in progress' }
      });
    }
    next(error);
  }
});

// POST /api/v1/trips/shared - Create or Accept Shared DriverTrip
router.post('/shared', protect, requireApprovedDriver, async (req, res, next) => {
  try {
    const { bookingId, tripId, driverLocation } = req.body;
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_BOOKING_ID', message: 'bookingId is required' }
      });
    }

    const { acceptSharedOffer } = await import('../services/dispatchService.js');
    const io = req.app.get('io');
    const result = await acceptSharedOffer(req.user._id, bookingId, { tripId, io, driverLocation });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message === 'BOOKING_ALREADY_CLAIMED') {
      return res.status(409).json({
        success: false,
        error: { code: 'BOOKING_ALREADY_CLAIMED', message: 'This ride has already been claimed by another driver' }
      });
    }
    if (error.message.startsWith('TRIP_CAPACITY_EXCEEDED')) {
      return res.status(409).json({
        success: false,
        error: { code: 'TRIP_CAPACITY_EXCEEDED', message: error.message }
      });
    }
    if (error.message.startsWith('ROUTE_INSERTION_REJECTED')) {
      return res.status(400).json({
        success: false,
        error: { code: 'ROUTE_INSERTION_REJECTED', message: error.message }
      });
    }
    if (error.message.startsWith('DRIVER_ALREADY_HAS_ACTIVE_TRIP')) {
      return res.status(409).json({
        success: false,
        error: { code: 'DRIVER_ALREADY_HAS_ACTIVE_TRIP', message: 'Driver already has an active trip in progress' }
      });
    }
    next(error);
  }
});

// POST /api/v1/trips/solo/claim - Atomic claim of a booking
router.post('/solo/claim', protect, requireApprovedDriver, async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_BOOKING_ID', message: 'bookingId is required' }
      });
    }

    const booking = await claimBookingAtomic(req.user._id, bookingId);
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    if (error.message === 'BOOKING_ALREADY_CLAIMED') {
      return res.status(409).json({
        success: false,
        error: { code: 'BOOKING_ALREADY_CLAIMED', message: 'This ride has already been claimed by another driver' }
      });
    }
    if (error.message.startsWith('DRIVER_ALREADY_HAS_ACTIVE_TRIP')) {
      return res.status(409).json({
        success: false,
        error: { code: 'DRIVER_ALREADY_HAS_ACTIVE_TRIP', message: 'Driver already has an active trip in progress' }
      });
    }
    next(error);
  }
});

// POST /api/v1/trips/:tripId/stops/:stopId/execute - Advance stop milestone
router.post('/:tripId/stops/:stopId/execute', protect, requireApprovedDriver, async (req, res, next) => {
  try {
    const { tripId, stopId } = req.params;
    const { targetStatus, driverLocation, enforceProximity } = req.body;

    if (!targetStatus) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_STATUS', message: 'targetStatus is required' }
      });
    }

    // Production geospatial safety invariant: proximity is authoritative and cannot be disabled by clients
    const shouldEnforceProximity = process.env.NODE_ENV === 'test' && typeof enforceProximity === 'boolean'
      ? enforceProximity
      : true;

    const result = await executeTripStop({
      driverId: req.user._id,
      tripId,
      stopId,
      targetStatus,
      driverLocation,
      enforceProximity: shouldEnforceProximity
    });

    const io = req.app.get('io');
    if (io) {
      const tripRoom = `trip:${tripId}`;
      io.to(`user:${req.user._id.toString()}`).emit('trip:stop_update', {
        tripId,
        stopId,
        targetStatus,
        stop: result.stop ? {
          ...(result.stop.toObject ? result.stop.toObject() : result.stop),
          coordinates: result.stop.coordinates?.coordinates || result.stop.coordinates
        } : null,
        activePassengerCount: result.trip.activePassengerCount
      });

      if (result.booking?.passengerId) {
        io.to(`user:${result.booking.passengerId.toString()}`).emit('trip:stop_update', {
          tripId,
          stopId,
          targetStatus,
          stop: result.stop ? {
            stopId: result.stop.stopId,
            stopType: result.stop.stopType,
            name: result.stop.name,
            coordinates: result.stop.coordinates?.coordinates || result.stop.coordinates,
            sequenceOrder: result.stop.sequenceOrder,
            status: result.stop.status
          } : null,
          activePassengerCount: result.trip.activePassengerCount
        });
      }

      io.to(tripRoom).emit('trip:status_change', {
        tripId,
        status: result.trip.status
      });

      if (result.booking && result.booking.status === 'completed') {
        io.to(`user:${result.booking.passengerId.toString()}`).emit('ride:completed', {
          bookingId: result.booking._id,
          tripId: result.trip._id,
          completedAt: result.booking.completedAt
        });
      }
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message.startsWith('TOO_FAR_FROM_STOP')) {
      return res.status(400).json({
        success: false,
        error: { code: 'TOO_FAR_FROM_STOP', message: error.message }
      });
    }
    if (error.message.startsWith('STOP_ORDER_VIOLATION')) {
      return res.status(400).json({
        success: false,
        error: { code: 'STOP_ORDER_VIOLATION', message: error.message }
      });
    }
    if (error.message.startsWith('STOP_ALREADY_TERMINAL') || error.message.startsWith('STOP_ALREADY_IN_STATE')) {
      return res.status(409).json({
        success: false,
        error: { code: 'STOP_ALREADY_TERMINAL', message: error.message }
      });
    }
    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: error.message }
      });
    }
    next(error);
  }
});

// GET /api/v1/trips/active - Get driver's active trip
router.get('/active', protect, requireApprovedDriver, async (req, res, next) => {
  try {
    const activeTrip = await DriverTrip.findOne({
      driverId: req.user._id,
      status: { $in: ['dispatched', 'active'] }
    }).populate('driverId', 'fullName phoneNumber avatarUri driverProfile');
    if (activeTrip) await activeTrip.populate('tripStops.passengerId', 'fullName phoneNumber avatarUri');

    res.json({
      success: true,
      data: activeTrip ? serializeTrip(activeTrip, { includePassengerContact: true, viewerId: req.user._id }) : null
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/trips/:id - Get trip details
router.get('/:id', protect, async (req, res, next) => {
  try {
    const trip = await DriverTrip.findById(req.params.id)
      .populate('driverId', 'fullName phoneNumber avatarUri driverProfile')
      .populate('tripStops.passengerId', 'fullName phoneNumber avatarUri');

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: { code: 'TRIP_NOT_FOUND', message: 'Driver trip not found' }
      });
    }

    // Auth check: driver, passenger in stop, or admin
    const isDriver = trip.driverId?._id?.toString() === req.user._id.toString() ||
                     trip.driverId?.toString() === req.user._id.toString();
    const isPassengerInTrip = trip.tripStops.some(s => s.passengerId?.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isDriver && !isPassengerInTrip && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to view this trip' }
      });
    }

    res.json({
      success: true,
      data: serializeTrip(trip, { includePassengerContact: isDriver || isAdmin, viewerId: req.user._id })
    });
  } catch (error) {
    next(error);
  }
});

export default router;
