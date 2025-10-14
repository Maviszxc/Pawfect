const { sendContactEmail } = require("../Utilities/emailService");

// Handle contact form submission
const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message, contactMethod, receiveUpdates } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields (name, email, subject, message)",
      });
    }

    // Send email notification to admin
    await sendContactEmail({
      name,
      email,
      phone: phone || "Not provided",
      subject,
      message,
      contactMethod: contactMethod || "email",
      receiveUpdates: receiveUpdates || false,
    });

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send your message. Please try again later.",
      error: error.message,
    });
  }
};

module.exports = {
  submitContactForm,
};
