 import User from '../models/User.js';
import Ride from '../models/Ride.js';

// Helper to determine bounding box (approx 150m)
const range = 0.0015;
const zones = [
  { name: 'Pentagon / Evandy Cluster', lat: 5.6575, lng: -0.1912 },
  { name: 'Night Market Hub Area', lat: 5.6478, lng: -0.1835 },
  { name: 'Balme Library / Central Campus', lat: 5.6515, lng: -0.1872 },
  { name: 'Main Gate Transit Line', lat: 5.6440, lng: -0.1870 }
];

// @desc    Get live operational monitoring snapshot
// @route   GET /api/v1/admin/monitoring/snapshot
export const getMonitoringSnapshot = async (req, res, next) => {
  try {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    // 1. Fetch live operations numbers
    const [
      activeRidesCount,
      completedTodayCount,
      unmatchedPingsCount,
      activeTripsData,
      onlineDrivers
    ] = await Promise.all([
      Ride.countDocuments({ status: 'ongoing' }),
      Ride.countDocuments({ 
        status: 'completed', 
        createdAt: { $gte: new Date().setHours(0,0,0,0) } 
      }),
      Ride.countDocuments({ status: 'requested' }),
      Ride.find({ status: { $in: ['requested', 'searching', 'ongoing', 'arrived'] } })
        .sort({ createdAt: -1 })
        .populate('riderId', 'fullName')
        .populate('driverId', 'fullName profilePicture vehicleDetails'),
      User.find({ role: 'driver', isApproved: true, isOnline: true })
    ]);

    // 2. Map Dynamic Stat Cards
    const metrics = [
      { id: 1, label: 'Active Rides', value: activeRidesCount.toString(), change: 'Live On-Map', bg: '#DBEAFE', color: '#16A34A' },
      { id: 2, label: 'Completed Today', value: completedTodayCount.toString(), change: 'Resetting Midnight', bg: '#E2E8F0', color: '#16A34A' },
      { id: 3, label: 'Unmatched Pings', value: unmatchedPingsCount.toString(), change: 'Awaiting Driver', bg: '#FEF9C3', color: '#CA8A04' },
      { id: 4, label: 'Reported Disputes', value: '0', change: 'Immediate Overlook', bg: '#FEE2E2', color: '#DC2626' } // Fallback baseline
    ];

    // 3. Map Active Dispatch Items
    const activeTrips = activeTripsData.map(ride => {
      let statusColor = '#1E40AF';
      let statusBg = '#EFF6FF';
      if (ride.status === 'requested') { statusColor = '#854D0E'; statusBg = '#FFFBEB'; }
      if (ride.status === 'arrived') { statusColor = '#15803D'; statusBg = '#DCFCE7'; }

      return {
        id: ride._id,
        studentName: ride.riderId?.fullName || 'Student Rider',
        driverName: ride.driverId?.fullName || 'Searching...',
        route: `${ride.pickupLocation || 'Origin'} → ${ride.dropoffLocation || 'Destination'}`,
        status: ride.status.toUpperCase(),
        statusBg,
        statusColor,
        vehicle: ride.driverId?.vehicleDetails || 'Pending Assignment'
      };
    });

    // 4. Calculate Dynamic Zone Densities
    const routePerformance = await Promise.all(
      zones.map(async (zone) => {
        // Count active driver locations sitting in this boundary
        const localDrivers = onlineDrivers.filter(driver => {
          if (!driver.currentLatitude || !driver.currentLongitude) return false;
          return Math.abs(driver.currentLatitude - zone.lat) <= range &&
                 Math.abs(driver.currentLongitude - zone.lng) <= range;
        }).length;

        // Count pending rides in this zone
        const localRequests = await Ride.countDocuments({
          status: 'requested',
          createdAt: { $gte: twentyMinutesAgo },
          pickupLatitude: { $gte: zone.lat - range, $lte: zone.lat + range },
          pickupLongitude: { $gte: zone.lng - range, $lte: zone.lng + range }
        });

        let load = "Optimal";
        let loadColor = "#16A34A";
        let avgEta = "5 mins";

        if (localRequests >= 4) {
          load = "High Demand";
          loadColor = "#DC2626";
          avgEta = "2 mins";
        } else if (localDrivers === 0 && localRequests > 0) {
          load = "Surge Warning";
          loadColor = "#CA8A04";
          avgEta = "12 mins";
        } else if (localDrivers === 0) {
          load = "Light Supply";
          loadColor = "#2563EB";
          avgEta = "9 mins";
        }

        return {
          name: zone.name,
          activeDrivers: localDrivers,
          avgEta,
          load,
          color: loadColor
        };
      })
    );

    // 5. Build Dynamic Live Roster Map
    const allDrivers = await User.find({ role: 'driver', isApproved: true })
      .select('fullName vehicleDetails isOnline rating totalTrips profilePicture isSuspended');

    const driverRoster = allDrivers.map(drv => {
      let status = "OFFLINE";
      let statusColor = "#475569";
      let statusBg = "#E2E8F0";

      if (drv.isSuspended) {
        status = "SUSPENDED";
        statusColor = "#991B1B";
        statusBg = "#FEE2E2";
      } else if (drv.isOnline) {
        status = "AVAILABLE";
        statusColor = "#15803D";
        statusBg = "#DCFCE7";
      }

      return {
        id: drv._id,
        name: drv.fullName,
        vehicle: drv.vehicleDetails || 'No Registered Car',
        status,
        statusColor,
        statusBg,
        details: drv.isOnline ? 'Online • Broadcom Transceiver Active' : 'Offline • Handshake Idle',
        lifetimeTrips: {
          completed: drv.totalTrips || 0,
          canceled: 0 // Fetch dynamically if tracked in your model
        },
        infractionsLog: drv.isSuspended ? [{ type: 'Account Suspended', date: 'LIVE', details: 'Flagged for off-app transit solicitation.' }] : []
      };
    });

    res.json({
      success: true,
      data: {
        metrics,
        activeTrips,
        routePerformance,
        driverRoster
      }
    });
  } catch (error) {
    next(error);
  }
};

 export const handleDriverIntervention = async (req, res, next) => {
  try {
    const { action } = req.body;
    let update = {};

    if (action === 'flag') {
      update = { isSuspended: true, isOnline: false };
    } else if (action === 'logout') {
      update = { isOnline: false };
    }

    const driver = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!driver) {
      return res.status(404).json({ success: false, error: { message: 'Driver not found' } });
    }

    res.json({ success: true, message: `Action [${action.toUpperCase()}] executed successfully.` });
  } catch (error) {
    next(error);
  }
};