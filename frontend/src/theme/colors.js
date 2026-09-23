// CampusRide Canonical Design Tokens - Colors
export const colors = {
  // Brand Foundation
  brand: {
    primary: '#C89F3E',         // Primary Gold (Buttons, Active States, Highlights)
    primaryPressed: '#B38C30',  // Darker Gold for Pressed States
    primaryMuted: '#E5CCA0',    // Soft Gold for Inactive/Disabled Accents
    primaryTint: '#F8F3E6',     // Subtle Gold Surface Tint
    baseBackground: '#ECE5D2',  // Canonical Campus Background Canvas
    onGoldText: '#1A1815',      // High-contrast text on Primary Gold
  },

  // Surfaces & Layers
  surface: {
    base: '#FFFFFF',            // Standard Card & Bottom Sheet Background
    elevated: '#FBFAF7',        // Secondary / Elevated Surface Card
    pressed: '#F4EFE6',         // List Item Pressed Surface
    disabled: '#EAE6DC',        // Disabled Input/Button Surface
    overlay: 'rgba(26, 24, 21, 0.55)', // Modal Backdrop Blur/Tint
  },

  // Borders & Dividers
  border: {
    subtle: '#D8D2C3',          // Standard Container & Card Border
    focused: '#C89F3E',         // Input Focus Ring / Selected Card Outline
    divider: '#E4DFD3',         // Subtle List Row Divider
    disabled: '#CDC8BC',        // Disabled Component Outline
  },

  // Typography & Content
  text: {
    primary: '#1A1815',         // Primary Headings, Metrics & Body Titles
    secondary: '#6B665C',       // Descriptive Subtext & Route Labels
    muted: '#9C968A',           // Placeholders, Timestamps & Captions
    disabled: '#B8B3A8',        // Disabled Text
    inverse: '#FFFFFF',         // White Text (strictly on dark/semantic surfaces)
    onGold: '#1A1815',          // High-contrast on Gold CTA
  },

  // Semantic Signals
  semantic: {
    success: '#3F8A5C',         // Completed Rides, Online State, Green Signals
    successTint: '#E3F0E7',     // Success Badge / Pill Background
    warning: '#C9761F',         // Pending Driver, Radar Matching, Warning Notice
    warningTint: '#F7E9D9',     // Warning Badge / Pill Background
    danger: '#B23A2F',          // Cancellation, SOS Alerts, Error Validation
    dangerTint: '#F3E0DD',      // Danger Badge / Pill Background
    info: '#3F708A',            // Proximity Notes, Campus Announcements
    infoTint: '#E1EBEF',        // Info Badge / Pill Background
  },
};

export default colors;
