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

// Send OTP email (existing function)
const sendOtpEmail = async (email, otp) => {
  try {
    console.log("📧 Attempting to send OTP email via SendGrid to:", email);

    const msg = {
      to: email,
      from: process.env.SENDGRID_VERIFIED_SENDER,
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
    console.log("✅ OTP Email sent successfully via SendGrid");
    return {
      success: true,
      messageId: result[0].headers["x-message-id"],
      statusCode: result[0].statusCode,
    };
  } catch (error) {
    console.error("❌ SendGrid error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// ✅ Send adoption status email
const sendAdoptionEmail = async (email, subject, html) => {
  try {
    console.log("📧 Attempting to send adoption email via SendGrid to:", email);

    const msg = {
      to: email,
      from: process.env.SENDGRID_VERIFIED_SENDER,
      subject: subject,
      html: html,
    };

    const result = await sgMail.send(msg);
    console.log("✅ Adoption Email sent successfully via SendGrid");
    return {
      success: true,
      messageId: result[0].headers["x-message-id"],
      statusCode: result[0].statusCode,
    };
  } catch (error) {
    console.error("❌ SendGrid error for adoption email:", error);
    throw new Error(`Failed to send adoption email: ${error.message}`);
  }
};

// ✅ NEW: Send contact form email to admin
const sendContactEmail = async (contactData) => {
  try {
    console.log("📧 Attempting to send contact form email to admin");

    const msg = {
      to: "pawprojectsystem@gmail.com", // Your admin email
      from: process.env.SENDGRID_VERIFIED_SENDER,
      subject: `New Contact Form: ${contactData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B35; margin: 0;">PawProject</h1>
            <h2 style="color: #333; margin-top: 10px;">New Contact Form Submission</h2>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px;">
            <h3 style="color: #333; margin-top: 0;">Contact Information</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${
                  contactData.name
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${
                  contactData.email
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${
                  contactData.phone || "Not provided"
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Contact Method:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${
                  contactData.contactMethod
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Subject:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${
                  contactData.subject
                }</td>
              </tr>
            </table>
            
            <h4 style="color: #333; margin-top: 20px;">Message:</h4>
            <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 10px 0;">
              <p style="margin: 0; line-height: 1.6;">${contactData.message.replace(
                /\n/g,
                "<br>"
              )}</p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-radius: 8px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Preferences:</strong><br>
                Receive updates: ${
                  contactData.receiveUpdates ? "Yes" : "No"
                }<br>
                Submitted: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PawProject. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await sgMail.send(msg);
    console.log("✅ Contact form email sent successfully to admin");
    return {
      success: true,
      messageId: result[0].headers["x-message-id"],
      statusCode: result[0].statusCode,
    };
  } catch (error) {
    console.error("❌ SendGrid error for contact form:", error);
    throw new Error(`Failed to send contact form email: ${error.message}`);
  }
};

// ✅ NEW: Send donation confirmation email
const sendDonationEmail = async (donationData, isInternational = false) => {
  try {
    console.log("📧 Attempting to send donation email to admin");

    const amount = isInternational
      ? `$${donationData.amount} USD`
      : `₱${donationData.amount}`;

    const msg = {
      to: "pawprojectsystem@gmail.com", // Your admin email
      from: process.env.SENDGRID_VERIFIED_SENDER,
      subject: `New Donation: ${amount} from ${donationData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B35; margin: 0;">PawProject</h1>
            <h2 style="color: #333; margin-top: 10px;">New Donation Received</h2>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="background-color: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block;">
                <h3 style="margin: 0; font-size: 24px;">${amount}</h3>
              </div>
            </div>
            
            <h3 style="color: #333; margin-top: 0;">Donor Information</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${
                  donationData.name
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${
                  donationData.email
                }</td>
              </tr>
              ${
                !isInternational
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Mobile:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${donationData.mobileNumber}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Type:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                  ${
                    isInternational
                      ? "International (PayPal)"
                      : "Local (QR Code)"
                  }
                </td>
              </tr>
              ${
                !isInternational
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Purpose:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${
                  donationData.donationFor || "General Support"
                }</td>
              </tr>
              `
                  : ""
              }
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-radius: 8px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Donor Preferences:</strong><br>
                Receive updates: ${
                  donationData.receiveUpdates ? "Yes" : "No"
                }<br>
                Submitted: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PawProject. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await sgMail.send(msg);
    console.log("✅ Donation email sent successfully to admin");
    return {
      success: true,
      messageId: result[0].headers["x-message-id"],
      statusCode: result[0].statusCode,
    };
  } catch (error) {
    console.error("❌ SendGrid error for donation email:", error);
    throw new Error(`Failed to send donation email: ${error.message}`);
  }
};

module.exports = {
  sendOtpEmail,
  sendAdoptionEmail,
  sendContactEmail,
  sendDonationEmail,
};
