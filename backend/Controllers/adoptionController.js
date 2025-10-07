const Adoption = require("../Models/adoptionModels");
const Pet = require("../Models/petModels");
const User = require("../Models/userModels");

exports.createAdoption = async (req, res) => {
  try {
    const { pet, message, fullname, email, phone, address, profilePicture } =
      req.body;

    if (!pet || !fullname || !email || !phone || !address || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Check if pet exists
    const petDoc = await Pet.findById(pet);
    if (!petDoc) {
      return res.status(404).json({
        success: false,
        message: "Pet not found.",
      });
    }

    // Check for existing adoption request for this pet by this email
    const existingAdoption = await Adoption.findOne({
      pet: pet,
      email: email,
      status: { $in: ["Pending", "Approved"] }, // Check for pending or approved applications
    });

    if (existingAdoption) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted an adoption request for this pet. Please wait for the admin to review your application.",
        existingApplication: {
          status: existingAdoption.status,
          submittedAt: existingAdoption.createdAt,
        },
      });
    }

    // If user is logged in, associate user
    let userId = null;
    if (req.user && req.user._id) {
      userId = req.user._id;

      // Also check by user ID if logged in
      const existingUserAdoption = await Adoption.findOne({
        pet: pet,
        user: userId,
        status: { $in: ["Pending", "Approved"] },
      });

      if (existingUserAdoption) {
        return res.status(400).json({
          success: false,
          message: "You have already submitted an adoption request for this pet. Please wait for the admin to review your application.",
          existingApplication: {
            status: existingUserAdoption.status,
            submittedAt: existingUserAdoption.createdAt,
          },
        });
      }
    }

    // Create new adoption request
    const adoption = new Adoption({
      pet,
      user: userId || undefined,
      status: "Pending",
      fullname,
      email,
      phone,
      address,
      message,
      adminMessage: "",
      profilePicture: profilePicture || "",
    });

    await adoption.save();

    res.status(201).json({
      success: true,
      message: "Adoption request submitted successfully.",
      adoption,
    });
  } catch (error) {
    console.error("Adoption request error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting adoption request.",
      error: error.message,
    });
  }
};

// Check if user has already applied for a specific pet
exports.checkExistingApplication = async (req, res) => {
  try {
    const { petId, email } = req.query;

    if (!petId || !email) {
      return res.status(400).json({
        success: false,
        message: "Pet ID and email are required.",
      });
    }

    const existingAdoption = await Adoption.findOne({
      pet: petId,
      email: email,
      status: { $in: ["Pending", "Approved"] },
    });

    if (existingAdoption) {
      return res.status(200).json({
        success: true,
        hasApplication: true,
        application: {
          status: existingAdoption.status,
          submittedAt: existingAdoption.createdAt,
          message: "You have already submitted an application for this pet.",
        },
      });
    }

    res.status(200).json({
      success: true,
      hasApplication: false,
    });
  } catch (error) {
    console.error("Error checking existing application:", error);
    res.status(500).json({
      success: false,
      message: "Error checking application status.",
    });
  }
};