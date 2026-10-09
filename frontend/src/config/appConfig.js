// frontend/src/config/appConfig.js
import appJson from '../../app.json';

/**
 * Centralized Application Metadata Configuration
 * 
 * NOTE: Support email is strictly sourced from EXPO_PUBLIC_SUPPORT_EMAIL.
 * If unconfigured, the application presents a truthful unconfigured state without inventing dummy addresses.
 */
export const appConfig = {
  appName: 'CampusRide UG',
  version: appJson?.expo?.version || '1.0.0',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || null,
  termsUrl: 'https://campusride.ug/terms',
  privacyUrl: 'https://campusride.ug/privacy',
};

export default appConfig;