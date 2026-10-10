// frontend/src/config/safetyConfig.js
import { Alert, Linking } from 'react-native';

/**
 * Authoritative Safety Configuration Boundaries
 * 
 * NOTE: Verified Campus Security phone line must NOT be hardcoded.
 * In production environments, it is supplied via EXPO_PUBLIC_CAMPUS_SECURITY_PHONE.
 * If unconfigured, the app presents a neutral unavailable boundary without guessing or silent failure.
 */
export const safetyConfig = {
  campusSecurityPhone: process.env.EXPO_PUBLIC_CAMPUS_SECURITY_PHONE || null,
  nationalEmergencyPhone: '112',
};

/**
 * Centralized Campus Security Call Trigger
 * Honors CONFIGURATION REQUIRED boundary.
 */
export const triggerCampusSecurityCall = () => {
  const phone = safetyConfig.campusSecurityPhone;
  if (!phone) {
    Alert.alert(
      'Campus Security Services',
      'Direct dispatch to University of Ghana Security Services requires a verified security contact configuration. In an immediate life-safety emergency, please dial 112 directly.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 112', style: 'destructive', onPress: triggerNationalEmergencyCall },
      ]
    );
    return;
  }

  Alert.alert(
    'Campus Security Dispatch',
    `Connect to Campus Security dispatch at ${phone}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call Now',
        style: 'default',
        onPress: () => {
          Linking.openURL(`tel:${phone}`).catch(() => {
            Alert.alert('Call Failed', `Unable to dial ${phone}. In an emergency, dial 112.`);
          });
        },
      },
    ]
  );
};

/**
 * Centralized National Emergency 112 Call Trigger
 */
export const triggerNationalEmergencyCall = () => {
  Alert.alert(
    'Emergency Services (112)',
    'Directly dial national emergency services (112)?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call 112',
        style: 'destructive',
        onPress: () => {
          Linking.openURL('tel:112').catch(() => {
            Alert.alert('Call Failed', 'Unable to launch native dialer for 112.');
          });
        },
      },
    ]
  );
};
