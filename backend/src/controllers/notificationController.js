// backend/src/controllers/notificationController.js
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Ride from '../models/Ride.js';
import { sendPushNotification } from '../services/notificationService.js'; 

// 💡 Ensure "export" is present here!
export const getNotificationSnapshot = async (req, res, next) => {
  try {
    const [
      unreadCount,
      criticalCount,
      pendingDriversCount,
      activeRidesCount,
      dbNotifications
    ] = await Promise.all([
      Notification.countDocuments({ isRead: false }),
      Notification.countDocuments({ urgency: 'CRITICAL', isRead: false }),
      User.countDocuments({ role: 'driver', isApproved: false }),
      Ride ? Ride.countDocuments({ status: { $in: ['requested', 'searching', 'ongoing'] } }) : Promise.resolve(0),
      Notification.find().sort({ createdAt: -1 }).limit(20)
    ]);

    const metrics = [
      { label: 'Unread Notifications', value: unreadCount.toString(), change: 'Live Feed' },
      { label: 'System Alerts', value: criticalCount.toString(), change: `${criticalCount} Critical` },
      { label: 'Verification Updates', value: pendingDriversCount.toString(), change: 'Pending Vetting' },
      { label: 'Ride Notifications', value: activeRidesCount.toString(), change: 'Active Runs' }
    ];

    const notifications = dbNotifications.map(note => ({
      id: note._id.toString(),
      category: note.category,
      type: note.type,
      title: note.title,
      desc: note.desc,
      urgency: note.urgency,
      time: new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
            new Date(note.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      hasActions: note.isRead === false
    }));

    const pendingTasks = [
      { id: 'T1', title: 'License Document Audits', count: `${pendingDriversCount} applications awaiting clearance.` }
    ];

    res.json({ success: true, data: { metrics, notifications, pendingTasks } });
  } catch (error) {
    next(error);
  }
};

// 💡 Ensure "export" is present here as well!
export const sendGlobalBroadcast = async (req, res, next) => {
  try {
    const { title, message, target, urgency } = req.body;

    console.log(`[Broadcast] Received request to send to target: ${target}`);

    // 1. Persist the log inside MongoDB
    const broadcastNote = await Notification.create({
      category: 'system',
      type: 'broadcast',
      title,
      desc: message,
      targetRecipient: target,
      urgency
    });

    // 2. Build the query filter for matching targets
    let userFilter = {};
    if (target === 'DRIVERS') {
      userFilter = { role: 'driver' };
    } else if (target === 'RIDERS') {
      userFilter = { role: { $in: ['student', 'rider', 'guest'] } };
    } else {
      userFilter = { role: { $in: ['student', 'rider', 'guest', 'driver'] } };
    }

    // Find target accounts that possess active push tokens registered
    const targetUsers = await User.find(userFilter).select('expoPushToken pushToken fullName role');

    console.log(`[Broadcast] Found ${targetUsers.length} total user accounts matching filter:`, userFilter);

    // 3. Filter users who actually have a registered push token
    const usersWithTokens = targetUsers.filter(user => user.expoPushToken || user.pushToken);
    
    console.log(`[Broadcast] Out of those, only ${usersWithTokens.length} users have registered tokens:`);
    usersWithTokens.forEach(u => {
      console.log(`  - User: ${u.fullName} (${u.role}) | Token: ${u.expoPushToken || u.pushToken}`);
    });

    // 4. Dispatch async push payloads concurrently using Promise.all
    let dispatchedCount = 0;
    await Promise.all(
      usersWithTokens.map(async (user) => {
        const token = user.expoPushToken || user.pushToken;
        try {
          await sendPushNotification(
            token, 
            title, 
            message, 
            { type: 'GLOBAL_BROADCAST', urgency }
          );
          dispatchedCount++;
        } catch (pushErr) {
          console.error(`[Broadcast] Push failed for user ${user.fullName} (${user._id}):`, pushErr);
        }
      })
    );

    console.log(`[Broadcast] Dispatched successfully to ${dispatchedCount} active Expo devices.`);

    res.json({
      success: true,
      message: `Global broadcast deployed successfully. Dispatched to ${dispatchedCount} active Expo devices.`,
      data: broadcastNote
    });
  } catch (error) {
    next(error);
  }
};