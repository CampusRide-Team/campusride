export const SUPPORT_CONFIG = {
  phoneNumber: "+1234567890", // Feel free to replace with your campus support phone
  email: "support@campusride.edu",
  officeLocation: "Campus Student Center, Room 101",
  faqs: [
    {
      question: "How do I accept a ride request?",
      answer: "Go to the Active Rides tab, switch your status to Active, and tap 'Accept' when a request sounds."
    },
    {
      question: "Who do I contact in an emergency?",
      answer: "Use the emergency SOS button on the map, or call campus security directly at our hotline."
    },
    {
      question: "My app GPS is showing the wrong location.",
      answer: "Check that your phone's location services are set to 'Always Allow' for CampusRide."
    }
  ]
};

const appConfig = {
  SUPPORT_CONFIG,
};

export default appConfig;