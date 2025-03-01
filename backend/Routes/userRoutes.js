const express = require("express");
const userController = require("../Controllers/userController");
const { authenticateToken } = require("../Utilities/authUtil");

const router = express.Router();

router.post("/createAccount", userController.createAccount);
router.post("/login", userController.login);

router.post("/verify-otp", userController.verifyOtp);
router.post("/send-otp", userController.sendOtp);
router.post("/resend-otp", userController.resendOtp);
router.post("/send-otp-for-email", userController.sendOtpForEmail);
router.post("/send-otp-for-password", userController.sendOtpForPassword);
router.post("/reset-password", userController.resetPassword); 
router.get("/check-verified", userController.checkVerified);

// Protect the dashboard route
router.get("/dashboard", authenticateToken, userController.getDashboard);
router.get("/get-users", authenticateToken, userController.getUsers);
router.get("/current-user", authenticateToken, userController.getCurrentUser);
router.put("/update-user", authenticateToken, userController.updateUser);
router.delete(
  "/delete-account",
  authenticateToken,
  userController.deleteAccount
);

module.exports = router;
