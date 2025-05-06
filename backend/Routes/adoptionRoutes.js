const express = require("express");
const router = express.Router();
const Adoption = require("../Models/adoptionModels");
const Pet = require("../Models/petModels");
const User = require("../Models/userModels");
const { verifyToken } = require("../Utilities/authUtil");

// Create a new adoption request
router.post("/", verifyToken, async (req, res) => {
  try {
    const { petId, message } = req.body;
    const userId = req.user.id;

    // Check if pet exists and is available
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    if (pet.adoptionStatus !== "available") {
      return res.status(400).json({
        success: false,
        message: "This pet is not available for adoption",
      });
    }

    // Check if user already has a pending request for this pet
    const existingRequest = await Adoption.findOne({
      pet: petId,
      user: userId,
      status: "Pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending request for this pet",
      });
    }

    // Create new adoption request
    const newAdoption = new Adoption({
      pet: petId,
      user: userId,
      message,
    });

    await newAdoption.save();

    // Update pet status to pending
    pet.adoptionStatus = "pending";
    await pet.save();

    res.status(201).json({
      success: true,
      message: "Adoption request submitted successfully",
      adoption: newAdoption,
    });
  } catch (error) {
    console.error("Error creating adoption request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit adoption request",
    });
  }
});

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

// Update adoption status
router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminMessage } = req.body;

    // In a real app, you would check if the user is an admin here
    // For now, we'll allow any authenticated user to update status

    const adoption = await Adoption.findById(id);
    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    // Update adoption status
    adoption.status = status;
    if (adminMessage) {
      adoption.adminMessage = adminMessage;
    }

    await adoption.save();

    // Update pet status based on adoption status
    const pet = await Pet.findById(adoption.pet);
    if (pet) {
      if (status === "Approved") {
        pet.adoptionStatus = "pending";
      } else if (status === "Completed") {
        pet.adoptionStatus = "adopted";
        pet.owner = adoption.user;
      } else if (status === "Rejected") {
        pet.adoptionStatus = "available";
      }
      await pet.save();
    }

    res.status(200).json({
      success: true,
      message: `Adoption request ${status.toLowerCase()} successfully`,
      adoption,
    });
  } catch (error) {
    console.error("Error updating adoption status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update adoption status",
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
