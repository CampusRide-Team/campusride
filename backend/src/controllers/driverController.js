import User from "../models/User.js";
import Ride from "../models/Ride.js";
import DriverTrip from "../models/DriverTrip.js";
import DISPATCH_CONFIG from "../config/dispatchConfig.js";

export const getDriverProfile = async (req, res, next) => {
  try {
    const driver = await User.findById(req.user._id).select("-password");
    if (!driver)
      return res
        .status(404)
        .json({ success: false, error: { code: "DRIVER_NOT_FOUND", message: "Driver not found" } });
    res.json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

export const updateDriverProfile = async (req, res, next) => {
  try {
    const allowedUpdates = {};
    if (req.body.fullName) allowedUpdates.fullName = req.body.fullName;
    if (req.body.phoneNumber) allowedUpdates.phoneNumber = req.body.phoneNumber;
    if (req.body.expoPushToken) allowedUpdates.expoPushToken = req.body.expoPushToken;

    if (req.file?.path) {
      const normalizedPath = req.file.path.replace(/\\/g, "/");
      allowedUpdates.avatarUri = normalizedPath;
      allowedUpdates.avatarUrl = normalizedPath;
    }

    const driver = await User.findByIdAndUpdate(req.user._id, allowedUpdates, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password");

    if (!driver) {
      return res
        .status(404)
        .json({ success: false, error: { code: "DRIVER_NOT_FOUND", message: "Driver not found" } });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    
    let formattedAvatarUri = driver.avatarUri || driver.avatarUrl || null;
    if (formattedAvatarUri && !formattedAvatarUri.startsWith('http')) {
      formattedAvatarUri = `${protocol}://${host}/${formattedAvatarUri}`;
    }

    res.json({
      success: true,
      data: {
        ...driver.toObject(),
        avatarUri: formattedAvatarUri
      },
      user: {
        id: driver._id,
        fullName: driver.fullName,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
        role: driver.role,
        rating: driver.rating || 0.0,
        totalTrips: driver.totalTrips || 0,
        tripsToday: driver.tripsToday || 0,
        isApproved: driver.isApproved,
        approvalStatus: driver.approvalStatus,
        avatarUri: formattedAvatarUri,
        avatarUrl: formattedAvatarUri,
        expoPushToken: driver.expoPushToken, 
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDriverAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalTrips, dailyTrips] = await Promise.all([
      DriverTrip.countDocuments({ driverId: req.user._id, status: "completed" }),
      DriverTrip.countDocuments({
        driverId: req.user._id,
        status: "completed",
        updatedAt: { $gte: today },
      }),
    ]);

    res.json({ success: true, data: { dailyTrips, totalTrips } });
  } catch (error) {
    next(error);
  }
};

export const updateDriverPreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;

    if (!preferences) {
      return res
        .status(400)
        .json({
          success: false,
          error: { code: "MISSING_PAYLOAD", message: "Preferences payload missing" },
        });
    }

    const driver = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "preferences.pushNotifications": preferences.pushNotifications,
          "preferences.emailNotifications": preferences.emailNotifications,
          "preferences.darkMode": preferences.darkMode,
        },
      },
      { returnDocument: "after", runValidators: true },
    );

    res.json({ success: true, data: driver.preferences });
  } catch (error) {
    next(error);
  }
};

export const getDriverNotifications = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("notifications");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "DRIVER_NOT_FOUND", message: "Driver user record not found" }
      });
    }

    const notificationsArray = user.notifications || [];
    const sortedNotifications = notificationsArray.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      unreadCount: notificationsArray.filter(n => !n.isRead).length,  
      data: sortedNotifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, "notifications._id": req.params.id },
      { $set: { "notifications.$.isRead": true } },
      { returnDocument: "after" }
    ).select("notifications");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "NOTIFICATION_NOT_FOUND", message: "Notification not found" },
      });
    }

    const updatedNotification = user.notifications.id(req.params.id);

    res.json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    next(error);
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

/**
 * Updates the driver's latest location heartbeat only. Availability is managed
 * exclusively by updateDriverAvailability so a screen mount/GPS callback can
 * never implicitly take a driver online or offline.
 */
