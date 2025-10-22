/** @format */

const User = require("../Models/userModels");
const Pet = require("../Models/petModels");
const Adoption = require("../Models/adoptionModels");
const {
  sendOtpEmail,
  sendAdoptionEmail,
} = require("../Utilities/emailService");

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

// Get all adoptions (with optional userId filter)
exports.getAllAdoptions = async (req, res) => {
  try {
    const { userId } = req.query;
    
    let query = {};
    
    // If userId is provided, fetch adoptions for that user
    if (userId) {
      // First, get the user's email to also match guest adoptions
      const user = await User.findById(userId).select("email");
      
      if (user) {
        console.log(`🔍 Fetching adoptions for user: ${userId}, email: ${user.email}`);
        
        // Match:
        // 1. Registered adoptions (by user ID)
        // 2. Guest adoptions (by email where user field is null/undefined)
        query = {
          $or: [
            { user: userId },
            { email: user.email, user: { $exists: false } },
            { email: user.email, user: null }
          ]
        };
      } else {
        console.log(`⚠️ User not found: ${userId}`);
        // If user not found, just search by user ID
        query = { user: userId };
      }
    }
    
    const adoptions = await Adoption.find(query)
      .populate("pet", "name type breed images")
      .populate("user", "fullname email profilePicture")
      .sort({ createdAt: -1 });

    console.log(`📊 Fetched ${adoptions.length} adoptions${userId ? ` for userId: ${userId}` : ''}`);
    
    // Debug: Log adoption form URLs
    if (adoptions.length > 0) {
      console.log(`📋 Adoption details with form URLs:`);
      adoptions.forEach((adoption, index) => {
        console.log(`Adoption ${index + 1}:`, {
          id: adoption._id,
          petName: adoption.pet?.name,
          email: adoption.email,
          hasUser: !!adoption.user,
          userId: adoption.user?._id,
          hasAdoptionForm: !!adoption.adoptionFormUrl,
          adoptionFormUrl: adoption.adoptionFormUrl,
          adoptionFormUrlLength: adoption.adoptionFormUrl ? adoption.adoptionFormUrl.length : 0
        });
      });
    }

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

    console.log(`🔄 Updating adoption ${adoptionId} to status: ${status}`);

    // First, find the adoption with proper population
    const adoption = await Adoption.findById(adoptionId)
      .populate("user", "email fullname")
      .populate("pet", "name");

    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    console.log("📧 Adoption details:", {
      user: adoption.user,
      userEmail: adoption.user?.email,
      userFullname: adoption.user?.fullname,
      pet: adoption.pet,
      petName: adoption.pet?.name,
      adoptionFormUrl: adoption.adoptionFormUrl, // Log the form URL
    });

    // Then update the adoption
    const updatedAdoption = await Adoption.findByIdAndUpdate(
      adoptionId,
      { status, adminMessage },
      { new: true }
    ).populate("user", "email fullname").populate("pet", "name");

    // Send email via SendGrid (asynchronously)
    if (adoption.user && adoption.user.email && adoption.user.fullname) {
      sendAdoptionStatusEmail(adoption, status, adminMessage)
        .then(() => {
          console.log(`✅ Email sent for adoption ${adoptionId}`);
        })
        .catch((error) => {
          console.error(`❌ Email failed for adoption ${adoptionId}:`, error);
        });
    } else {
      console.log("⚠️ Cannot send email: Missing user email or fullname");
      console.log("Adoption user data:", adoption.user);
      
      // Try to get email from adoption record directly for guest users
      if (adoption.email && adoption.fullname) {
        console.log("🔄 Trying guest user email...");
        const guestAdoption = {
          user: { email: adoption.email, fullname: adoption.fullname },
          pet: adoption.pet
        };
        sendAdoptionStatusEmail(guestAdoption, status, adminMessage)
          .then(() => {
            console.log(`✅ Email sent for guest adoption ${adoptionId}`);
          })
          .catch((error) => {
            console.error(`❌ Email failed for guest adoption ${adoptionId}:`, error);
          });
      }
    }

    // Update pet status based on adoption status
    if (status === "Approved") {
      // When adoption is approved, set pet status to "processed"
      await Pet.findByIdAndUpdate(adoption.pet, {
        adoptionStatus: "processed",
        owner: adoption.user || null,
      });
      console.log(`🐾 Pet ${adoption.pet._id} status updated to: processed`);
    } else if (status === "Completed") {
      // When adoption is completed, set pet status to "adopted"
      await Pet.findByIdAndUpdate(adoption.pet, {
        adoptionStatus: "adopted",
        owner: adoption.user || null,
      });
      console.log(`🐾 Pet ${adoption.pet._id} status updated to: adopted`);
    } else if (status === "Rejected" || status === "Pending") {
      // When adoption is rejected or back to pending, set pet status to "available"
      await Pet.findByIdAndUpdate(adoption.pet, {
        adoptionStatus: "available",
        owner: null,
      });
      console.log(`🐾 Pet ${adoption.pet._id} status updated to: available`);
    }

    console.log(`✅ Adoption ${adoptionId} status updated to: ${status}`);

    res.status(200).json({
      success: true,
      adoption: updatedAdoption,
      message: `Adoption status updated to ${status}`,
    });
  } catch (error) {
    console.error("❌ Error updating adoption status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const sendAdoptionStatusEmail = async (adoption, status, adminMessage) => {
  try {
    console.log("📧 Starting to send adoption status email via SendGrid...");

    // Handle both registered users and guest users
    let userEmail, userFullname;

    if (adoption.user && typeof adoption.user === "object") {
      // Registered user (populated)
      userEmail = adoption.user.email;
      userFullname = adoption.user.fullname;
    } else if (adoption.email && adoption.fullname) {
      // Guest user (direct fields)
      userEmail = adoption.email;
      userFullname = adoption.fullname;
    } else {
      // Fallback: check if adoption has direct email/fullname fields
      userEmail = adoption.email;
      userFullname = adoption.fullname || adoption.adopterName;
    }

    const petName = adoption.pet?.name || "the pet";

    console.log("📧 Email details:", {
      userEmail,
      userFullname,
      petName,
      status,
      hasAdminMessage: !!adminMessage,
      userType: adoption.user ? "registered" : "guest",
    });

    // Validate required fields
    if (!userEmail || !userFullname) {
      console.error("❌ Missing email or fullname for adoption email:", {
        userEmail,
        userFullname,
        adoptionId: adoption._id,
      });
      return;
    }

    let subject, html;

    switch (status) {
      case "Approved":
        subject = `🎉 Your Adoption Request for ${petName} Has Been Approved!`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">🎉 Adoption Request Approved!</h2>
            <p>Dear <strong>${userFullname}</strong>,</p>
            <p>We are pleased to inform you that your adoption request for <strong>${petName}</strong> has been <strong style="color: #4CAF50;">approved</strong>!</p>
            <p>Our team will contact you shortly to arrange the next steps and schedule the adoption process.</p>
            ${
              adminMessage
                ? `<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
              <p style="margin: 0;"><strong>Admin Message:</strong> ${adminMessage}</p>
            </div>`
                : ""
            }
            <p>Thank you for choosing to give a loving home to a pet in need! 🐾</p>
            <br>
            <p>Best regards,<br><strong>PawProject Team</strong></p>
          </div>
        `;
        break;

      case "Rejected":
        subject = `Update on Your Adoption Request for ${petName}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f44336;">Update on Your Adoption Request</h2>
            <p>Dear <strong>${userFullname}</strong>,</p>
            <p>After careful consideration, we regret to inform you that your adoption request for <strong>${petName}</strong> has not been approved at this time.</p>
            ${
              adminMessage
                ? `<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
              <p style="margin: 0;"><strong>Reason:</strong> ${adminMessage}</p>
            </div>`
                : ""
            }
            <p>We understand this might be disappointing, but we encourage you to explore other available pets that might be a better fit for your situation.</p>
            <p>Thank you for your understanding and for considering adoption.</p>
            <br>
            <p>Best regards,<br><strong>PawProject Team</strong></p>
          </div>
        `;
        break;

      case "Completed":
        subject = `🏠 Congratulations! Your Adoption of ${petName} is Complete!`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2196F3;">🏠 Adoption Completed!</h2>
            <p>Dear <strong>${userFullname}</strong>,</p>
            <p>Congratulations! The adoption process for <strong>${petName}</strong> has been successfully <strong style="color: #2196F3;">completed</strong>!</p>
            <p><strong>${petName}</strong> is now officially part of your family! 🎉</p>
            ${
              adminMessage
                ? `<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
              <p style="margin: 0;"><strong>Note:</strong> ${adminMessage}</p>
            </div>`
                : ""
            }
            <p>We wish you and <strong>${petName}</strong> a wonderful life together filled with joy, love, and happy moments! 🐾</p>
            <br>
            <p>Best regards,<br><strong>PawProject Team</strong></p>
          </div>
        `;
        break;

      default:
        console.log(`📧 No email needed for status: ${status}`);
        return;
    }

    // ✅ Use the imported sendAdoptionEmail function
    console.log("📧 Sending via SendGrid...");
    const result = await sendAdoptionEmail(userEmail, subject, html);

    console.log("✅ Adoption status email sent successfully via SendGrid:", {
      to: userEmail,
      messageId: result.messageId,
      status: status,
    });
  } catch (error) {
    console.error("❌ Error sending adoption status email via SendGrid:", {
      message: error.message,
      stack: error.stack,
    });
    // Don't throw error here to avoid breaking the main function
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

exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    // Use the imported sendAdoptionEmail function instead of nodemailer directly
    const result = await sendAdoptionEmail(to, subject, html || text);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email",
    });
  }
};

