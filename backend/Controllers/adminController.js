/** @format */

const User = require("../Models/userModels");
const Pet = require("../Models/petModels");
const Adoption = require("../Models/adoptionModels");
const nodemailer = require("nodemailer"); // Add this line

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
    ).populate("user", "email fullname")
     .populate("pet", "name");

    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    // Send email notification based on status
    await sendAdoptionStatusEmail(adoption, status, adminMessage);

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
      message: `Adoption status updated to ${status} and email notification sent`,
    });
  } catch (error) {
    console.error("Error updating adoption status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Helper function to send adoption status emails
const sendAdoptionStatusEmail = async (adoption, status, adminMessage) => {
  try {
    const { email, fullname } = adoption;
    const petName = adoption.pet?.name || "the pet";
    
    let subject, text, html;

    switch (status) {
      case "Approved":
        subject = `🎉 Your Adoption Request for ${petName} Has Been Approved!`;
        text = `Dear ${fullname},\n\nWe are pleased to inform you that your adoption request for ${petName} has been approved! Our team will contact you shortly to arrange the next steps.\n\n${adminMessage ? `Admin Message: ${adminMessage}\n\n` : ''}Thank you for choosing to adopt!\n\nBest regards,\nPawProject Team`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">🎉 Adoption Request Approved!</h2>
            <p>Dear <strong>${fullname}</strong>,</p>
            <p>We are pleased to inform you that your adoption request for <strong>${petName}</strong> has been <strong style="color: #4CAF50;">approved</strong>!</p>
            <p>Our team will contact you shortly to arrange the next steps and schedule the adoption process.</p>
            ${adminMessage ? `<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
              <p style="margin: 0;"><strong>Admin Message:</strong> ${adminMessage}</p>
            </div>` : ''}
            <p>Thank you for choosing to give a loving home to a pet in need! 🐾</p>
            <br>
            <p>Best regards,<br><strong>PawProject Team</strong></p>
          </div>
        `;
        break;

      case "Rejected":
        subject = `Update on Your Adoption Request for ${petName}`;
        text = `Dear ${fullname},\n\nAfter careful consideration, we regret to inform you that your adoption request for ${petName} has not been approved at this time.\n\n${adminMessage ? `Reason: ${adminMessage}\n\n` : ''}We encourage you to explore other available pets that might be a better fit for your situation.\n\nThank you for your understanding.\n\nBest regards,\nPawProject Team`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f44336;">Update on Your Adoption Request</h2>
            <p>Dear <strong>${fullname}</strong>,</p>
            <p>After careful consideration, we regret to inform you that your adoption request for <strong>${petName}</strong> has not been approved at this time.</p>
            ${adminMessage ? `<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
              <p style="margin: 0;"><strong>Reason:</strong> ${adminMessage}</p>
            </div>` : ''}
            <p>We understand this might be disappointing, but we encourage you to explore other available pets that might be a better fit for your situation.</p>
            <p>Thank you for your understanding and for considering adoption.</p>
            <br>
            <p>Best regards,<br><strong>PawProject Team</strong></p>
          </div>
        `;
        break;

      case "Completed":
        subject = `🏠 Congratulations! Your Adoption of ${petName} is Complete!`;
        text = `Dear ${fullname},\n\nCongratulations! The adoption process for ${petName} has been successfully completed. ${petName} is now officially part of your family!\n\n${adminMessage ? `Note: ${adminMessage}\n\n` : ''}We wish you and ${petName} a wonderful life together filled with joy and love.\n\nBest regards,\nPawProject Team`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2196F3;">🏠 Adoption Completed!</h2>
            <p>Dear <strong>${fullname}</strong>,</p>
            <p>Congratulations! The adoption process for <strong>${petName}</strong> has been successfully <strong style="color: #2196F3;">completed</strong>!</p>
            <p><strong>${petName}</strong> is now officially part of your family! 🎉</p>
            ${adminMessage ? `<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
              <p style="margin: 0;"><strong>Note:</strong> ${adminMessage}</p>
            </div>` : ''}
            <p>We wish you and <strong>${petName}</strong> a wonderful life together filled with joy, love, and happy moments! 🐾</p>
            <br>
            <p>Best regards,<br><strong>PawProject Team</strong></p>
          </div>
        `;
        break;

      default:
        return; // Don't send email for other statuses
    }

    // Send the email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: subject,
      text: text,
      html: html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Adoption status email sent to ${email} for status: ${status}`);

  } catch (error) {
    console.error("Error sending adoption status email:", error);
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

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
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