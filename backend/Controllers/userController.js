const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../Models/userModels");
const OtpVerification = require("../Models/otpVerificationModels");
const cloudinary = require("../Utilities/cloudinaryConfig");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer Error:", error);
  } else {
    console.log("✅ Nodemailer is ready");
  }
});

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "fullname email createdOn");
    return res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const createAccount = async (req, res) => {
  const { fullname, email, password } = req.body;

  if (!fullname || !email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: true, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ fullname, email, password: hashedPassword });
    await user.save();

    await sendOtp({ _id: user._id, email }); // Ensure email is passed correctly

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "36000m" }
    );

    return res.json({
      error: false,
      user,
      accessToken,
      message: "OTP sent to your email.",
    });
  } catch (error) {
    console.error("Error in createAccount:", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

const sendOtp = async ({ _id, email }) => {
  try {
    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedOtp = await bcrypt.hash(otp, 10);
    const newOtpVerification = new OtpVerification({
      userId: _id,
      userEmail: email, // Ensure this field is correctly set
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    await newOtpVerification.save();

    await transporter.sendMail({
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verification Code",
      text: `Your verification code is: ${otp} This code is valid for 1 hour. Use this code to verify your account.`,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!otp || !email) {
    return res
      .status(400)
      .json({ success: false, message: "OTP and email are required" });
  }

  try {
    const otpRecord = await OtpVerification.findOne({ userEmail: email });
    if (!otpRecord) {
      console.log("No OTP record found for email:", email);
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP or email" });
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isOtpValid) {
      console.log("Invalid OTP for email:", email);
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (otpRecord.expiresAt < Date.now()) {
      console.log("OTP expired for email:", email);
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    await User.updateOne({ email }, { verified: true });
    await OtpVerification.deleteOne({ userEmail: email });

    return res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: true, message: "User not found" });
    }

    await OtpVerification.deleteOne({ userEmail: email });

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedOtp = await bcrypt.hash(otp, 10);

    const newOtpVerification = new OtpVerification({
      userEmail: email,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    await newOtpVerification.save();

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: user.email,
      subject: "New Verification Code",
      text: `Your new verification code is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "A new OTP has been sent to your email",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res
      .status(500)
      .json({ error: true, message: "Server error during OTP resend" });
  }
};

const checkVerified = async (req, res) => {
  const { email } = req.query;

  try {
    const userInfo = await User.findOne({ email });

    if (!userInfo) {
      return res.status(400).json({ error: true, message: "User not found" });
    }

    if (userInfo.verified) {
      return res.json({ success: true, message: "User is verified" });
    } else {
      return res.json({ success: false, message: "User is not verified" });
    }
  } catch (error) {
    console.error("Verification check error:", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "Email and password are required" });
  }

  try {
    const userInfo = await User.findOne({ email });

    if (!userInfo) {
      return res.status(400).json({ error: true, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, userInfo.password);

    if (!isMatch) {
      return res.status(400).json({ error: true, message: "Invalid password" });
    }

    const accessToken = jwt.sign(
      { userId: userInfo._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "36000m" }
    );

    return res.json({
      error: false,
      message: "Login successful",
      email,
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(400).json({ error: true, message: "User not found" });
    }
    res.json({ error: false, message: "Welcome to the dashboard", user });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  const { fullname, email, password, otp } = req.body;

  if (!fullname && !email && !password) {
    return res
      .status(400)
      .json({ error: true, message: "At least one field is required" });
  }

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(400).json({ error: true, message: "User not found" });
    }

    if (fullname) user.fullname = fullname;

    if (email || password) {
      if (!otp) {
        return res
          .status(400)
          .json({ error: true, message: "OTP is required" });
      }

      const otpRecord = await OtpVerification.findOne({
        userEmail: user.email,
      });
      if (!otpRecord) {
        return res
          .status(400)
          .json({ error: true, message: "Invalid OTP or email" });
      }

      const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
      if (!isOtpValid) {
        return res.status(400).json({ error: true, message: "Invalid OTP" });
      }

      if (otpRecord.expiresAt < Date.now()) {
        return res
          .status(400)
          .json({ error: true, message: "OTP has expired" });
      }

      await OtpVerification.deleteOne({ userEmail: user.email });

      if (email) user.email = email;
      if (password) user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(400).json({ error: true, message: "User not found" });
    }

    await User.deleteOne({ _id: req.user.userId });

    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(
      req.user.userId,
      "fullname email profilePicture"
    );
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }
    console.log(
      "Returning user with profile picture:",
      user.profilePicture ? "Yes" : "No"
    );
    return res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ error: true, message: "Server error" });
  }
};

const sendOtpForEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    await OtpVerification.deleteOne({ userEmail: email });

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedOtp = await bcrypt.hash(otp, 10);

    const newOtpVerification = new OtpVerification({
      userEmail: email,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour from now
    });

    await newOtpVerification.save();

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: user.email,
      subject: "Email Update Verification Code",
      text: `Your verification code for updating your email is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error sending OTP for email:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const sendOtpForPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    await OtpVerification.deleteOne({ userEmail: email });

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedOtp = await bcrypt.hash(otp, 10);

    const newOtpVerification = new OtpVerification({
      userEmail: email,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour from now
    });

    await newOtpVerification.save();

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: user.email,
      subject: "Password Update Verification Code",
      text: `Your verification code for updating your password is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error sending OTP for password:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  console.log("Received data:", { email, otp, newPassword }); 

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Email, OTP, and new password are required",
    });
  }

  try {
    const otpRecord = await OtpVerification.findOne({ userEmail: email });
    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP or email" });
    }

    const isOtpValid = bcrypt.compare(otp, otpRecord.otp);
    if (!isOtpValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (otpRecord.expiresAt < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    await OtpVerification.deleteOne({ userEmail: email });

    const user = await User.findOne({ email });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const fileData = fs.readFileSync(req.file.path);
    const base64Image = `data:${req.file.mimetype};base64,${fileData.toString(
      "base64"
    )}`;
    console.log("Base64 image created:", base64Image.substring(0, 50) + "...");

    user.profilePicture = base64Image;
    await user.save();

    console.log("User saved with profile picture");

    fs.unlinkSync(req.file.path);

    return res.json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: base64Image,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);

    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createAccount,
  sendOtp,
  verifyOtp,
  resendOtp,
  checkVerified,
  login,
  getDashboard,
  updateUser,
  deleteAccount,
  getUsers,
  getCurrentUser,
  sendOtpForPassword,
  sendOtpForEmail,
  resetPassword,
  uploadProfilePicture,
};