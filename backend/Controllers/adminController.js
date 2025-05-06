/** @format */

const User = require("../Models/userModels");
const Pet = require("../Models/petModels");
const Adoption = require("../Models/adoptionModels");

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update user admin status
exports.updateUserAdminStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error updating user admin status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all adoptions
exports.getAllAdoptions = async (req, res) => {
  try {
    const adoptions = await Adoption.find()
      .populate("pet", "name type breed images")
      .populate("user", "fullname email profilePicture");

    res.status(200).json({
      success: true,
      adoptions,
    });
  } catch (error) {
    console.error("Error fetching adoptions:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update adoption status
exports.updateAdoptionStatus = async (req, res) => {
  try {
    const { adoptionId } = req.params;
    const { status, adminMessage } = req.body;

    const adoption = await Adoption.findByIdAndUpdate(
      adoptionId,
      { status, adminMessage },
      { new: true }
    );

    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    // If adoption is approved or completed, update the pet's adoption status
    if (status === "Approved" || status === "Completed") {
      await Pet.findByIdAndUpdate(adoption.pet, {
        adoptionStatus: status === "Approved" ? "pending" : "adopted",
        owner: adoption.user,
      });
    } else if (status === "Rejected") {
      // If adoption is rejected, make the pet available again
      await Pet.findByIdAndUpdate(adoption.pet, {
        adoptionStatus: "available",
        owner: null,
      });
    }

    res.status(200).json({
      success: true,
      adoption,
    });
  } catch (error) {
    console.error("Error updating adoption status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalPets = await Pet.countDocuments();
    const totalUsers = await User.countDocuments();
    const adoptedPets = await Pet.countDocuments({ adoptionStatus: "adopted" });
    const pendingAdoptions = await Adoption.countDocuments({
      status: "Pending",
    });

    // Get pet type distribution
    const petTypes = await Pet.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", value: "$count" } },
    ]);

    // Get monthly adoptions for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyAdoptions = await Adoption.aggregate([
      {
        $match: {
          status: "Completed",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          adoptions: "$count",
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Convert month numbers to names
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedMonthlyAdoptions = monthlyAdoptions.map((item) => ({
      name: monthNames[item.month - 1],
      adoptions: item.adoptions,
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalPets,
        totalUsers,
        adoptedPets,
        pendingAdoptions,
        petTypes,
        monthlyAdoptions: formattedMonthlyAdoptions,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all pets (admin view - includes archived pets)
exports.getAllPets = async (req, res) => {
  try {
    // For admin, show all pets including archived ones
    const pets = await Pet.find();

    res.status(200).json({
      success: true,
      count: pets.length,
      pets,
    });
  } catch (error) {
    console.error("Error fetching pets:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete a pet
exports.deletePet = async (req, res) => {
  try {
    const { petId } = req.params;

    const pet = await Pet.findByIdAndDelete(petId);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    // Also delete any adoption requests for this pet
    await Adoption.deleteMany({ pet: petId });

    res.status(200).json({
      success: true,
      message: "Pet deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pet:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update a pet
exports.updatePet = async (req, res) => {
  try {
    const { petId } = req.params;
    const updateData = req.body;

    const pet = await Pet.findByIdAndUpdate(petId, updateData, { new: true });

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
    console.error("Error updating pet:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Also delete any adoption requests by this user
    await Adoption.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
