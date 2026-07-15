import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Ride from '../models/Ride.js';
import { sendPushNotification } from '../services/notificationService.js'; // 💡 Import your service!

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

  export const sendGlobalBroadcast = async (req, res, next) => {
  try {
    const { title, message, target, urgency } = req.body;

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
    // (Assumes you store the token in a field called 'expoPushToken' or 'pushToken' on your User model)
    const targetUsers = await User.find(userFilter).select('expoPushToken pushToken');

    // 3. Loop through active tokens and dispatch through your Expo service
    let dispatchedCount = 0;
    targetUsers.forEach(user => {
      const token = user.expoPushToken || user.pushToken;
      if (token) {
        sendPushNotification(
          token, 
          title, 
          message, 
          { type: 'GLOBAL_BROADCAST', urgency }
        );
        dispatchedCount++;
      }
    });

    res.json({
      success: true,
      message: `Global broadcast deployed successfully. Dispatched to ${dispatchedCount} active Expo devices.`,
      data: broadcastNote
    });
  } catch (error) {
    next(error);
  }
};