exports.archiveAdoption = async (req, res) => {
  try {
    const { adoptionId } = req.params;

    const adoption = await Adoption.findByIdAndUpdate(
      adoptionId,
      { isArchived: true },
      { new: true }
    );

    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Adoption request archived successfully",
      adoption,
    });
  } catch (error) {
    console.error("Error archiving adoption:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Restore adoption
exports.restoreAdoption = async (req, res) => {
  try {
    const { adoptionId } = req.params;

    const adoption = await Adoption.findByIdAndUpdate(
      adoptionId,
      { isArchived: false },
      { new: true }
    );

    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Adoption request restored successfully",
      adoption,
    });
  } catch (error) {
    console.error("Error restoring adoption:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Test endpoint to check adoption form URLs in admin
exports.testAdoptionFormUrls = async (req, res) => {
  try {
    const adoptions = await Adoption.find({})
      .populate("pet", "name")
      .populate("user", "fullname email")
      .sort({ createdAt: -1 });

    const adoptionData = adoptions.map(adoption => ({
      id: adoption._id,
      adopter: adoption.user?.fullname || adoption.fullname,
      pet: adoption.pet?.name,
      status: adoption.status,
      hasAdoptionFormUrl: !!adoption.adoptionFormUrl,
      adoptionFormUrl: adoption.adoptionFormUrl,
      createdAt: adoption.createdAt
    }));

    res.status(200).json({
      success: true,
      message: `Found ${adoptions.length} adoptions`,
      totalWithForms: adoptionData.filter(a => a.hasAdoptionFormUrl).length,
      adoptions: adoptionData
    });
  } catch (error) {
    console.error("Error testing adoption form URLs:", error);
    res.status(500).json({
      success: false,
      message: "Error testing adoption form URLs"
    });
  }
};