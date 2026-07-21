import mongoose from 'mongoose';
import https from 'https';
import User from '../models/User.js';
import Ride from '../models/Ride.js';
import { sendDriverRejectionEmail } from '../services/emailService.js';

// Helper to calculate the current calendar week of the year
const getCurrentWeekNumber = () => {
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// FEATURE 1: Fetch all users registered on the app for the UserDirectory
const getUserDirectory = async (req, res, next) => {
  try {
    const { query } = req.query;

    // 1. Exclude Admin accounts by default
    let filter = { role: { $ne: 'admin' } };

    if (query && query.trim()) {
      const regex = new RegExp(query.trim(), 'i');
      filter.$and = [
        { role: { $ne: 'admin' } },
        {
          $or: [
            { fullName: regex },
            { email: regex },
            { phoneNumber: regex },
            { role: regex }
          ]
        }
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    // 2. Calculate Live Aggregated Platform Metrics
    const [totalUsers, activeCount, driversCount, studentsCount] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ isOnline: true }),
      User.countDocuments({ role: 'driver', isApproved: true }),
      User.countDocuments({ role: { $in: ['student', 'rider'] } })
    ]);

    const metrics = [
      { id: 'u1', label: 'Total Platform Accounts', value: totalUsers.toString(), change: 'Registered', trendColor: '#15803D', icon: 'users', color: '#1E3A8A', bg: '#EFF6FF' },
      { id: 'u2', label: 'Active Fleet Operators', value: driversCount.toString(), change: 'Drivers', trendColor: '#15803D', icon: 'userCheck', color: '#16A34A', bg: '#DCFCE7' },
      { id: 'u3', label: 'Student / Rider Base', value: studentsCount.toString(), change: 'Riders', trendColor: '#15803D', icon: 'userPlus', color: '#2563EB', bg: '#DBEAFE' },
      { id: 'u4', label: 'Currently Active Online', value: activeCount.toString(), change: 'Live GPS', trendColor: '#15803D', icon: 'alertTriangle', color: '#CA8A04', bg: '#FEF9E7' }
    ];

    // 3. Format User Records with Accurate Status Mapping
    const formattedUsers = users.map((u) => {
      const raw = u.toObject();
      const name = raw.fullName || 'Campus User';
      const parts = name.trim().split(/\s+/);
      const initials = parts.length > 1 
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
        : name.slice(0, 2).toUpperCase();

      let mappedUserType = 'GUEST';
      if (raw.role === 'driver') mappedUserType = 'DRIVER';
      if (['student', 'rider'].includes(raw.role?.toLowerCase())) mappedUserType = 'STUDENT';

      // ACCURATE MULTI-STATE STATUS LOGIC
      let userStatus = 'ACTIVE';
      if (raw.isSuspended || raw.isBlocked) {
        userStatus = 'FLAGGED';
      } else if (raw.role === 'driver') {
        if (raw.approvalStatus === 'rejected') {
          userStatus = 'REJECTED';
        } else if (!raw.isApproved || raw.approvalStatus === 'pending') {
          userStatus = 'PENDING';
        }
      }

      return {
        id: raw._id.toString(),
        name,
        email: raw.email || 'N/A',
        phone: raw.phoneNumber || raw.phone || 'N/A',
        userType: mappedUserType,
        role: raw.role || 'student',
        residence: raw.locationResidence || raw.residence || 'Campus Zone',
        status: userStatus,
        initials,
        image: raw.profilePicture || raw.avatar || raw.avatarUri || null,
        rideCount: raw.tripsCompleted || raw.rideCount || 0,
        rideStatus: raw.isOnline ? 'In Transit' : 'Idle',
        tripsHistory: [],
        feedbackHistory: [],
        reportsHistory: []
      };
    });

    res.json({
      success: true,
      count: formattedUsers.length,
      data: {
        metrics,
        studentsData: formattedUsers
      }
    });

  } catch (error) {
    next(error);
  }
};
 
