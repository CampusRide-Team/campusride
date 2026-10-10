import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DriverTrip from '../models/DriverTrip.js';
import DISPATCH_CONFIG from '../config/dispatchConfig.js';
import { acceptSoloOffer } from './dispatchService.js';
import { respondToDispatchOffer } from './dispatchOfferService.js';
import { getJwtSecret } from '../config/jwtConfig.js';

export const initializeSockets = (server) => {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] }
  });

  // JWT Authentication & DB-State Hardening Middleware for WebSockets
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!token) {
        return next(new Error('AUTH_NO_TOKEN: No authentication token provided'));
      }

      if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length).trim();
      }

      const decoded = jwt.verify(token, getJwtSecret());
      const userId = decoded.id || decoded.userId || decoded._id;

      // Authoritative DB Lookup: Prevent suspended, blocked, or non-existent accounts from socket access
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return next(new Error('AUTH_USER_NOT_FOUND: User account no longer exists'));
      }

      if (user.isSuspended || user.isBlocked) {
        return next(new Error('AUTH_ACCOUNT_SUSPENDED: Suspended accounts cannot connect to realtime services'));
      }

      let role = user.role;
      if (role === 'student') {
        role = 'passenger';
      }

      socket.user = {
        id: user._id.toString(),
        _id: user._id.toString(),
        role,
        approvalStatus: user.approvalStatus,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber
      };

      next();
    } catch (err) {
      next(new Error('AUTH_INVALID_TOKEN: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;

    if (userId) {
      // Canonical user private room
      socket.join(`user:${userId}`);
      // Backward compatibility room
      socket.join(userId);

      // Auto-join authorized Admins to admin:safety room
      if (socket.user.role === 'admin') {
        socket.join('admin:safety');
      }
    }

    // ========================================================================
    // 1. TRIP ROOM MANAGEMENT
    // ========================================================================
    socket.on('trip:join', async (data, callback) => {
      try {
        const tripId = data?.tripId;
        if (!tripId) {
          if (callback) callback({ success: false, error: 'MISSING_TRIP_ID' });
          return;
        }

        const trip = await DriverTrip.findById(tripId);
        if (!trip) {
          if (callback) callback({ success: false, error: 'TRIP_NOT_FOUND' });
          return;
        }

        // Validate user is authorized (driver, passenger in stop, or admin)
        const isDriver = trip.driverId.toString() === userId;
        const isPassenger = trip.tripStops.some(s => s.passengerId.toString() === userId);
        const isAdmin = socket.user?.role === 'admin';

        if (!isDriver && !isPassenger && !isAdmin) {
          if (callback) callback({ success: false, error: 'TRIP_ACCESS_DENIED' });
          return;
        }

        socket.join(`trip:${tripId}`);
        if (callback) callback({ success: true, tripId });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('trip:leave', (data) => {
      const tripId = data?.tripId;
      if (tripId) {
        socket.leave(`trip:${tripId}`);
      }
    });

    // ========================================================================
    // 2. ADMIN SAFETY ROOM MANAGEMENT
    // ========================================================================
    socket.on('admin:safety_join', (callback) => {
      if (socket.user?.role !== 'admin') {
        if (callback) callback({ success: false, error: 'UNAUTHORIZED_ADMIN' });
        return;
      }
      socket.join('admin:safety');
      if (callback) callback({ success: true, room: 'admin:safety' });
    });

    socket.on('admin:safety_leave', () => {
      socket.leave('admin:safety');
    });

    // ========================================================================
    // 3. EMERGENCY EVENT ROOM MANAGEMENT
    // ========================================================================
    socket.on('safety:join_event', async (data, callback) => {
      try {
        const eventId = data?.eventId;
        if (!eventId) {
          if (callback) callback({ success: false, error: 'MISSING_EVENT_ID' });
          return;
        }

        const SafetyEvent = (await import('../models/SafetyEvent.js')).default;
        const event = await SafetyEvent.findById(eventId);
        if (!event) {
          if (callback) callback({ success: false, error: 'EVENT_NOT_FOUND' });
          return;
        }

        const isOwner = event.passengerId?.toString() === userId;
        const isDriver = event.source !== 'passenger_sos' && event.driverId?.toString() === userId;
        const isAdmin = socket.user?.role === 'admin';

        if (!isOwner && !isDriver && !isAdmin) {
          if (callback) callback({ success: false, error: 'UNAUTHORIZED_ACCESS' });
          return;
        }

        socket.join(`safety:event_${eventId}`);
        if (callback) callback({ success: true, eventId });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('safety:leave_event', (data) => {
      const eventId = data?.eventId;
      if (eventId) {
        socket.leave(`safety:event_${eventId}`);
      }
    });

    // ========================================================================
    // 4. DISPATCH RESPONSE & TELEMETRY
    // ========================================================================
    socket.on('dispatch:response', async (data, callback) => {
      try {
        const { offerId, bookingId, response, offerType, tripId } = data || {};
        if (socket.user?.role !== 'driver' || (!offerId && !bookingId) || !response) {
          if (callback) callback({ success: false, error: 'INVALID_PAYLOAD' });
          return;
        }

        if (offerId) {
          const result = await respondToDispatchOffer({ offerId, driverId: userId, response, io });
          if (callback) callback({ success: true, data: result });
          return;
        }

        if (response === 'accept') {
          const RideBooking = (await import('../models/RideBooking.js')).default;
          const booking = await RideBooking.findById(bookingId);
          if (!booking) {
            if (callback) callback({ success: false, error: 'BOOKING_NOT_FOUND' });
            return;
          }

          let result = null;
          if (booking.rideMode === 'shared' || offerType === 'pool_join' || offerType === 'new_shared_trip' || tripId) {
            const { acceptSharedOffer } = await import('./dispatchService.js');
            result = await acceptSharedOffer(userId, bookingId, { tripId, io });
          } else {
            result = await acceptSoloOffer(userId, bookingId, io);
          }

          if (callback) callback({ success: true, data: result });
        } else {
          // Driver declined offer
          if (callback) callback({ success: true, message: 'Offer declined' });
        }
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('driver:telemetry', async (data) => {
      try {
        const { tripId, coordinates, heading, speed, timestamp } = data || {};

        if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
          return; // Safely ignore malformed coordinate payload without crashing
        }

        const [lng, lat] = coordinates;
        if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          return; // Out of bounds
        }

        if (speed !== undefined && speed > DISPATCH_CONFIG.MAX_TELEMETRY_SPEED_KMH) {
          return; // Reject impossible speeds
        }

        if (tripId) {
          const trip = await DriverTrip.findById(tripId).select('driverId status');
          if (!trip || trip.driverId.toString() !== userId) {
            return; // Driver does not own trip
          }

          if (['dispatched', 'active'].includes(trip.status)) {
            // Relay telemetry strictly to authorized trip-room members
            io.to(`trip:${tripId}`).emit('driver:telemetry', {
              tripId,
              driverId: userId,
              coordinates: [lng, lat],
              heading: heading || 0,
              speed: speed || 0,
              timestamp: timestamp || new Date()
            });
          }
        }

        // Update driver location and heartbeat in User model
        await User.findByIdAndUpdate(userId, {
          $set: {
            'currentLocation.coordinates': [lng, lat],
            'currentLocation.type': 'Point',
            lastSeen: new Date()
          }
        });
      } catch (err) {
        // Safe swallow to avoid crashing websocket loop
      }
    });

    socket.on('disconnect', () => {
      // Driver or passenger disconnected
    });
  });

  return io;
};
