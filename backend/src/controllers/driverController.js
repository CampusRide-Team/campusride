import User from "../models/User.js";
import Ride from "../models/Ride.js";

export const getDriverProfile = async (req, res, next) => {
  try {
    const driver = await User.findById(req.user._id).select("-password");
    if (!driver)
      return res
        .status(404)
        .json({ success: false, error: { message: "Driver not found" } });
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
    
    // Capture expoPushToken payload from mobile app profile sync
    if (req.body.expoPushToken) allowedUpdates.expoPushToken = req.body.expoPushToken;

    if (req.file?.path) {
      // 1. Convert backslashes to forward slashes for URL compatibility
      const normalizedPath = req.file.path.replace(/\\/g, "/");
      // 2. Save it under both fields for absolute compatibility
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
        .json({ success: false, error: { message: "Driver not found" } });
    }

    // Determine the host URL dynamically
    const host = req.get('host');
    const protocol = req.protocol;
    
    // Build a fully qualified image URL if there's a file path saved
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
        avatarUri: formattedAvatarUri,
        avatarUrl: formattedAvatarUri,
        // Send the updated token back in the response
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
      Ride.countDocuments({ driver: req.user._id, status: "completed" }),
      Ride.countDocuments({
        driver: req.user._id,
        status: "completed",
        updatedAt: { $gte: today },
      }),
    ]);

    res.json({ success: true, data: { dailyTrips, totalTrips } });
  } catch (error) {
    next(error);
  }
};

export const getDriverEarnings = async (req, res, next) => {
  try {
    const completedRides = await Ride.find({
      driver: req.user._id,
      status: "completed",
    }).sort({ createdAt: -1 });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalEarnings = 0;
    let todaysEarnings = 0;

    completedRides.forEach((ride) => {
      totalEarnings += ride.fare;
      if (new Date(ride.updatedAt) >= today) todaysEarnings += ride.fare;
    });

    res.json({
      success: true,
      data: {
        metrics: {
          totalEarnings,
          todaysEarnings,
          totalTrips: completedRides.length,
        },
        recentTrips: completedRides.slice(0, 10),
      },
    });
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
          error: { message: "Preferences payload missing" },
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
    // Fetching the active driver by their authenticated session token ID
    const user = await User.findById(req.user._id).select("notifications");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "Driver user record not found" }
      });
    }

    const notificationsArray = user.notifications || [];
    
    // Sort by newest first
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
        error: { message: "Notification not found" },
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

export const getActiveDriverLocations = async (req, res, next) => {
  try {
    // Find all active drivers that have shared latitude/longitude details
    const onlineDrivers = await User.find({ 
      role: 'driver', 
      isApproved: true, 
      isOnline: true,
      currentLatitude: { $exists: true },
      currentLongitude: { $exists: true }
    }).select('fullName currentLatitude currentLongitude');

    const locations = onlineDrivers.map(drv => ({
      driverId: drv._id,
      name: drv.fullName,
      lat: drv.currentLatitude,
      lng: drv.currentLongitude,
      status: 'Active'
    }));

    res.json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
};