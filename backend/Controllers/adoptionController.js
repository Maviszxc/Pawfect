const Adoption = require("../Models/adoptionModels");
const Pet = require("../Models/petModels");
const User = require("../Models/userModels");

exports.createAdoption = async (req, res) => {
  try {
    console.log("📦 RAW REQUEST BODY:", JSON.stringify(req.body, null, 2));
    
    // ✅ FIXED: Extract adoptionFormUrl properly
    const { 
      pet, 
      message, 
      fullname, 
      email, 
      phone, 
      address, 
      profilePicture, 
      adoptionFormUrl 
    } = req.body;

    console.log("🔍 Creating adoption request:", {
      pet,
      fullname,
      email,
      hasUser: !!req.user,
      hasAdoptionForm: !!adoptionFormUrl,
      adoptionFormUrl: adoptionFormUrl || "NOT PROVIDED",
      adoptionFormUrlLength: adoptionFormUrl ? adoptionFormUrl.length : 0,
    });

    // ✅ Validate required fields (adoptionFormUrl is optional for backward compatibility)
    if (!pet || !fullname || !email || !phone || !address) {
      console.error("❌ Missing required fields:", {
        pet: !!pet,
        fullname: !!fullname,
        email: !!email,
        phone: !!phone,
        address: !!address,
        adoptionFormUrl: !!adoptionFormUrl
      });
      
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided.",
        missingFields: {
          pet: !pet,
          fullname: !fullname,
          email: !email,
          phone: !phone,
          address: !address
        }
      });
    }

    // ✅ Validate adoptionFormUrl format if provided
    if (adoptionFormUrl && !adoptionFormUrl.startsWith('http')) {
      console.error("❌ Invalid adoption form URL format:", adoptionFormUrl);
      return res.status(400).json({
        success: false,
        message: "Invalid adoption form URL format. Must be a valid URL.",
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

    // ✅ Check for existing APPROVED adoption request for this pet by ANY user
    const approvedAdoption = await Adoption.findOne({
      pet: pet,
      status: "Approved",
    });

    if (approvedAdoption) {
      return res.status(400).json({
        success: false,
        message:
          "This pet is currently in the adoption process with another adopter. Please choose another pet.",
        isPetUnavailable: true,
      });
    }

    // Check for existing adoption request for this pet by this email
    const existingAdoption = await Adoption.findOne({
      pet: pet,
      email: email,
      status: { $in: ["Pending", "Approved"] },
    });

    if (existingAdoption) {
      return res.status(400).json({
        success: false,
        message:
          existingAdoption.status === "Approved"
            ? "Your adoption request has been approved! Please check your email for next steps."
            : "You have already submitted an adoption request for this pet. Please wait for the admin to review your application.",
        existingApplication: {
          status: existingAdoption.status,
          submittedAt: existingAdoption.createdAt,
        },
        isApproved: existingAdoption.status === "Approved",
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
          message:
            existingUserAdoption.status === "Approved"
              ? "Your adoption request has been approved! Please check your email for next steps."
              : "You have already submitted an adoption request for this pet. Please wait for the admin to review your application.",
          existingApplication: {
            status: existingUserAdoption.status,
            submittedAt: existingUserAdoption.createdAt,
          },
          isApproved: existingUserAdoption.status === "Approved",
        });
      }
    }

    // ✅ FIXED: Create adoption data with explicit adoptionFormUrl
    const adoptionData = {
      pet,
      user: userId || undefined,
      status: "Pending",
      fullname,
      email,
      phone,
      address,
      message: message || "Adoption form submitted",
      adminMessage: "",
      profilePicture: profilePicture || "",
      adoptionFormUrl: adoptionFormUrl || "", // ✅ This will be saved properly
    };

    console.log("📨 Creating adoption with data:", JSON.stringify(adoptionData, null, 2));

    // ✅ Create and save adoption - SIMPLIFIED APPROACH
    const adoption = new Adoption(adoptionData);
    
    console.log("💾 BEFORE SAVE - adoption.adoptionFormUrl:", adoption.adoptionFormUrl);

    // Save the adoption
    await adoption.save();

    console.log("✅ AFTER SAVE - Adoption request created:", {
      id: adoption._id,
      adoptionFormUrl: adoption.adoptionFormUrl,
      hasFormUrl: !!adoption.adoptionFormUrl,
      adoptionFormUrlType: typeof adoption.adoptionFormUrl,
      adoptionFormUrlLength: adoption.adoptionFormUrl ? adoption.adoptionFormUrl.length : 0,
    });

    // ✅ Verify by fetching from database
    const savedAdoption = await Adoption.findById(adoption._id)
      .populate("pet", "name breed type images")
      .populate("user", "fullname email profilePicture");
      
    console.log("🔍 FETCHED FROM DB:", {
      id: savedAdoption._id,
      adoptionFormUrl: savedAdoption.adoptionFormUrl,
      hasFormUrl: !!savedAdoption.adoptionFormUrl,
      adoptionFormUrlLength: savedAdoption.adoptionFormUrl ? savedAdoption.adoptionFormUrl.length : 0,
    });

    res.status(201).json({
      success: true,
      message: "Adoption request submitted successfully.",
      adoption: savedAdoption,
    });
  } catch (error) {
    console.error("❌ Adoption request error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting adoption request.",
      error: error.message,
    });
  }
};

