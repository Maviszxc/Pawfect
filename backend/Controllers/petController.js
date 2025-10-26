const Pet = require("../Models/petModels");
const {
  cloudinary,
  uploadToCloudinary,
} = require("../Utilities/cloudinaryConfig");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);

// Get all pets (including archived for admin)
exports.getAllPets = async (req, res) => {
  try {
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

// Get all pets for admin (including archived)
exports.getAllPetsAdmin = async (req, res) => {
  try {
    const pets = await Pet.find();
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

exports.createPet = async (req, res) => {
  try {
    console.log("📝 Creating new pet...");
    console.log("Request body:", req.body);
    console.log("Files received:", {
      images: req.files?.images?.length || 0,
      videos: req.files?.videos?.length || 0,
    });

    const { name, type, breed, age, gender, description, adoptionStatus } =
      req.body;

    // Validate required fields
    if (!name || !type || !breed || !age || !gender || !description) {
      console.log("❌ Validation failed - missing required fields");
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
        missing: {
          name: !name,
          type: !type,
          breed: !breed,
          age: !age,
          gender: !gender,
          description: !description,
        },
      });
    }

    // Process images (upload to Cloudinary)
    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.videos || [];

    if (imageFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one pet image is required",
      });
    }

    // Upload images to Cloudinary
    const imageUrls = [];
    for (const imageFile of imageFiles) {
      try {
        const result = await uploadToCloudinary(imageFile.path, "image");
        imageUrls.push({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
        });
        if (fs.existsSync(imageFile.path)) {
          fs.unlinkSync(imageFile.path);
        }
      } catch (error) {
        if (fs.existsSync(imageFile.path)) {
          fs.unlinkSync(imageFile.path);
        }
        throw error;
      }
    }

    // Upload videos to Cloudinary
    const videoUrls = [];
    for (const videoFile of videoFiles) {
      try {
        const result = await uploadToCloudinary(videoFile.path, "video");
        videoUrls.push({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
        });
        if (fs.existsSync(videoFile.path)) {
          fs.unlinkSync(videoFile.path);
        }
      } catch (error) {
        if (fs.existsSync(videoFile.path)) {
          fs.unlinkSync(videoFile.path);
        }
        throw error;
      }
    }

    // Create new pet
    const newPet = new Pet({
      name,
      type,
      breed,
      age,
      gender,
      images: imageUrls,
      videos: videoUrls,
      description,
      adoptionStatus: adoptionStatus || "Available",
    });

    const savedPet = await newPet.save();
    console.log("✅ Pet created successfully:", savedPet._id);
    res.status(201).json({
      success: true,
      message: "Pet created successfully",
      pet: savedPet,
    });
  } catch (error) {
    console.error("❌ Error creating pet:", error.message);
    console.error("Stack trace:", error.stack);
    
    // Clean up uploaded files if error occurs
    if (req.files) {
      for (const fileType in req.files) {
        for (const file of req.files[fileType]) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }
    res.status(500).json({
      success: false,
      message: "Error creating pet",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Update the updatePet function to handle Cloudinary image uploads
exports.updatePet = async (req, res) => {
  try {
    const { name, type, breed, age, gender, description, adoptionStatus } =
      req.body;
    const updateData = {
      name,
      type,
      breed,
      age,
      gender,
      description,
      adoptionStatus,
    };

    // Get existing pet for merging images/videos
    const existingPet = await Pet.findById(req.params.id);
    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    // Process new images if any
    const imageFiles = req.files?.images || [];
    if (imageFiles.length > 0) {
      const imageUrls = [];
      for (const imageFile of imageFiles) {
        try {
          const result = await uploadToCloudinary(imageFile.path, "image");
          imageUrls.push({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
          });
          fs.unlinkSync(imageFile.path);
        } catch (error) {
          if (fs.existsSync(imageFile.path)) {
            fs.unlinkSync(imageFile.path);
          }
        }
      }
      // Append new images to existing ones
      updateData.images = [...(existingPet.images || []), ...imageUrls];
    }

    // Process new videos if any
    const videoFiles = req.files?.videos || [];
    if (videoFiles.length > 0) {
      const videoUrls = [];
      for (const videoFile of videoFiles) {
        try {
          const result = await uploadToCloudinary(videoFile.path, "video");
          videoUrls.push({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
          });
          fs.unlinkSync(videoFile.path);
        } catch (error) {
          if (fs.existsSync(videoFile.path)) {
            fs.unlinkSync(videoFile.path);
          }
        }
      }
      // Append new videos to existing ones
      updateData.videos = [...(existingPet.videos || []), ...videoUrls];
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Pet updated successfully",
      pet: updatedPet,
    });
  } catch (error) {
    // Clean up uploaded files if error occurs
    if (req.files) {
      for (const fileType in req.files) {
        for (const file of req.files[fileType]) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }
    res.status(500).json({
      success: false,
      message: "Error updating pet",
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


// Archive pet (soft delete)
exports.archivePet = async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, adoptionStatus: "Archived" },
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
      { isArchived: false, adoptionStatus: "Available" },
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
    const { type, gender, breed, age, searchQuery, status } = req.query;
    const filter = {};

    // Add filters if they exist
    if (type && type !== "all") filter.type = type;
    if (gender && gender !== "all") filter.gender = gender;
    if (breed && breed !== "all") filter.breed = breed;
    if (age && age !== "all") filter.age = age;
    if (status && status !== "all") filter.adoptionStatus = status;

    // Always filter out archived pets for public routes
    filter.isArchived = false;

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
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    // Delete images from Cloudinary
    if (pet.images && pet.images.length > 0) {
      for (const img of pet.images) {
        try {
          if (img.public_id) {
            await cloudinary.uploader.destroy(img.public_id, {
              resource_type: "image",
            });
          }
        } catch (error) {
          console.error("Error deleting image from Cloudinary:", error);
        }
      }
    }

    // Delete videos from Cloudinary
    if (pet.videos && pet.videos.length > 0) {
      for (const vid of pet.videos) {
        try {
          if (vid.public_id) {
            await cloudinary.uploader.destroy(vid.public_id, {
              resource_type: "video",
            });
          }
        } catch (error) {
          console.error("Error deleting video from Cloudinary:", error);
        }
      }
    }

    await Pet.findByIdAndDelete(req.params.id);

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
    const { type, activityLevel, timeAvailable, temperament, otherPets } =
      req.query;
    const filter = { isArchived: false, adoptionStatus: "Available" };
    const conditions = [];

    // Apply filters based on user preferences
    if (type && type !== "all") {
      filter.type = { $regex: new RegExp("^" + type + "$", "i") };
    }

    // Map activity level to age filters
    if (activityLevel === "low") {
      filter.age = "adult"; // Older, calmer pets
    } else if (activityLevel === "high") {
      filter.age = { $in: ["kitten", "young adult"] }; // Younger, more energetic pets
    }

    // Map time available to breed characteristics (simplified)
    if (timeAvailable === "low") {
      // Filter for lower maintenance breeds
      conditions.push({
        $or: [
          { breed: { $regex: "shorthair|domestic", $options: "i" } },
          { type: "cat" }, // Cats generally require less time
        ],
      });
    }

    // Map temperament to breed characteristics
    if (temperament === "calm") {
      conditions.push({
        $or: [
          { breed: { $regex: "persian|ragdoll|british", $options: "i" } },
          { age: "adult" }, // Older pets tend to be calmer
        ],
      });
    } else if (temperament === "energetic") {
      conditions.push({
        $or: [
          { breed: { $regex: "retriever|shepherd|terrier", $options: "i" } },
          { age: { $in: ["kitten", "young adult"] } }, // Younger pets tend to be more energetic
        ],
      });
    }

    // Filter based on other pets
    if (otherPets && otherPets !== "none") {
      // For simplicity, we'll just ensure the pet is good with other animals
      conditions.push({
        $or: [
          { breed: { $regex: "friendly|social|good with", $options: "i" } },
          { description: { $regex: "good with|gets along", $options: "i" } },
        ],
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
