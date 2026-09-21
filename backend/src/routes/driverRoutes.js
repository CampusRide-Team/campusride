import express from "express";
import {
  getDriverAnalytics,
  getDriverEarnings,
  getDriverNotifications,
  getDriverProfile,
  getPendingCampusRequests,
  markNotificationAsRead,
  updateDriverPreferences,
  updateDriverProfile,
  updateDriverLocation,
  updateDriverTelemetry,
  getActiveDriverLocations
} from "../controllers/driverController.js";
import { acceptRide } from "../controllers/rideController.js";
import { protect, requireApprovedDriver, requireRole } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// --- Public / Passenger Accessible Endpoints ---
router.get("/active-locations", getActiveDriverLocations);

// --- Driver Specific Endpoints (Protected) ---
router.put("/location", protect, requireApprovedDriver, updateDriverLocation);
router.put("/availability", protect, requireApprovedDriver, updateDriverLocation);
router.put("/telemetry", protect, requireApprovedDriver, updateDriverTelemetry);

// Legacy Accept Ride Aliases
router.put("/:id/accept", protect, requireRole("driver"), acceptRide);
router.put("/accept/:id", protect, requireRole("driver"), acceptRide);

router.get("/analytics", protect, requireRole("driver"), getDriverAnalytics);
router.get("/earnings", protect, requireRole("driver"), getDriverEarnings);
router.get("/notifications", protect, requireRole("driver"), getDriverNotifications);
router.get("/pending-requests", protect, requireRole("driver"), getPendingCampusRequests);
router.get("/profile", protect, requireRole("driver"), getDriverProfile);
router.put("/profile", protect, requireRole("driver"), upload.single("avatar"), updateDriverProfile);
router.patch("/notifications/:id/read", protect, requireRole("driver"), markNotificationAsRead);
router.patch("/profile/preferences", protect, requireRole("driver"), updateDriverPreferences);

export default router;