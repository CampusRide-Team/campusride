// CampusRide Elevation & Warm Shadow Tokens
export const elevation = {
  level0: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  level1: { // Subtle Card Elevation
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  level2: { // Floating Search Bar & Map Controls
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  level3: { // Bottom Sheets & Floating Cards
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  level4: { // High-Urgency Driver Offer Modal / Critical Dialogs
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 16,
  },
};

export default elevation;