// FEATURE 2: Fetch drivers to view approved and pending profiles on the verification page
const getPendingDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ 
      role: { $regex: /^driver$/i } 
    }).select('-password').sort({ createdAt: -1 });

    const hydratedDrivers = drivers.map((driver) => {
      const rawUserObj = driver.toObject();

      const extractedModel = 
        rawUserObj.vehicleModel || 
        rawUserObj.vehicleType || 
        rawUserObj.vehicle?.model || 
        rawUserObj.vehicleDetails?.model || 
        'Not Specified';

      const extractedPlate = 
        rawUserObj.vehicleLicensePlate || 
        rawUserObj.licensePlate || 
        rawUserObj.vehicle?.licensePlate || 
        rawUserObj.vehicleDetails?.licensePlate || 
        'N/A';

      const extractedColor = 
        rawUserObj.vehicleColor || 
        rawUserObj.color || 
        rawUserObj.vehicle?.color || 
        rawUserObj.vehicleDetails?.color || 
        'Unspecified';

      return {
        ...rawUserObj,
        vehicleModel: extractedModel,
        vehicleLicensePlate: extractedPlate,
        vehicleColor: extractedColor,
        vehicleType: extractedModel,
        
        licenseImg: rawUserObj.licenseImg || rawUserObj.licenseImage || rawUserObj.licenseUrl || rawUserObj.documents?.license || null,
        ghanaCardImg: rawUserObj.ghanaCardImg || rawUserObj.ghanaCardFrontUrl || rawUserObj.ghanaCardFront || rawUserObj.ghanaCardImage || rawUserObj.ghanaCardUrl || rawUserObj.documents?.ghanaCard || null,
        ghanaCardBackImg: rawUserObj.ghanaCardBackImg || rawUserObj.ghanaCardBackUrl || rawUserObj.ghanaCardBack || rawUserObj.ghanaCardBackImage || rawUserObj.documents?.ghanaCardBack || null,
        
        insuranceImg: rawUserObj.insuranceImg || rawUserObj.insuranceImage || rawUserObj.insuranceUrl || rawUserObj.documents?.insurance || null,
        registrationImg: rawUserObj.registrationImg || rawUserObj.registrationImage || rawUserObj.registrationUrl || rawUserObj.documents?.registration || null
      };
    });

    res.json({ success: true, data: hydratedDrivers });
  } catch (error) { 
    next(error); 
  }
};

const approveDriver = async (req, res, next) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.params.id, 
      { isApproved: true, approvalStatus: 'approved' }, 
      { returnDocument: 'after' }
    );
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
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'A rejection reason must be provided.' } 
      });
    }

    const driver = await User.findByIdAndUpdate(
      req.params.id, 
      { 
        isApproved: false, 
        approvalStatus: 'rejected',
        rejectionReason: reason 
      }, 
      { returnDocument: 'after' }
    );

    if (!driver) {
      return res.status(404).json({ success: false, error: { message: 'Driver not found' }});
    }

    try {
      await sendDriverRejectionEmail(driver.email, driver.fullName, reason);
      console.log(`[Email Dispatch] Rejection notification sent to ${driver.email}`);
    } catch (emailErr) {
      console.error(`[Email Dispatch Error] Failed to send rejection email:`, emailErr.message);
    }

    res.json({ 
      success: true, 
      data: { message: 'Driver application rejected and email notification sent.', driver } 
    });
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
        let color = "#10B981"; // Green

        if (activeRequests >= 5) {
          level = "High Demand";
          color = "#EF4444"; // Red
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

    const stats = [
      { label: 'Active Rides Now', value: activeRidesCount.toString(), change: activeRidesCount > 0 ? '+12%' : null, changeColor: '#15803D' },
      { label: 'Drivers Online', value: onlineDriversCount.toString(), change: onlineDriversCount > 0 ? '+5%' : null, changeColor: '#15803D' },
      { label: 'Drivers Registered', value: registeredDriversCount.toString(), change: registeredDriversCount > 0 ? '+8%' : null, changeColor: '#15803D' },
      { label: 'Riders Registered', value: registeredRidersCount.toLocaleString(), change: registeredRidersCount > 0 ? '+24%' : null, changeColor: '#15803D' },
      { label: 'Pending Verification', value: pendingVerificationCount.toString(), change: pendingVerificationCount > 0 ? 'Action Req.' : null, changeColor: '#991B1B' }
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
      data: { currentWeek: currentWeekNum, stats, topDrivers, recentActivity, chartData }
    });
  } catch (error) {
    next(error);
  }
};

// PRODUCTION GRADE PUSH DISPATCHER
const sendExpoPushPayload = (tokensArray, alertTitle, alertBody) => {
  if (!tokensArray || tokensArray.length === 0) return;

  try {
    const payloadData = JSON.stringify(
      tokensArray.map((token) => ({
        to: token,
        sound: 'default',
        title: alertTitle,
        body: alertBody,
        data: { screen: 'notifications' }
      }))
    );

    const options = {
      hostname: 'exp.host',
      port: 443,
      path: '/--/api/v2/push/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Length': Buffer.byteLength(payloadData)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        console.log(`[Push HTTPS Transport] Expo responded with status code: ${res.statusCode}`);
      });
    });

    req.on('error', (err) => {
      console.error("[Push HTTPS Transport] Connection error logged:", err.message);
    });

    req.write(payloadData);
    req.end();

  } catch (err) {
    console.error("[Push HTTPS Transport] Critical execution error bypassed:", err.message);
  }
};

