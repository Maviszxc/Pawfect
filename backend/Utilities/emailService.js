// Utilities/emailService.js
const { Resend } = require("resend");
require("dotenv").config();

console.log("🔑 Email Service Initialization");
console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
console.log(
  "RESEND_API_KEY starts with re_:",
  process.env.RESEND_API_KEY?.startsWith("re_")
);

if (!process.env.RESEND_API_KEY) {
  console.error("❌ CRITICAL: RESEND_API_KEY is not set!");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (email, otp) => {
  try {
    console.log("📧 sendOtpEmail called with:", {
      email,
      otp: otp ? "provided" : "missing",
    });

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!email || !otp) {
      throw new Error("Email and OTP are required");
    }

    console.log("📤 Sending email via Resend API...");

    const { data, error } = await resend.emails.send({
      from: "PawProject <onboarding@resend.dev>",
      to: [email],
      subject: "Verification Code - PawProject",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B35; margin: 0; font-size: 32px;">🐾 PawProject</h1>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px; text-align: center;">
            <h2 style="color: #333; margin-top: 0; font-size: 24px;">Email Verification</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Thank you for signing up! Please use the verification code below to complete your registration:
            </p>
            
            <div style="background-color: white; border: 2px dashed #FF6B35; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h1 style="font-size: 42px; color: #FF6B35; letter-spacing: 10px; margin: 0; font-weight: bold;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              ⏰ This code will expire in <strong>1 hour</strong>.
            </p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 20px; text-align: left;">
              <p style="color: #856404; font-size: 13px; margin: 0;">
                <strong>Security Tip:</strong> Never share this code with anyone. PawProject will never ask for your verification code.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              If you didn't request this code, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              © ${new Date().getFullYear()} PawProject. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend API returned error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw new Error(
        `Resend API error: ${error.message || JSON.stringify(error)}`
      );
    }

    console.log("✅ Email sent successfully! Message ID:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("❌ sendOtpEmail failed:", error);
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
};

// Test function to verify Resend is working
const testEmailService = async () => {
  try {
    console.log("🧪 Testing Resend email service...");
    console.log("API Key present:", !!process.env.RESEND_API_KEY);
    console.log(
      "API Key format:",
      process.env.RESEND_API_KEY?.substring(0, 5) + "..."
    );

    return true;
  } catch (error) {
    console.error("❌ Email service test failed:", error);
    return false;
  }
};

// Run test on initialization
testEmailService();

module.exports = {
  sendOtpEmail,
  testEmailService,
};
