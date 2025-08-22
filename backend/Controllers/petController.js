const Pet = require("../Models/petModels");
const cloudinary = require("../Utilities/cloudinaryConfig");
const fs = require("fs");

// Get all pets (including archived for admin)
exports.getAllPets = async (req, res) => {
  try {
    // Since this route is public, we don't have req.user
    // Just show non-archived pets to everyone
    const filter = { isArchived: false };

    const pets = await Pet.find(filter);
    res.status(200).json({
      success: true,
      count: pets.length,
      pets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pets",
      error: error.message,
    });
  }
};

// Get pet by ID
exports.getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }
    res.status(200).json({
      success: true,
      pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pet",
      error: error.message,
    });
  }
};

// Create new pet with image and optional video
exports.createPet = async (req, res) => {
  try {
    const { name, type, breed, age, gender, description, adoptionStatus } =
      req.body;

    // Validate required fields
    if (!name || !type || !breed || !age || !gender || !description) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Pet image is required",
      });
    }

    // Get the image path
    const imagePath = req.file.path.replace(/\\/g, "/"); // Normalize path for all OS
    const imageUrl = `${req.protocol}://${req.get("host")}/${imagePath}`;

    // Create new pet with image
    const newPet = new Pet({
      name,
      type,
      breed,
      age,
      gender,
      images: [imageUrl], // Convert single image to array for model compatibility
      description,
      adoptionStatus: adoptionStatus || "Available",
    });

    const savedPet = await newPet.save();
    res.status(201).json({
      success: true,
      message: "Pet created successfully",
      pet: savedPet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating pet",
      error: error.message,
    });
  }
};

// Update pet
exports.updatePet = async (req, res) => {
  try {
    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedPet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pet updated successfully",
      pet: updatedPet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating pet",
      error: error.message,
    });
  }
};

// Archive pet (soft delete)
exports.archivePet = async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, adoptionStatus: "archived" },
      { new: true }
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pet archived successfully",
      pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error archiving pet",
      error: error.message,
    });
  }
};

// Restore archived pet
exports.restorePet = async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { isArchived: false, adoptionStatus: "available" },
      { new: true }
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pet restored successfully",
      pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error restoring pet",
      error: error.message,
    });
  }
};

// Filter pets
exports.filterPets = async (req, res) => {
  try {
    const { type, gender, breed, ageMin, ageMax, searchQuery, status } =
      req.query;
    const filter = {};

    // Add filters if they exist
    if (type && type !== "all") filter.type = type;
    if (gender && gender !== "all") filter.gender = gender;
    if (breed && breed !== "all") filter.breed = breed;
    if (status && status !== "all") filter.adoptionStatus = status;

    // Always filter out archived pets for public routes
    filter.isArchived = false;

    // Age range filter
    if (ageMin !== undefined || ageMax !== undefined) {
      filter.age = {};
      if (ageMin !== undefined) filter.age.$gte = parseInt(ageMin);
      if (ageMax !== undefined) filter.age.$lte = parseInt(ageMax);
    }

    // Search query filter (name, breed, or description)
    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { breed: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
      ];
    }

    const pets = await Pet.find(filter);
    res.status(200).json({
      success: true,
      count: pets.length,
      pets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error filtering pets",
      error: error.message,
    });
  }
};

// Delete pet (hard delete)
exports.deletePet = async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pet deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting pet",
      error: error.message,
    });
  }
};

// Match pets based on user preferences
exports.matchPets = async (req, res) => {
  try {
    const { type, activityLevel, timeAvailable, temperament, otherPets } = req.query;
    const filter = { isArchived: false, adoptionStatus: "available" };
    const conditions = [];

    // Apply filters based on user preferences
    if (type && type !== "all") {
      // Make the type case-insensitive
      filter.type = { $regex: new RegExp("^" + type + "$", "i") };
    }
    
    // Map activity level to age filters
    if (activityLevel === "low") {
      filter.age = { $gte: 3 }; // Older, calmer pets
    } else if (activityLevel === "high") {
      filter.age = { $lte: 2 }; // Younger, more energetic pets
    }
    
    // Map time available to breed characteristics (simplified)
    if (timeAvailable === "low") {
      // Filter for lower maintenance breeds
      conditions.push({
        $or: [
          { breed: { $regex: "shorthair|domestic", $options: "i" } },
          { type: "cat" } // Cats generally require less time
        ]
      });
    }
    
    // Map temperament to breed characteristics
    if (temperament === "calm") {
      conditions.push({
        $or: [
          { breed: { $regex: "persian|ragdoll|british", $options: "i" } },
          { age: { $gte: 4 } } // Older pets tend to be calmer
        ]
      });
    } else if (temperament === "energetic") {
      conditions.push({
        $or: [
          { breed: { $regex: "retriever|shepherd|terrier", $options: "i" } },
          { age: { $lte: 2 } } // Younger pets tend to be more energetic
        ]
      });
    }
    
    // Filter based on other pets
    if (otherPets && otherPets !== "none") {
      // For simplicity, we'll just ensure the pet is good with other animals
      // In a real app, you'd have a compatibility field in your database
      conditions.push({
        $or: [
          { breed: { $regex: "friendly|social|good with", $options: "i" } },
          { description: { $regex: "good with|gets along", $options: "i" } }
        ]
      });
    }
    
    // Add all conditions to the filter if there are any
    if (conditions.length > 0) {
      filter.$and = conditions;
    }

    const pets = await Pet.find(filter).limit(10); // Limit to 10 results
    res.status(200).json({
      success: true,
      count: pets.length,
      pets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error matching pets",
      error: error.message,
    });
  }
};
