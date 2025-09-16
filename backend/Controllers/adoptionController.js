const Adoption = require("../Models/adoptionModels");
const Pet = require("../Models/petModels");
const User = require("../Models/userModels");

// Create adoption request (user or guest)
exports.createAdoption = async (req, res) => {
  try {
    const { pet, message, fullname, email, phone, address } = req.body;

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

    // If user is logged in, associate user
    let userId = null;
    if (req.user && req.user._id) {
      userId = req.user._id;
    }

    // Save fields separately
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
    });

    await adoption.save();

    res.status(201).json({
      success: true,
      message: "Adoption request submitted successfully.",
      adoption,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Adoption request error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting adoption request.",
      error: error.message,
    });
  }
};
