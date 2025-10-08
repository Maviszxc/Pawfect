// Utilities/emailService.js
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

// Validate configuration
if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY is not configured!");
  throw new Error("SENDGRID_API_KEY is required");
}

if (!process.env.SENDGRID_VERIFIED_SENDER) {
  console.error("❌ SENDGRID_VERIFIED_SENDER is not configured!");
  throw new Error("SENDGRID_VERIFIED_SENDER is required");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOtpEmail = async (email, otp) => {
  try {
    console.log("📧 Attempting to send OTP email via SendGrid to:", email);
    console.log("📧 From:", process.env.SENDGRID_VERIFIED_SENDER);

    const msg = {
      to: email,
      from: process.env.SENDGRID_VERIFIED_SENDER, // Must be verified in SendGrid
      subject: "Verification Code - PawProject",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B35; margin: 0;">PawProject</h1>
          </div>
          <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px; text-align: center;">
            <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
            <p style="color: #666; font-size: 16px;">Your verification code is:</p>
            <div style="background-color: white; border: 2px dashed #FF6B35; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h1 style="font-size: 36px; color: #FF6B35; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">This code is valid for 1 hour.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PawProject. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await sgMail.send(msg);
    console.log("✅ Email sent successfully via SendGrid");
    console.log("📧 Status:", result[0].statusCode);
    console.log("📧 Message ID:", result[0].headers["x-message-id"]);

    return {
      success: true,
      messageId: result[0].headers["x-message-id"],
      statusCode: result[0].statusCode,
    };
  } catch (error) {
    console.error("❌ SendGrid error:", {
      message: error.message,
      code: error.code,
      response: error.response?.body,
    });

    // Provide more specific error messages
    if (error.code === 403) {
      throw new Error(
        "SendGrid API key is invalid or sender email is not verified"
      );
    } else if (error.response?.body?.errors) {
      const errorMsg = error.response.body.errors
        .map((e) => e.message)
        .join(", ");
      throw new Error(`SendGrid error: ${errorMsg}`);
    } else {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
};

module.exports = { sendOtpEmail };
