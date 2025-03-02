const express = require("express");
const userController = require("../Controllers/userController");
const { authenticateToken } = require("../Utilities/authUtil");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = "uploads/";
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload an image."), false);
    }
  },
});

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

router.post(
  "/upload-profile-picture",
  authenticateToken,
  upload.single("file"),
  userController.uploadProfilePicture
);

module.exports = router;
