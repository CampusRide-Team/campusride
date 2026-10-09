// CampusRide Canonical Design Tokens - Colors
// Implements light and dark palettes for application-level theme support

export const lightColors = {
  // Brand Foundation — Revised White-First Foundation
  brand: {
    primary: '#C89F3E',         // Primary Gold — CTAs, selected options, active indicators
    primaryPressed: '#B38C30',  // Darker Gold for Pressed States
    primaryMuted: '#D9BD7B',    // Soft Gold for Inactive/Disabled Accents
    primaryTint: '#F7F3E9',     // Subtle Gold Surface Tint
    baseBackground: '#FFFFFF',  // Main operational application canvas (pure white)
    introductoryCanvas: '#ECE5D2', // Canonical warm cream canvas for Splash, Onboarding & Intro screens
    operationalCanvas: '#FFFFFF',  // Main operational white-first canvas
    cream: '#ECE5D2',           // Strategic warm cream accent
    onGoldText: '#262626',      // Charcoal text on Primary Gold
  },

  // Surfaces & Layers — Clean continuous white surfaces & neutral tiles
  surface: {
    base: '#FFFFFF',            // Primary card/sheet surface — pure white
    tile: '#F3F3F1',            // Neutral content tiles (Bolt/Yango style)
    elevated: '#FBFAF7',        // Warm elevated alternative
    creamAccent: '#ECE5D2',     // Strategic cream accent
    introductory: '#ECE5D2',    // Warm cream introductory surface
    pressed: '#F0EFEA',         // List Item Pressed Surface
    disabled: '#F3F3F1',        // Disabled Input/Button Surface
    overlay: 'rgba(38, 38, 38, 0.55)', // Modal Backdrop Blur/Tint
  },

  // Borders & Dividers
  border: {
    subtle: '#E8E6E1',          // Subtle Container & Card Border
    focused: '#C89F3E',         // Input Focus Ring / Selected Card Outline — Gold
    divider: '#E8E6E1',         // Subtle List Row Divider
    disabled: '#DCDAD5',        // Disabled Component Outline
  },

  // Typography & Content
  text: {
    primary: '#262626',         // Primary Charcoal Headings, Metrics & Body Titles
    secondary: '#6B665C',       // Descriptive Subtext & Route Labels
    muted: '#9C968A',           // Placeholders, Timestamps & Captions
    disabled: '#B8B3A8',        // Disabled Text
    inverse: '#FFFFFF',         // White Text (strictly on dark/semantic surfaces)
    onGold: '#262626',          // Charcoal on Gold CTA
  },

  // Semantic Signals
  semantic: {
    success: '#3F8A5C',         // Completed Rides, Online State, Green Signals
    successTint: '#E8F5EC',     // Success Badge / Pill Background
    warning: '#C9761F',         // Pending Driver, Radar Matching, Warning Notice
    warningTint: '#FDF3E6',     // Warning Badge / Pill Background
    danger: '#D94235',          // Emergency/SOS, Cancellation — bold red per approved Safety screen
    dangerTint: '#FDE8E6',      // Danger Badge / Pill Background
    info: '#3F708A',            // Proximity Notes, Campus Announcements
    infoTint: '#E6F0F5',        // Info Badge / Pill Background
  },
};

export const darkColors = {
  // Brand Foundation (Warm Gold & Charcoal)
  brand: {
    primary: '#C89F3E',         // Primary Gold remains brand constant
    primaryPressed: '#B38C30',  // Darker Gold for Pressed States
    primaryMuted: '#8E7331',    // Soft Muted Gold
    primaryTint: '#2C2517',     // Warm dark Gold surface tint
    baseBackground: '#141311',  // Deep warm charcoal canvas (not pure blue/black)
    introductoryCanvas: '#141311', // Dark introductory canvas
    operationalCanvas: '#141311',  // Dark operational canvas
    onGoldText: '#1A1815',      // High-contrast dark text on Primary Gold
  },

  // Surfaces & Layers
  surface: {
    base: '#1E1D1A',            // Standard Dark Card & Sheet Surface
    elevated: '#282622',        // Elevated Card Surface
    introductory: '#1E1D1A',    // Dark introductory surface
    pressed: '#33302B',         // List Item Pressed Surface
    disabled: '#23211D',        // Disabled Surface
    overlay: 'rgba(0, 0, 0, 0.75)', // Modal Backdrop
  },

  // Borders & Dividers
  border: {
    subtle: '#38352F',          // Restrained Dark Border
    focused: '#C89F3E',         // Gold Focus Ring
    divider: '#2D2A24',         // Dark Divider
    disabled: '#2E2B25',        // Disabled Outline
  },

  // Typography & Content
  text: {
    primary: '#F5F2EB',         // Warm Off-White Headings & Titles
    secondary: '#B5AFA4',       // Descriptive Subtext & Route Labels
    muted: '#7E786E',           // Placeholders, Timestamps & Captions
    disabled: '#57524A',        // Disabled Text
    inverse: '#1A1815',         // Dark text on bright surfaces
    onGold: '#1A1815',          // High-contrast on Gold CTA
  },

  // Semantic Signals (Tailored for high contrast on dark surfaces)
  semantic: {
    success: '#4E9E6E',         // Green Signal
    successTint: '#172E20',     // Dark Success Pill Background
    warning: '#D98932',         // Warning Notice
    warningTint: '#332313',     // Dark Warning Pill Background
    danger: '#D94235',          // Cancellation, SOS Alerts
    dangerTint: '#381C19',      // Dark Danger Pill Background
    info: '#528CA8',            // Proximity Notes
    infoTint: '#162833',        // Dark Info Pill Background
  },
};

export const colors = lightColors;

export const getThemeColors = (isDark) => (isDark ? darkColors : lightColors);

export default colors;