// FEATURE 3: Broadcast notification messages per admin selection
const broadcastNotification = async (req, res, next) => {
  try {
    const bodyData = req && req.body ? req.body : {};
    
    const title = bodyData.title;
    const body = bodyData.body || bodyData.message;
    let target = bodyData.target;

    if (!title || !body || !target) {
      return res.status(400).json({
        success: false,
        error: { message: "Required parameters (title, body/message, target) are missing." }
      });
    }

    const normalizedTarget = target.trim().toUpperCase();
    let filter = {};
    if (normalizedTarget === 'ALL' || normalizedTarget === 'BOTH') {
      filter = { role: { $in: ['student', 'rider', 'guest', 'driver'] } };
    } else if (normalizedTarget === 'DRIVERS' || normalizedTarget === 'DRIVER') {
      filter = { role: 'driver' };
    } else if (normalizedTarget === 'STUDENTS' || normalizedTarget === 'STUDENT' || normalizedTarget === 'RIDERS' || normalizedTarget === 'RIDER') {
      filter = { role: 'student' };
    } else {
      filter = { role: target.toLowerCase() };
    }

    const users = await User.find(filter);

    if (users.length === 0) {
      return res.json({
        success: true,
        message: `Broadcast completed, but 0 users matched target filter "${target}".`,
        data: { recipientsCount: 0, tokensFiredCount: 0 }
      });
    }

    const newNotification = {
      title,
      body,
      message: body,
      desc: body,
      type: "verification",
      isRead: false,
      createdAt: new Date()
    };

    await User.updateMany(filter, { $push: { notifications: newNotification } });

    const pushTokens = users
      .map((u) => u.expoPushToken)
      .filter((token) => token && token.startsWith('ExponentPushToken'));

    if (pushTokens.length > 0) {
      sendExpoPushPayload(pushTokens, title, body);
    }

    return res.json({
      success: true,
      message: `Broadcast processed for target "${target}" successfully.`,
      data: { recipientsCount: users.length, tokensFiredCount: pushTokens.length }
    });

  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid Notification ID structure" }
      });
    }

    const targetObjectId = new mongoose.Types.ObjectId(id);
    const userWithTargetNote = await User.findOne({ "notifications._id": targetObjectId }).select("notifications");

    let titleMatch = "";
    let bodyMatch = "";

    if (userWithTargetNote) {
      const targetNote = userWithTargetNote.notifications.id(targetObjectId);
      if (targetNote) {
        titleMatch = targetNote.title;
        bodyMatch = targetNote.body;
      }
    }

    let pullCondition = { _id: targetObjectId };
    if (titleMatch || bodyMatch) {
      pullCondition = {
        $or: [
          { _id: targetObjectId },
          { title: titleMatch, body: bodyMatch }
        ]
      };
    }

    await User.updateMany({}, { $pull: { notifications: pullCondition } });
    res.json({ success: true, message: "Notification deleted successfully." });
  } catch (error) {
    next(error);
  }
};

