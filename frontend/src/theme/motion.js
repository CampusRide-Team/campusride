// CampusRide Motion & Animation Tokens
export const motion = {
  duration: {
    instant: 150,   // Button tap & toggle feedback
    standard: 250,  // Sheet snap transitions & accordions
    deliberate: 400,// Screen slide transitions & modal entry
    radarPulse: 1800,// Continuous matching radar wave loop
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    spring: { damping: 20, mass: 1, stiffness: 180 },
  },
};

export default motion;
