const { sendDonationEmail } = require("../Utilities/emailService");

// Handle donation confirmation submission
const submitDonationConfirmation = async (req, res) => {
  try {
    const { name, email, mobileNumber, amount, donationFor, donationType, receiveUpdates } = req.body;

    // Validate required fields
    if (!name || !email || !amount) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields (name, email, amount)",
      });
    }

    // Validate amount is a positive number
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid donation amount",
      });
    }

    // Determine if international donation
    const isInternational = donationType === "international";

    // Send email notification to admin
    await sendDonationEmail({
      name,
      email,
      mobileNumber: mobileNumber || "Not provided",
      amount: parseFloat(amount),
      donationFor: donationFor || "general",
      receiveUpdates: receiveUpdates || false,
    }, isInternational);

    return res.status(200).json({
      success: true,
      message: "Thank you for your donation! We've received your confirmation and will process it shortly.",
    });
  } catch (error) {
    console.error("Error submitting donation confirmation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process your donation confirmation. Please try again later.",
      error: error.message,
    });
  }
};

module.exports = {
  submitDonationConfirmation,
};