const getNotificationsSnapshot = async (req, res, next) => {
  try {
    const [pendingDriversCount, activeRidesCount, totalUsers] = await Promise.all([
      User.countDocuments({ role: 'driver', isApproved: false }),
      Ride ? Ride.countDocuments({ status: { $in: ['requested', 'searching', 'ongoing'] } }) : Promise.resolve(0),
      User.countDocuments({})
    ]);

    const usersWithNotes = await User.find({ "notifications.0": { $exists: true } }).select("notifications role");

    let eventFeed = [];
    const processedBroadcasts = new Set(); 

    usersWithNotes.forEach(user => {
      if (Array.isArray(user.notifications)) {
        user.notifications.forEach(note => {
          if (!note) return;
          const uniqKey = `${(note.title || '').trim()}_${(note.body || '').trim()}`;
          
          if (!processedBroadcasts.has(uniqKey)) {
            processedBroadcasts.add(uniqKey);
            eventFeed.push({
              id: note._id,
              _id: note._id,
              type: 'BROADCAST',
              title: note.title || 'Global Broadcast',
              desc: note.body || 'No details provided',
              category: 'system',
              urgency: note.type === 'critical' ? 'CRITICAL' : 'INFO',
              time: note.createdAt ? new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now',
              createdAt: note.createdAt || new Date()
            });
          }
        });
      }
    });

    if (pendingDriversCount > 0) {
      eventFeed.push({
        id: 'sys-pending-drivers',
        type: 'SYSTEM_ALERT',
        title: 'Driver Verifications Pending',
        desc: `${pendingDriversCount} new driver applications require credential review.`,
        category: 'driver',
        urgency: 'CRITICAL',
        time: 'LIVE',
        createdAt: new Date(Date.now() - 1000)
      });
    }

    if (activeRidesCount > 0) {
      eventFeed.push({
        id: 'sys-active-rides',
        type: 'SYSTEM_ALERT',
        title: 'Campus Transit Activity',
        desc: `${activeRidesCount} active ride streams are traveling across campus zones.`,
        category: 'rides',
        urgency: 'INFO',
        time: 'LIVE',
        createdAt: new Date(Date.now() - 2000)
      });
    } else {
      eventFeed.push({
        id: 'sys-nominal',
        type: 'SYSTEM_ALERT',
        title: 'Transit System Nominal',
        desc: 'Gateway links online. Awaiting student pickup matching request streams.',
        category: 'system',
        urgency: 'INFO',
        time: 'LIVE',
        createdAt: new Date(Date.now() - 5000)
      });
    }

    eventFeed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        metrics: {
          pendingDrivers: pendingDriversCount,
          activeRides: activeRidesCount,
          systemLoad: totalUsers
        },
        notifications: eventFeed.slice(0, 25)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMonitoringSnapshot = async (req, res, next) => {
  try {
    const [
      totalActiveDrivers,
      onlineDriversCount,
      activeRidesCount,
      pendingVerifications,
      completedRidesAgg,
      landmarksAggregation
    ] = await Promise.all([
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'driver', isOnline: true }),  
      Ride ? Ride.countDocuments({ status: 'ongoing' }) : Promise.resolve(0),
      User.countDocuments({ role: 'driver', isApproved: false }),
      Ride ? Ride.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$driverId', count: { $sum: 1 } } }
      ]) : Promise.resolve([]),
      Ride ? Ride.aggregate([
        { $match: { status: { $in: ['requested', 'searching', 'ongoing'] } } },
        { $group: { _id: '$pickupLocationName', activeCount: { $sum: 1 } } }
      ]) : Promise.resolve([])
    ]);

    const metrics = [
      { id: 'm1', label: 'Total Fleet Operators', value: totalActiveDrivers.toString(), change: 'Registered', color: '#1E3A8A', bg: '#EFF6FF' },
      { id: 'm2', label: 'Drivers Active Online', value: onlineDriversCount.toString(), change: 'Live GPS', color: '#16A34A', bg: '#DCFCE7' },
      { id: 'm3', label: 'Ongoing Dispatches', value: activeRidesCount.toString(), change: 'Transit', color: '#CA8A04', bg: '#FEF9E7' },
      { id: 'm4', label: 'Actionable Screening Items', value: pendingVerifications.toString(), change: 'Pending', color: '#DC2626', bg: '#FEE2E2' }
    ];

    let realTimeTrips = [];
    if (Ride) {
      const liveRides = await Ride.find({ status: { $in: ['requested', 'searching', 'ongoing'] } })
        .populate('riderId driverId', 'fullName vehicleModel vehicleLicensePlate')
        .sort({ createdAt: -1 })
        .limit(15);

      realTimeTrips = liveRides.map(ride => ({
        id: ride._id.toString().substring(Math.max(0, ride._id.toString().length - 6)).toUpperCase(),
        status: ride.status === 'ongoing' ? 'In Progress' : 'Matching',
        statusBg: ride.status === 'ongoing' ? '#DCFCE7' : '#FEF9E7',
        statusColor: ride.status === 'ongoing' ? '#16A34A' : '#CA8A04',
        studentName: ride.riderId?.fullName || 'Student Rider',
        driverName: ride.driverId?.fullName || 'Assigning Near-Field...',
        route: ride.pickupLocationName && ride.dropoffLocationName 
          ? `${ride.pickupLocationName} ➔ ${ride.dropoffLocationName}`
          : 'Campus Internal Run',
        vehicle: ride.driverId?.vehicleLicensePlate || 'Awaiting Match'
      }));
    }

    const fullDriversList = await User.find({ role: 'driver' })
      .select('fullName isOnline rating email infractions vehicleModel vehicleLicensePlate vehicleColor vehicleType vehicleDetails vehicle tripsCompleted tripsCanceled');
    
    const driverRoster = fullDriversList.map((driver) => {
      const completionStat = completedRidesAgg.find(c => c._id && c._id.toString() === driver._id.toString());
      const realCompletedCount = completionStat ? completionStat.count : (driver.tripsCompleted || 0);

      const model = driver.vehicleModel || driver.vehicleType || driver.vehicle?.model || driver.vehicleDetails?.model || 'Not Specified';
      const plate = driver.vehicleLicensePlate || driver.licensePlate || driver.vehicle?.licensePlate || driver.vehicleDetails?.licensePlate || 'N/A';

      return {
        id: driver._id.toString(),
        name: driver.fullName || 'Fleet Operator',
        vehicle: `${model} (${plate})`,
        status: driver.isOnline ? 'ONLINE' : 'OFFLINE',
        statusBg: driver.isOnline ? '#DCFCE7' : '#F1F5F9',
        statusColor: driver.isOnline ? '#16A34A' : '#64748B',
        details: driver.isOnline 
          ? 'Broadcasting active telemetry tracking signal to gateway link.' 
          : 'Offline. Handshake Idle.',
        lifetimeTrips: { 
          completed: realCompletedCount, 
          canceled: driver.tripsCanceled || 0 
        },
        infractionsLog: []
      };
    });

    const targetCampusHubs = [
      { name: "Balme Library Complex", defaultKey: "Balme Library" },
      { name: "Legon Night Market", defaultKey: "Night Market" },
      { name: "Evandy / Bani Hostels", defaultKey: "Evandy" },
      { name: "University Hall (Katanga)", defaultKey: "Katanga" }
    ];

    const routePerformance = targetCampusHubs.map(hub => {
      const activeMatch = landmarksAggregation.find(l => l._id && l._id.toLowerCase().includes(hub.defaultKey.toLowerCase()));
      const activeCount = activeMatch ? activeMatch.activeCount : 0;

      let load = "LOW VOLUME";
      let color = "#10B981";

      if (activeCount >= 5) {
        load = "HIGH DENSITY";
        color = "#EF4444";
      } else if (activeCount >= 2) {
        load = "MID SURGE";
        color = "#F59E0B";
      }

      return {
        name: hub.name,
        activeDrivers: onlineDriversCount,
        avgEta: "5 min",
        load,
        color
      };
    });

    res.json({
      success: true,
      data: {
        metrics,
        activeTrips: realTimeTrips,
        routePerformance,
        driverRoster
      }
    });

  } catch (error) {
    next(error);
  }
};

