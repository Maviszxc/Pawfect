const express = require("express");
const router = express.Router();
const adoptionController = require("../Controllers/adoptionController");
const { verifyToken, verifyAdmin } = require("../Utilities/authUtil");
const Adoption = require("../Models/adoptionModels"); // ✅ fix added


// User or guest can submit adoption request
router.post("/", adoptionController.createAdoption);

// Get all adoption requests for a user
router.get("/user", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const adoptions = await Adoption.find({ user: userId })
      .populate("pet")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      adoptions,
    });
  } catch (error) {
    console.error("Error fetching user adoptions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch adoption requests",
    });
  }
});

// Get all adoption requests (admin only)
router.get("/all", verifyToken, async (req, res) => {
  try {
    // In a real app, you would check if the user is an admin here
    // For now, we'll allow any authenticated user to access this endpoint

    const adoptions = await Adoption.find({})
      .populate("pet", "name type breed image")
      .populate("user", "fullname email profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
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

    // Check if the user is the owner of the request or an admin
    // In a real app, you would implement proper authorization here

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

    // Check if the user is the owner of the request or an admin
    // In a real app, you would implement proper authorization here

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
