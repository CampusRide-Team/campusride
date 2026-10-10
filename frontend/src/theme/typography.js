import { Platform } from 'react-native';

// CampusRide Typography Tokens - Powered by Manrope
const manrope = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
  // Sibling casing aliases
  semibold: 'Manrope_600SemiBold',
  extrabold: 'Manrope_800ExtraBold',
  mono: Platform.OS === 'ios' ? 'Courier' : 'monospace',
};

export const fonts = {
  ...manrope,
  manrope,
};

export const typography = {
  // Font Family Mapping
  fontFamily: fonts,
  fonts,

  // Font Sizes
  size: {
    display: 28,      // Hero Onboarding Headlines & Splash Reveal
    titleLarge: 24,   // Screen headers and primary metrics
    titleMedium: 20,  // Bottom Sheet Headings & Modal Titles
    titleSmall: 17,   // Card Titles & Campus POI Landmark Names
    bodyLarge: 16,    // Form Input Values & Primary Body Content
    bodyRegular: 15,  // Subtitles, Addresses & Descriptive Text
    bodySmall: 14,    // Secondary Metadata, Sub-labels & Vehicle Specs
    caption: 13,      // Badges, Status Pills & ETA Chips
    tiny: 11,         // Micro Disclaimers & Capacity Counts

    // Workspace Aliases
    h1: 26,
    h2: 22,
    h3: 19,
    body: 15,
    bodyMedium: 15,
  },

  // Font Weights (Numeric fallbacks for system font rendering)
  weight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    semibold: '600',
    extrabold: '800',
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    semibold: '600',
    extrabold: '800',
  },

  // Line Heights
  lineHeight: {
    display: 34,
    titleLarge: 30,
    titleMedium: 26,
    titleSmall: 23,
    bodyLarge: 23,
    bodyRegular: 21,
    bodySmall: 20,
    caption: 18,
    tiny: 15,
  },

  // Letter Spacing (Optimized for Manrope on mobile viewports)
  letterSpacing: {
    tighter: -0.5,
    tight: -0.2,
    normal: 0,
    wide: 0.3,
    wider: 0.6,
    mono: 1.2, // License plate badges & OTP codes
  },
};

export default typography;