// ✅ Check adoption status for a specific pet and user
exports.checkAdoptionStatus = async (req, res) => {
  try {
    const { petId, email } = req.query;

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: "Pet ID is required.",
      });
    }

    // First check if there's ANY approved adoption for this pet
    const approvedByAnyone = await Adoption.findOne({
      pet: petId,
      status: "Approved",
    });

    if (approvedByAnyone && email && approvedByAnyone.email !== email) {
      return res.status(200).json({
        success: true,
        isPetUnavailable: true,
        message:
          "This pet is currently in the adoption process with another adopter.",
      });
    }

    // Check if user has an application for this pet
    if (email) {
      const userAdoption = await Adoption.findOne({
        pet: petId,
        email: email,
        status: { $in: ["Pending", "Approved"] },
      })
        .populate("pet", "name")
        .sort({ createdAt: -1 });

      if (userAdoption) {
        return res.status(200).json({
          success: true,
          hasApplication: true,
          isApproved: userAdoption.status === "Approved",
          application: {
            status: userAdoption.status,
            submittedAt: userAdoption.createdAt,
            petName: userAdoption.pet?.name,
            message:
              userAdoption.status === "Approved"
                ? `You're close to adopting ${userAdoption.pet?.name}! Please check your email to proceed to the next step.`
                : "Your application is being reviewed by our admin team.",
          },
        });
      }
    }

    res.status(200).json({
      success: true,
      hasApplication: false,
      isPetUnavailable: !!approvedByAnyone,
    });
  } catch (error) {
    console.error("❌ Error checking adoption status:", error);
    res.status(500).json({
      success: false,
      message: "Error checking application status.",
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
    console.error("❌ Error checking existing application:", error);
    res.status(500).json({
      success: false,
      message: "Error checking application status.",
    });
  }
};

// Check pet availability
exports.checkPetAvailability = async (req, res) => {
  try {
    const { petId } = req.params;

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: "Pet ID is required.",
      });
    }

    // Check if there's ANY approved adoption for this pet
    const approvedAdoption = await Adoption.findOne({
      pet: petId,
      status: "Approved",
    });

    // Pet is available if no approved adoption exists
    const isAvailable = !approvedAdoption;

    res.status(200).json({
      success: true,
      isAvailable,
      message: isAvailable
        ? "Pet is available for adoption"
        : "Pet is currently in adoption process",
    });
  } catch (error) {
    console.error("❌ Error checking pet availability:", error);
    res.status(500).json({
      success: false,
      message: "Error checking pet availability.",
    });
  }
};

exports.updateAdoptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminMessage } = req.body;

    console.log(`🔄 Updating adoption ${id} to status:`, status);

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required.",
      });
    }

    // Find and update adoption
    const adoption = await Adoption.findByIdAndUpdate(
      id,
      {
        status,
        adminMessage: adminMessage || "",
      },
      { new: true }
    )
      .populate("user", "email fullname profilePicture")
      .populate("pet", "name breed type age gender images");

    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found.",
      });
    }

    console.log("📧 Adoption details:", {
      user: adoption.user,
      userEmail: adoption.user?.email,
      userFullname: adoption.user?.fullname,
      pet: adoption.pet,
      petName: adoption.pet?.name,
      directEmail: adoption.email,
      directFullname: adoption.fullname,
    });

    // ✅ FIXED: Handle both registered users and guest adoptions
    const userEmail = adoption.user?.email || adoption.email;
    const userFullname = adoption.user?.fullname || adoption.fullname;
    const petName = adoption.pet?.name;

    console.log("🔍 Final email details:", {
      userEmail,
      userFullname,
      petName,
      status,
      userType: adoption.user ? "registered" : "guest",
    });

    // Send email notification
    if (userEmail && userFullname) {
      try {
        await sendAdoptionStatusEmail({
          userEmail,
          userFullname,
          petName,
          status,
          adminMessage: adminMessage || "",
        });
        console.log(
          `✅ Email sent for ${
            adoption.user ? "registered" : "guest"
          } adoption ${id}`
        );
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
        // Don't fail the request if email fails
      }
    } else {
      console.warn("⚠️ Cannot send email: Missing user email or fullname", {
        userEmail,
        userFullname,
        adoptionId: id,
      });
    }

    res.status(200).json({
      success: true,
      message: `Adoption status updated to ${status}.`,
      adoption,
    });
  } catch (error) {
    console.error("❌ Error updating adoption status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating adoption status.",
      error: error.message,
    });
  }
};