export const updateDriverLocation = async (req, res, next) => {
  try {
    const driverId = req.user.id || req.user._id;
    const user = await User.findById(driverId);

    if (!user || user.role !== 'driver' || (user.approvalStatus !== 'approved' && user.isApproved !== true)) {
      return res.status(403).json({
        success: false,
        error: { code: 'DRIVER_NOT_APPROVED', message: 'Driver is not approved or authorized to go online' }
      });
    }

    const { latitude, longitude } = req.body;

    const updateData = {
      lastSeen: new Date()
    };

    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_COORDINATES', message: 'Coordinates must be valid GeoJSON [longitude, latitude]' }
        });
      }

      updateData.currentLocation = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    }

    const updatedDriver = await User.findByIdAndUpdate(
      driverId,
      { $set: updateData },
      { returnDocument: 'after' }
    ).select('-password');

    res.json({ 
      success: true, 
      data: { 
        isOnline: updatedDriver.isOnline,
        lastSeen: updatedDriver.lastSeen,
        currentLocation: updatedDriver.currentLocation
      } 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Explicit authoritative availability transition.
 */
export const updateDriverAvailability = async (req, res, next) => {
  try {
    const driverId = req.user.id || req.user._id;
    if (typeof req.body?.isOnline !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_AVAILABILITY', message: 'isOnline must be a boolean' }
      });
    }

    const updatedDriver = await User.findOneAndUpdate(
      {
        _id: driverId,
        role: 'driver',
        approvalStatus: 'approved'
      },
      {
        $set: {
          isOnline: req.body.isOnline,
          lastSeen: new Date()
        }
      },
      { returnDocument: 'after' }
    ).select('isOnline lastSeen currentLocation');

    if (!updatedDriver) {
      return res.status(403).json({
        success: false,
        error: { code: 'DRIVER_NOT_APPROVED', message: 'Driver is not approved or authorized to change availability' }
      });
    }

    res.json({ success: true, data: updatedDriver });
  } catch (error) {
    next(error);
  }
};

/**
 * Driver Active Telemetry Endpoint (REST Fallback / Synchronization).
 * Validates driver trip ownership, speed, and coordinate boundaries.
 */
export const updateDriverTelemetry = async (req, res, next) => {
  try {
    const driverId = req.user.id || req.user._id;
    const { tripId, coordinates, heading, speed, timestamp } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Telemetry coordinates must be an array of [longitude, latitude]' }
      });
    }

    const [lng, lat] = coordinates;
    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Coordinates out of bounds' }
      });
    }

    if (speed !== undefined && speed > DISPATCH_CONFIG.MAX_TELEMETRY_SPEED_KMH) {
      return res.status(400).json({
        success: false,
        error: { code: 'TELEMETRY_SPEED_EXCEEDED', message: `Reported speed (${speed} km/h) exceeds maximum allowed threshold (${DISPATCH_CONFIG.MAX_TELEMETRY_SPEED_KMH} km/h)` }
      });
    }

    if (tripId) {
      const trip = await DriverTrip.findById(tripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRIP_NOT_FOUND', message: 'DriverTrip not found' }
        });
      }

      if (trip.driverId.toString() !== driverId.toString()) {
        return res.status(403).json({
          success: false,
          error: { code: 'TRIP_ACCESS_DENIED', message: 'Driver does not own this trip' }
        });
      }

      // Emit strictly to the scoped trip room (no global broadcast)
      const io = req.app.get('io');
      if (io) {
        io.to(`trip:${tripId}`).emit('driver:telemetry', {
          tripId,
          driverId,
          coordinates: [lng, lat],
          heading: heading || 0,
          speed: speed || 0,
          timestamp: timestamp || new Date()
        });
      }
    }

    // Update driver latest heartbeat
    await User.findByIdAndUpdate(driverId, {
      $set: {
        'currentLocation.coordinates': [lng, lat],
        'currentLocation.type': 'Point',
        heading: Number.isFinite(Number(heading)) ? Number(heading) : 0,
        lastSeen: new Date()
      }
    });

    res.json({ success: true, message: 'Telemetry received and routed' });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns discovery-eligible active drivers for map preview.
 */
export const getActiveDriverLocations = async (req, res, next) => {
  try {
    const freshnessThreshold = new Date(Date.now() - DISPATCH_CONFIG.DRIVER_HEARTBEAT_FRESHNESS_MS);

    // Active trips in progress
    const activeTrips = await DriverTrip.find({
      status: { $in: ['dispatched', 'active'] }
    }).select('driverId');
    const busyDriverIds = activeTrips.map(t => t.driverId);

    const activeDrivers = await User.find({
      role: 'driver',
      approvalStatus: 'approved',
      isOnline: true,
      _id: { $nin: busyDriverIds },
      lastSeen: { $gte: freshnessThreshold },
      'currentLocation.coordinates': { $exists: true, $not: { $size: 0 }, $ne: [0, 0] }
    }).select('currentLocation heading lastSeen');

    const formattedDrivers = activeDrivers.map(driver => {
      const coords = driver.currentLocation?.coordinates || [0, 0];
      return {
        id: driver._id,
        // Discovery uses a privacy-conscious preview precision. Assigned-trip
        // telemetry remains exact and is delivered only to authorized trip rooms.
        lat: Number(Number(coords[1]).toFixed(4)),
        lng: Number(Number(coords[0]).toFixed(4)),
        heading: Number.isFinite(driver.heading) ? driver.heading : 0,
        updatedAt: driver.lastSeen
      };
    });

    res.json({ success: true, data: formattedDrivers });
  } catch (error) {
    next(error);
  }
};
