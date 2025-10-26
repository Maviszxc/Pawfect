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
    const { userId } = req.query;

    // Build query - if userId is provided, filter by it
    let query = {};
    if (userId) {
      query = {
        $or: [
          { user: userId },
          // Also match by email if the adoption was made as guest
          // We'll need to fetch the user's email first
        ],
      };

      // If userId is provided, also try to match guest adoptions by email
      try {
        const User = require("../Models/userModels");
        const user = await User.findById(userId);
        if (user && user.email) {
          query.$or.push({ email: user.email });
        }
      } catch (err) {
        console.error("Error fetching user for email match:", err);
      }
    }

    const adoptions = await Adoption.find(query)
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

// ✅ Cancel/Withdraw adoption (user can cancel their own pending application)
// IMPORTANT: This route must be BEFORE the generic /:id route
router.delete("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log(`🔄 User ${userId} attempting to cancel adoption ${id}`);

    // Find the adoption
    const adoption = await Adoption.findById(id).populate("pet", "name adoptionStatus");

    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    // Verify the user owns this adoption (either by user ID or email for guest adoptions)
    const isOwner = 
      (adoption.user && adoption.user.toString() === userId) || 
      (adoption.email && adoption.email === userEmail);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this adoption request",
      });
    }

    // Only allow cancellation of Under Review applications
    if (adoption.status !== "Under Review") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel adoption with status: ${adoption.status}. Only Under Review applications can be cancelled.`,
      });
    }

    // Delete the adoption
    await Adoption.findByIdAndDelete(id);

    // Check if there are other approved adoptions for this pet
    if (adoption.pet) {
      const Pet = require("../Models/petModels");
      const Adoption = require("../Models/adoptionModels");
      
      const approvedAdoption = await Adoption.findOne({
        pet: adoption.pet._id,
        status: "Approved",
      });

      if (approvedAdoption) {
        // Keep pet as Pending with the approved adopter's name
        const adopterName = approvedAdoption.user?.fullname || approvedAdoption.fullname;
        await Pet.findByIdAndUpdate(adoption.pet._id, {
          adoptionStatus: "Pending",
          currentAdopterName: adopterName,
          currentAdoptionId: approvedAdoption._id,
        });
        console.log(`✅ Pet ${adoption.pet.name} remains Pending (by ${adopterName})`);
      } else {
        // No approved adoptions, pet becomes Available
        await Pet.findByIdAndUpdate(adoption.pet._id, {
          adoptionStatus: "Available",
          currentAdopterName: "",
          currentAdoptionId: null,
        });
        console.log(`✅ Pet ${adoption.pet.name} reverted to Available status`);
      }
    }

    console.log(`✅ Adoption ${id} cancelled successfully`);

    res.status(200).json({
      success: true,
      message: "Adoption application cancelled successfully",
    });
  } catch (error) {
    console.error("❌ Error cancelling adoption:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel adoption request",
      error: error.message,
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

// ✅ Update adoption status (admin only) - Use controller function with pet synchronization
router.patch("/:id/status", verifyToken, verifyAdmin, adoptionController.updateAdoptionStatus);

module.exports = router;
