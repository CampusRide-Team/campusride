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
} from "../controllers/driverController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Authentication & Role Authorization Guard Layer
router.use(protect);
router.use(requireRole("driver"));

// GET Endpoint Routes
router.get("/analytics", getDriverAnalytics);
router.get("/earnings", getDriverEarnings);
router.get("/notifications", getDriverNotifications);
router.get("/pending-requests", getPendingCampusRequests);
router.get("/profile", getDriverProfile);

// PUT Endpoint Routes
router.put("/profile", upload.single("avatar"), updateDriverProfile);

// PATCH Endpoint Routes
router.patch("/notifications/:id/read", markNotificationAsRead);
router.patch("/profile/preferences", updateDriverPreferences);

export default router;