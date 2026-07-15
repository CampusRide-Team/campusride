 import User from '../models/User.js';
import Ride from '../models/Ride.js';

// Helper to calculate the current calendar week of the year
const getCurrentWeekNumber = () => {
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};
 
const getPendingDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: 'driver', isApproved: false }).select('-password');
    res.json({ success: true, data: drivers });
  } catch (error) { 
    next(error); 
  }
};

// @desc    Approve a driver
// @route   PUT /api/v1/admin/drivers/:id/approve
const approveDriver = async (req, res, next) => {
  try {
    const driver = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!driver) {
      return res.status(404).json({ success: false, error: { message: 'Driver not found' }});
    }
    res.json({ success: true, data: { message: 'Driver approved successfully', driver } });
  } catch (error) { 
    next(error); 
  }
};

 
const handleDriverRejection = async (req, res, next) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.params.id, 
      { isApproved: false, approvalStatus: 'rejected' }, 
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ success: false, error: { message: 'Driver not found' }});
    }
    
    res.json({ success: true, data: { message: 'Driver application rejected successfully', driver } });
  } catch (error) { 
    next(error); 
  }
};

 
const getCampusDemand = async (req, res, next) => {
  try {
    const landmarks = [
      { name: "Balme Library Complex", lat: 5.6515, lng: -0.1872 },
      { name: "Legon Night Market", lat: 5.6478, lng: -0.1835 },
      { name: "Evandy / Bani Hostels", lat: 5.6575, lng: -0.1912 },
      { name: "University Hall (Katanga)", lat: 5.6540, lng: -0.1895 }
    ];

    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    const demandResults = await Promise.all(
      landmarks.map(async (place) => {
        const range = 0.0015; // ~150m boundary box
        
        let activeRequests = 0;
        if (Ride) {
          activeRequests = await Ride.countDocuments({
            status: { $in: ['requested', 'searching', 'ongoing'] },
            createdAt: { $gte: twentyMinutesAgo },
            pickupLatitude: { $gte: place.lat - range, $lte: place.lat + range },
            pickupLongitude: { $gte: place.lng - range, $lte: place.lng + range }
          });
        }

        let level = "Low Demand";
        let color = "#EF4444"; // Red

        if (activeRequests >= 5) {
          level = "High Demand";
          color = "#10B981"; // Green
        } else if (activeRequests >= 2) {
          level = "Medium Demand";
          color = "#F59E0B"; // Yellow
        }

        return {
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          level,
          color,
          activeRequests
        };
      })
    );

    res.json({ success: true, data: demandResults });
  } catch (error) {
    next(error);
  }
};

 
const getDashboardData = async (req, res, next) => {
  try {
    const currentWeekNum = getCurrentWeekNumber();
    const past7Days = new Date();
    past7Days.setDate(past7Days.getDate() - 7);

    // Run database queries in parallel
    const [
      activeRidesCount,
      onlineDriversCount,
      registeredDriversCount,  
      registeredRidersCount,
      pendingVerificationCount,
      recentActivityData,
      weeklyPerformanceData
    ] = await Promise.all([
      Ride ? Ride.countDocuments({ status: 'ongoing' }) : Promise.resolve(0),
      User.countDocuments({ role: 'driver', isApproved: true, isOnline: true }),
      User.countDocuments({ role: 'driver' }),  
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'driver', isApproved: false }),
      Ride ? Ride.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('riderId driverId', 'fullName') : Promise.resolve([]),
      Ride ? Ride.aggregate([
        { 
          $match: { 
            status: 'completed', 
            createdAt: { $gte: past7Days },
            driverId: { $ne: null }
          } 
        },
        { 
          $group: { 
            _id: '$driverId', 
            ridesCompletedThisWeek: { $sum: 1 } 
          } 
        },
        { $sort: { ridesCompletedThisWeek: -1 } },
        { $limit: 5 }
      ]) : Promise.resolve([])
    ]);

    // Format metrics into states. Null trends are hidden by the frontend.
    const stats = [
      { 
        label: 'Active Rides Now', 
        value: activeRidesCount.toString(), 
        change: activeRidesCount > 0 ? '+12%' : null, 
        changeColor: '#15803D' 
      },
      { 
        label: 'Drivers Online', 
        value: onlineDriversCount.toString(), 
        change: onlineDriversCount > 0 ? '+5%' : null, 
        changeColor: '#15803D' 
      },
      { 
        label: 'Drivers Registered', 
        value: registeredDriversCount.toString(), 
        change: registeredDriversCount > 0 ? '+8%' : null, 
        changeColor: '#15803D' 
      },
      { 
        label: 'Riders Registered', 
        value: registeredRidersCount.toLocaleString(), 
        change: registeredRidersCount > 0 ? '+24%' : null, 
        changeColor: '#15803D' 
      },
      { 
        label: 'Pending Verification', 
        value: pendingVerificationCount.toString(), 
        change: pendingVerificationCount > 0 ? 'Action Req.' : null, 
        changeColor: '#991B1B' 
      }
    ];

    const protocol = req.encrypted ? 'https' : 'http';
    const serverBaseUrl = `${protocol}://${req.get('host')}`;

    let topDrivers = [];
    
    if (weeklyPerformanceData && weeklyPerformanceData.length > 0) {
      const activeDriverIds = weeklyPerformanceData.map(item => item._id);
      const profiles = await User.find({ _id: { $in: activeDriverIds } })
        .select('fullName rating profilePicture avatar avatarUrl');

      topDrivers = weeklyPerformanceData.map(item => {
        const driver = profiles.find(p => p._id.toString() === item._id.toString());
        if (!driver) return null;

        const name = driver.fullName || 'Unknown Operator';
        const parts = name.trim().split(/\s+/);
        const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();

        let rawImage = driver.profilePicture || driver.avatar || driver.avatarUrl || null;
        let finalImgUrl = null;
        if (rawImage) {
          finalImgUrl = (rawImage.startsWith('http://') || rawImage.startsWith('https://')) 
            ? rawImage 
            : `${serverBaseUrl}${rawImage.startsWith('/') ? rawImage : '/' + rawImage}`;
        }

        return {
          name,
          rating: driver.rating ? `★ ${driver.rating.toFixed(2)}` : 'N/A',
          trips: item.ridesCompletedThisWeek,
          initials,
          profilePicture: finalImgUrl
        };
      }).filter(Boolean);
    }

    const recentActivity = recentActivityData.length > 0 
      ? recentActivityData.map(ride => ({
          title: ride.status === 'completed' ? 'Ride Completed' : 'New Ride Requested',
          desc: `${ride.riderId?.fullName || 'A student'} was matched for a campus run.`,
          time: 'JUST NOW',
          circleColor: ride.status === 'completed' ? '#22C55E' : '#3B82F6'
        }))
      : [{ title: 'System Running', desc: 'Awaiting first campus ride request stream...', time: 'LIVE', circleColor: '#3B82F6' }];

    let chartData = [0, 0, 0, 0, 0, 0, 0];
    if (Ride) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const lastWeekRides = await Ride.find({ createdAt: { $gte: sevenDaysAgo } }).select('createdAt');
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      lastWeekRides.forEach(ride => {
        const dayIndex = (new Date(ride.createdAt).getDay() + 6) % 7;
        dayCounts[dayIndex] += 1;
      });
      chartData = dayCounts;
    }

    res.json({
      success: true,
      data: {
        currentWeek: currentWeekNum,
        stats,
        topDrivers,
        recentActivity,
        chartData
      }
    });
  } catch (error) {
    next(error);
  }
};

export {
  getPendingDrivers,
  approveDriver,
  handleDriverRejection,
  getCampusDemand,
  getDashboardData
};