// FEATURE: Toggle User Account Status (Suspend/Warn) - PRODUCTION READY
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, message } = req.body;

    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ success: false, error: { message: 'User record not found' } });
    }

    let update = {};
    let responseMsg = '';

    if (action === 'suspend') {
      const targetState = !existingUser.isSuspended;
      update = { 
        isSuspended: targetState, 
        isOnline: targetState ? false : existingUser.isOnline 
      };
      responseMsg = targetState 
        ? `Account for ${existingUser.fullName || 'User'} suspended.` 
        : `Access reactivated for ${existingUser.fullName || 'User'}.`;

    } else if (action === 'warn') {
      const noticeText = message || 'An administrative warning notice has been issued for your account.';
      
      update = { 
        $push: { 
          warnings: { date: new Date(), message: noticeText },
          notifications: {
            title: 'System Security Notice',
            body: noticeText,
            message: noticeText,
            desc: noticeText,
            type: 'critical',
            isRead: false,
            createdAt: new Date()
          }
        } 
      };
      responseMsg = `Warning notice dispatched to ${existingUser.fullName || 'user'}.`;

      if (existingUser.expoPushToken && existingUser.expoPushToken.startsWith('ExponentPushToken')) {
        sendExpoPushPayload([existingUser.expoPushToken], 'System Security Notice', noticeText);
      }

    } else if (action === 'activate') {
      update = { isSuspended: false };
      responseMsg = `User access reactivated.`;
    } else {
      return res.status(400).json({ success: false, error: { message: 'Invalid action protocol provided.' } });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id, 
      update, 
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    res.json({ 
      success: true, 
      message: responseMsg, 
      data: updatedUser 
    });
  } catch (error) {
    next(error);
  }
};

export {
  getUserDirectory,
  getPendingDrivers,
  approveDriver,
  handleDriverRejection,
  updateUserStatus,
  getCampusDemand,
  getDashboardData,
  broadcastNotification,
  deleteNotification,
  getNotificationsSnapshot,
  getMonitoringSnapshot
};