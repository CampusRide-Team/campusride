 import User from '../models/User.js';
import DriverTrip from '../models/DriverTrip.js';
import RideBooking from '../models/RideBooking.js';
import CampusPOI from '../models/CampusPOI.js';

// Helper to determine bounding box (approx 150m)
const range = 0.0020;
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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Fetch live operations numbers
    const [
      activeTripsCount,
      completedTodayCount,
      unmatchedPingsCount,
      activeTripsData,
      onlineDrivers
    ] = await Promise.all([
      DriverTrip.countDocuments({ status: { $in: ['dispatched', 'active'] } }),
      DriverTrip.countDocuments({ 
        status: 'completed', 
        createdAt: { $gte: todayStart } 
      }),
      RideBooking.countDocuments({ status: 'pending' }),
      DriverTrip.find({ status: { $in: ['dispatched', 'active'] } })
        .sort({ createdAt: -1 })
        .populate('driverId', 'fullName profilePicture avatar avatarUrl driverProfile vehicleDetails')
        .populate('tripStops.passengerId', 'fullName'),
      User.find({ role: 'driver', approvalStatus: 'approved', isOnline: true })
    ]);

    // 2. Map Dynamic Stat Cards
    const metrics = [
      { id: 1, label: 'Active Trips', value: activeTripsCount.toString(), change: 'Live On-Map', bg: '#DBEAFE', color: '#16A34A' },
      { id: 2, label: 'Completed Today', value: completedTodayCount.toString(), change: 'Resetting Midnight', bg: '#E2E8F0', color: '#16A34A' },
      { id: 3, label: 'Unmatched Pings', value: unmatchedPingsCount.toString(), change: 'Awaiting Driver', bg: '#FEF9C3', color: '#CA8A04' },
      { id: 4, label: 'Reported Disputes', value: '0', change: 'Immediate Overlook', bg: '#FEE2E2', color: '#DC2626' } // Fallback baseline
    ];

    // 3. Map Active Dispatch Items
    const activeTrips = activeTripsData.map(trip => {
      let statusColor = '#1E40AF';
      let statusBg = '#EFF6FF';
      if (trip.status === 'dispatched') { statusColor = '#854D0E'; statusBg = '#FFFBEB'; }
      if (trip.status === 'active') { statusColor = '#15803D'; statusBg = '#DCFCE7'; }

      const stops = trip.tripStops || [];
      const pickupStop = stops.find(s => s.stopType === 'pickup') || stops[0];
      const dropoffStop = stops.find(s => s.stopType === 'dropoff') || stops[stops.length - 1];
      const passengerName = pickupStop?.passengerId?.fullName || (stops.length > 0 ? `${stops.length} Passenger(s)` : 'Passenger');
      const routeText = pickupStop && dropoffStop ? `${pickupStop.name} → ${dropoffStop.name}` : 'Campus Run';
      const vehicle = trip.driverId?.driverProfile?.vehicle?.model 
        ? `${trip.driverId.driverProfile.vehicle.model} (${trip.driverId.driverProfile.vehicle.licensePlate})`
        : trip.driverId?.vehicleDetails || 'Pending Assignment';

      return {
        id: trip._id.toString().substring(Math.max(0, trip._id.toString().length - 6)).toUpperCase(),
        studentName: passengerName,
        driverName: trip.driverId?.fullName || 'Searching...',
        route: routeText,
        status: trip.status.toUpperCase(),
        statusBg,
        statusColor,
        vehicle
      };
    });

    // 4. Calculate Dynamic Zone Densities
    const routePerformance = await Promise.all(
      zones.map(async (zone) => {
        // Count active driver locations sitting in this boundary
        const localDrivers = onlineDrivers.filter(driver => {
          if (!driver.currentLocation?.coordinates) return false;
          const [lng, lat] = driver.currentLocation.coordinates;
          return Math.abs(lat - zone.lat) <= range && Math.abs(lng - zone.lng) <= range;
        }).length;

        // Count pending rides in this zone
        const localRequests = await RideBooking.countDocuments({
          status: 'pending',
          createdAt: { $gte: twentyMinutesAgo },
          "pickup.coordinates.coordinates.1": { $gte: zone.lat - range, $lte: zone.lat + range },
          "pickup.coordinates.coordinates.0": { $gte: zone.lng - range, $lte: zone.lng + range }
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
    const allDrivers = await User.find({ role: 'driver', approvalStatus: 'approved' })
      .select('fullName driverProfile vehicleDetails isOnline rating ratingAverage totalTrips profilePicture isSuspended');

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

      const model = drv.driverProfile?.vehicle?.model || drv.vehicleDetails || 'No Registered Car';
      const plate = drv.driverProfile?.vehicle?.licensePlate || '';

      return {
        id: drv._id.toString(),
        name: drv.fullName,
        vehicle: plate ? `${model} (${plate})` : model,
        status,
        statusColor,
        statusBg,
        details: drv.isOnline ? 'Online • Broadcom Transceiver Active' : 'Offline • Handshake Idle',
        lifetimeTrips: {
          completed: drv.totalTrips || 0,
          canceled: 0
        },
        infractionsLog: drv.isSuspended ? [{ type: 'Account Suspended', date: 'LIVE', details: 'Flagged for moderation review.' }] : []
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

    const driver = await User.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' });
    if (!driver) {
      return res.status(404).json({ success: false, error: { message: 'Driver not found' } });
    }

    res.json({ success: true, message: `Action [${action.toUpperCase()}] executed successfully.` });
  } catch (error) {
    next(error);
  }
};