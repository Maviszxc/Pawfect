/** @format */

const jwt = require("jsonwebtoken");
const User = require("../Models/userModels");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: true, message: "Unauthorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err)
      return res.status(401).json({ error: true, message: "Invalid token" });

    try {
      // Fetch complete user data from database
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          error: true,
          message: "User not found",
        });
      }

      // Attach complete user info to request
      req.user = {
        id: user._id.toString(),
        email: user.email,
        fullname: user.fullname,
        isAdmin: user.isAdmin,
      };

      console.log("✅ User authenticated:", {
        id: req.user.id,
        email: req.user.email,
      });

      next();
    } catch (error) {
      console.error("❌ Error fetching user:", error);
      return res.status(500).json({
        error: true,
        message: "Server error during authentication",
      });
    }
  });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: true, message: "Unauthorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err)
      return res.status(401).json({ error: true, message: "Invalid token" });

    try {
      // Fetch complete user data from database
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          error: true,
          message: "User not found",
        });
      }

      // Attach complete user info to request
      req.user = {
        id: user._id.toString(),
        email: user.email,
        fullname: user.fullname,
        isAdmin: user.isAdmin,
      };

      console.log("✅ User verified:", {
        id: req.user.id,
        email: req.user.email,
      });

      next();
    } catch (error) {
      console.error("❌ Error fetching user:", error);
      return res.status(500).json({
        error: true,
        message: "Server error during authentication",
      });
    }
  });
}

function verifyAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: true,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
}

module.exports = { authenticateToken, verifyToken, verifyAdmin };
