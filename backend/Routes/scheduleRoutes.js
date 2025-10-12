const express = require("express");
const router = express.Router();
const scheduleController = require("../Controllers/scheduleController");
const { verifyToken, verifyAdmin } = require("../Utilities/authUtil");

// Admin only routes
router.post("/", verifyToken, verifyAdmin, scheduleController.createSchedule);
router.get(
  "/admin",
  verifyToken,
  verifyAdmin,
  scheduleController.getAllSchedules
);
router.patch(
  "/:scheduleId/start",
  verifyToken,
  verifyAdmin,
  scheduleController.startLiveStream
);
router.patch(
  "/:scheduleId/complete",
  verifyToken,
  verifyAdmin,
  scheduleController.completeLiveStream
);
router.delete(
  "/:scheduleId",
  verifyToken,
  verifyAdmin,
  scheduleController.deleteSchedule
);

// Public routes (for users to see upcoming schedules)
router.get("/upcoming", scheduleController.getUpcomingSchedules);

module.exports = router;
