 import User from '../models/User.js';
import Ride from '../models/Ride.js';

const getUserDirectory = async (req, res, next) => {
  try {
    const { query } = req.query;

    // 1. Unified search filter across all system account actors
    let filter = { role: { $in: ['student', 'rider', 'guest', 'driver'] } };
    
    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phoneNumber: { $regex: query, $options: 'i' } }
      ];
      if (query.match(/^[0-9a-fA-F]{24}$/)) {
        filter.$or.push({ _id: query });
      }
    }

    // 2. Fetch Aggregated Metrics
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalAccounts,
      activeTodayRiders,
      activeTodayDrivers,
      newToday,
      flaggedAccounts,
      rawUsers
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['student', 'rider', 'guest', 'driver'] } }),
      Ride ? Ride.distinct('riderId', { createdAt: { $gte: todayStart } }) : Promise.resolve([]),
      Ride ? Ride.distinct('driverId', { createdAt: { $gte: todayStart } }) : Promise.resolve([]),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ isSuspended: true }),
      User.find(filter).sort({ createdAt: -1 })
    ]);

    const activeTotalCount = activeTodayRiders.length + activeTodayDrivers.length;

    const metrics = [
      { id: 1, label: 'Total Accounts', value: totalAccounts.toLocaleString(), change: '↑ Platform Total', icon: 'users', color: '#1E3A8A', bg: '#DBEAFE', trendColor: '#15803D' },
      { id: 2, label: 'Active Today', value: activeTotalCount.toString(), change: '● Live Activity', icon: 'userCheck', color: '#1E3A8A', bg: '#DCFCE7', trendColor: '#15803D' },
      { id: 3, label: 'New Registrations', value: newToday.toString(), change: 'Past 24 hours', icon: 'userPlus', color: '#1E3A8A', bg: '#EFF6FF', trendColor: '#64748B' },
      { id: 4, label: 'Flagged Accounts', value: flaggedAccounts.toString(), change: 'Requires Attention', icon: 'alertTriangle', color: '#991B1B', bg: '#FEE2E2', trendColor: '#991B1B' }
    ];

    // 3. Hydrate User profiles dynamically
    const protocol = req.encrypted ? 'https' : 'http';
    const serverBaseUrl = `${protocol}://${req.get('host')}`;

    const studentsData = await Promise.all(
      rawUsers.map(async (user) => {
        // Fetch corresponding rides historical ledger data
        const rideFilter = user.role === 'driver' ? { driverId: user._id } : { riderId: user._id };
        const rideHistory = Ride ? await Ride.find(rideFilter)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate(user.role === 'driver' ? 'riderId' : 'driverId', 'fullName') : [];

        const tripsHistory = rideHistory.map(ride => ({
          id: ride._id.toString(),
          date: new Date(ride.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          route: `${ride.pickupLocation || 'Origin'} → ${ride.dropoffLocation || 'Destination'}`,
          driver: user.role === 'driver' ? (ride.riderId?.fullName || 'Rider Student') : (ride.driverId?.fullName || 'Driver Match'),
          state: ride.status.toUpperCase()
        }));

        let rawImage = user.profilePicture || user.avatar || user.avatarUrl || null;
        let finalImgUrl = null;
        if (rawImage) {
          finalImgUrl = (rawImage.startsWith('http://') || rawImage.startsWith('https://')) 
            ? rawImage 
            : `${serverBaseUrl}${rawImage.startsWith('/') ? rawImage : '/' + rawImage}`;
        }

        // Standardize account type labels seamlessly to use existing UI badges
        let computedUserType = 'GUEST';
        if (user.role === 'driver') {
          computedUserType = 'DRIVER'; 
        } else if (user.role === 'student' || user.role === 'rider' || user.email?.endsWith('.edu.gh')) {
          computedUserType = 'STUDENT';
        }

        return {
          id: user._id.toString(),
          userType: computedUserType,
          name: user.fullName || 'Anonymous User',
          email: user.email || 'N/A',
          regDate: new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          rideCount: user.totalTrips || tripsHistory.length || 0,
          status: user.isSuspended ? 'FLAGGED' : 'ACTIVE',
          phone: user.phoneNumber || 'N/A',
          residence: user.role === 'driver' ? (user.vehicleDetails || 'Approved Vehicle') : (user.locationResidence || user.residence || 'Campus Hall'),
          rideStatus: user.isOnline ? 'In Transit' : 'Offline',
          image: finalImgUrl,
          tripsHistory,
          feedbackHistory: [],
          reportsHistory: []
        };
      })
    );

    res.json({ success: true, data: { metrics, studentsData } });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or Warn Rider Account
// @route   PATCH /api/v1/admin/users/:id/status
const handleEnforcementAction = async (req, res, next) => {
  try {
    const { action } = req.body;
    let update = {};

    if (action === 'suspend') {
      update = { isSuspended: true };
    } else if (action === 'warn') {
      update = { $inc: { warningCount: 1 } }; 
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User profile not found' } });
    }

    res.json({ success: true, message: `Enforcement [${action.toUpperCase()}] executed successfully.` });
  } catch (error) {
    next(error);
  }
};

// Explicit Named Exports Block for ES Modules Router matching
export {
  getUserDirectory,
  handleEnforcementAction
};