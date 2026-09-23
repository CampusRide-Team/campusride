// CampusRide Typography Tokens - Powered by Manrope
export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
};

export const typography = {
  // Font Family Mapping
  fontFamily: fonts,

  // Font Sizes
  size: {
    display: 28,      // Hero Onboarding Headlines & Splash Reveal
    titleLarge: 22,   // Screen Headers, Total Fares & Primary Metrics
    titleMedium: 18,  // Bottom Sheet Headings & Modal Titles
    titleSmall: 16,   // Card Titles & Campus POI Landmark Names
    bodyLarge: 15,    // Form Input Values & Primary Body Content
    bodyRegular: 14,  // Subtitles, Addresses & Descriptive Text
    bodySmall: 13,    // Secondary Metadata, Sub-labels & Vehicle Specs
    caption: 12,      // Badges, Status Pills & ETA Chips
    tiny: 10,         // Micro Disclaimers & Capacity Counts
  },

  // Font Weights (Numeric fallbacks for system font rendering)
  weight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },

  // Line Heights
  lineHeight: {
    display: 34,
    titleLarge: 28,
    titleMedium: 24,
    titleSmall: 22,
    bodyLarge: 22,
    bodyRegular: 20,
    bodySmall: 18,
    caption: 16,
    tiny: 14,
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
