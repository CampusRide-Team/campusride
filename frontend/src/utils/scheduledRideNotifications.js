import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const keyForBooking = (bookingId) => `@campusride_scheduled_notification:${bookingId}`;

export const scheduleRideReminder = async (booking) => {
  if (!booking?._id || !booking?.scheduledTime) return null;
  const triggerDate = new Date(booking.scheduledTime);
  if (Number.isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) return null;

  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('scheduled-rides', {
      name: 'Scheduled rides',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your scheduled ride is starting',
      body: `${booking.pickup?.name || 'Pickup'} to ${booking.dropoff?.name || 'destination'}`,
      sound: 'default',
      data: { bookingId: String(booking._id), type: 'scheduled_ride' },
    },
    trigger: Platform.OS === 'android'
      ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate, channelId: 'scheduled-rides' }
      : triggerDate,
  });
  await AsyncStorage.setItem(keyForBooking(booking._id), identifier);
  return identifier;
};

export const cancelRideReminder = async (bookingId) => {
  const key = keyForBooking(bookingId);
  const identifier = await AsyncStorage.getItem(key);
  if (identifier) await Notifications.cancelScheduledNotificationAsync(identifier);
  await AsyncStorage.removeItem(key);
};
