import { Expo } from 'expo-server-sdk';

const expo = new Expo();

// Sends to a single device token
export const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  const messages = [{
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  }];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// 💡 NEW ADDITION: Safely handles multi-token broadcasting with Expo chunking rules
export const sendMultiplePushNotifications = async (tokensArray, title, body, data = {}) => {
  if (!tokensArray || tokensArray.length === 0) return;

  // Filter out any invalid tokens before shipping them to the chunks processor
  const validMessages = tokensArray
    .filter(token => Expo.isExpoPushToken(token))
    .map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: { screen: 'notifications', ...data },
    }));

  if (validMessages.length === 0) {
    console.log('[Push Service] No valid Expo push tokens found in the target array.');
    return;
  }

  try {
    // Automatically cuts up your broadcast list into safe, standard Expo transmission chunks
    const chunks = expo.chunkPushNotifications(validMessages);
    console.log(`[Push Service] Dispatching broadcast in ${chunks.length} transport chunk batch(es)...`);
    
    for (let chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      console.log(`[Push Service] Chunk batch sent successfully. Tickets gathered: ${tickets.length}`);
    }
  } catch (error) {
    console.error('[Push Service] Critical batch delivery error:', error);
  }
};