const express = require("express");
const router = express.Router();
const adoptionController = require("../Controllers/adoptionController");
const { verifyToken, verifyAdmin } = require("../Utilities/authUtil");
const Adoption = require("../Models/adoptionModels");

// User or guest can submit adoption request
router.post("/", adoptionController.createAdoption);

// Check adoption status for a pet and user
router.get("/check-status", adoptionController.checkAdoptionStatus);

// Check pet availability (public route)
router.get(
  "/check-availability/:petId",
  adoptionController.checkPetAvailability
);

// ✅ Get all adoption requests for a user (Enhanced version with better error handling)
router.get("/my", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log("🔍 Fetching adoptions for user:", {
      userId,
      userEmail,
      timestamp: new Date().toISOString(),
    });

    // Validate user data
    if (!userId) {
      console.error("❌ No user ID found in request");
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Find adoptions by user ID OR email (for guest adoptions)
    const adoptions = await Adoption.find({
      $or: [{ user: userId }, { email: userEmail }],
      isArchived: { $ne: true }, // Exclude archived adoptions
    })
      .populate({
        path: "pet",
        select: "name type breed images age gender description adoptionStatus",
      })
      .populate({
        path: "user",
        select: "fullname email profilePicture",
      })
      .sort({ createdAt: -1 });

    console.log("📊 Found adoptions:", {
      count: adoptions.length,
      adoptions: adoptions.map((a) => ({
        id: a._id,
        petId: a.pet?._id,
        petName: a.pet?.name,
        status: a.status,
        userId: a.user?._id,
        email: a.email,
      })),
    });

    res.status(200).json({
      success: true,
      count: adoptions.length,
      adoptions,
    });
  } catch (error) {
    console.error("❌ Error fetching user adoptions:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch adoption requests",
      error: error.message,
    });
  }
});

// Alternative endpoint for user adoptions (fallback)
router.get("/user", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log("🔄 Alternative endpoint - Fetching adoptions for:", {
      userId,
      userEmail,
    });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const adoptions = await Adoption.find({
      $or: [{ user: userId }, { email: userEmail }],
      isArchived: { $ne: true },
    })
      .populate("pet")
      .populate("user", "fullname email profilePicture")
      .sort({ createdAt: -1 });

    console.log(
      "✅ Alternative endpoint - Found:",
      adoptions.length,
      "adoptions"
    );

    res.status(200).json({
      success: true,
      count: adoptions.length,
      adoptions,
    });
  } catch (error) {
    console.error("❌ Error in alternative endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch adoption requests",
      error: error.message,
    });
  }
});

// Get all adoption requests (admin only)
router.get("/all", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const adoptions = await Adoption.find({})
      .populate("pet", "name type breed images")
      .populate("user", "fullname email profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: adoptions.length,
      adoptions,
    });
  } catch (error) {
    console.error("Error fetching all adoptions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch adoption requests",
    });
  }
});

// Get a specific adoption request
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const adoption = await Adoption.findById(id)
      .populate("pet")
      .populate("user", "fullname email profilePicture");

    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    res.status(200).json({
      success: true,
      adoption,
    });
  } catch (error) {
    console.error("Error fetching adoption details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch adoption details",
    });
  }
});

module.exports = router;
