// Utilities/emailService.js
const sgMail = require("@sendgrid/mail");
const { getEmailConfig } = require("./emailConfig");
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

    const htmlContent = `
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
      `;

    const textContent = `
PawProject - Verification Code

Your verification code is: ${otp}

This code is valid for 1 hour.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} PawProject. All rights reserved.
    `;

    const msg = getEmailConfig(email, "Verification Code - PawProject", htmlContent, textContent);
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

    const textContent = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const msg = getEmailConfig(email, subject, html, textContent);

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

    const htmlContent = `
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
      `;

    const textContent = `
PawProject - New Contact Form Submission

Contact Information:
Name: ${contactData.name}
Email: ${contactData.email}
Phone: ${contactData.phone || "Not provided"}
Contact Method: ${contactData.contactMethod}
Subject: ${contactData.subject}

Message:
${contactData.message}

Preferences:
Receive updates: ${contactData.receiveUpdates ? "Yes" : "No"}
Submitted: ${new Date().toLocaleString()}

© ${new Date().getFullYear()} PawProject. All rights reserved.
    `;

    const msg = getEmailConfig("pawprojectsystem@gmail.com", `New Contact Form: ${contactData.subject}`, htmlContent, textContent);
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

    const htmlContent = `
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
      `;

    const textContent = `
PawProject - New Donation Received

Amount: ${amount}

Donor Information:
Name: ${donationData.name}
Email: ${donationData.email}
${!isInternational ? `Mobile: ${donationData.mobileNumber}\n` : ""}Type: ${isInternational ? "International (PayPal)" : "Local (QR Code)"}
${!isInternational ? `Purpose: ${donationData.donationFor || "General Support"}\n` : ""}
Donor Preferences:
Receive updates: ${donationData.receiveUpdates ? "Yes" : "No"}
Submitted: ${new Date().toLocaleString()}

© ${new Date().getFullYear()} PawProject. All rights reserved.
    `;

    const msg = getEmailConfig("pawprojectsystem@gmail.com", `New Donation: ${amount} from ${donationData.name}`, htmlContent, textContent);
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

// Fix: Always send email for status changes (approved, rejected, completed)

// ✅ FIXED: Send adoption status email (handles both registered users and guests)
const sendAdoptionStatusEmail = async ({
  userEmail,
  userFullname,
  petName,
  status,
  adminMessage,
}) => {
  // Validate required fields
  if (!userEmail || !userFullname) {
    console.warn("⚠️ Cannot send email: Missing user email or fullname", {
      userEmail,
      userFullname,
      petName,
      status,
    });
    return;
  }

  console.log("📧 Starting to send adoption status email via SendGrid...");
  console.log("📧 Email details:", {
    userEmail,
    userFullname,
    petName,
    status,
    hasAdminMessage: !!adminMessage,
    userType: userEmail.includes("@") ? "valid" : "invalid",
  });

  let subject = "";
  let html = "";

  // Create proper email templates based on status
  switch (status.toLowerCase()) {
    case "Approved":
      subject = `🎉 Your Adoption Request for ${petName} Has Been Approved! - PawProject`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B35; margin: 0;">PawProject</h1>
            <h2 style="color: #333; margin-top: 10px;">Adoption Request Approved! 🎉</h2>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="background-color: #10b981; color: white; padding: 15px 25px; border-radius: 25px; display: inline-block;">
                <h3 style="margin: 0; font-size: 24px;">Congratulations!</h3>
              </div>
            </div>
            
            <h3 style="color: #333; text-align: center;">Hello, ${userFullname}!</h3>
            
            <p style="color: #666; font-size: 16px; text-align: center;">
              We're thrilled to inform you that your adoption request for <strong>${petName}</strong> has been <span style="color: #10b981; font-weight: bold;">APPROVED</span>!
            </p>
            
            <div style="background-color: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #333; margin-top: 0;">Next Steps:</h4>
              <p style="color: #666; margin: 10px 0;">
                ${
                  adminMessage ||
                  "Our team will contact you within 24-48 hours to arrange the pickup details and complete the adoption process."
                }
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #666; font-size: 14px;">
                <strong>Please keep an eye on your email</strong> for further instructions.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>Thank you for choosing to adopt and give a loving home to ${petName}!</p>
            <p>© ${new Date().getFullYear()} PawProject. All rights reserved.</p>
          </div>
        </div>
      `;
      break;

    case "Rejected":
      subject = `Update on Your Adoption Request for ${petName} - PawProject`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B35; margin: 0;">PawProject</h1>
            <h2 style="color: #333; margin-top: 10px;">Adoption Request Update</h2>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px;">
            <h3 style="color: #333; text-align: center;">Hello, ${userFullname}</h3>
            
            <p style="color: #666; font-size: 16px; text-align: center;">
              After careful consideration, we regret to inform you that your adoption request for <strong>${petName}</strong> has been <span style="color: #ef4444; font-weight: bold;">not approved</span> at this time.
            </p>
            
            <div style="background-color: white; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #333; margin-top: 0;">Message from our team:</h4>
              <p style="color: #666; margin: 10px 0;">
                ${
                  adminMessage ||
                  "Thank you for your interest in adopting. We encourage you to consider other available pets that might be a better fit for your situation."
                }
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #666; font-size: 14px;">
                We appreciate your understanding and hope you'll consider adopting another pet in the future.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PawProject. All rights reserved.</p>
          </div>
        </div>
      `;
      break;

    case "Completed":
      subject = `🎊 Adoption Completed for ${petName}! - PawProject`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B35; margin: 0;">PawProject</h1>
            <h2 style="color: #333; margin-top: 10px;">Adoption Completed! 🎊</h2>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="background-color: #3b82f6; color: white; padding: 15px 25px; border-radius: 25px; display: inline-block;">
                <h3 style="margin: 0; font-size: 24px;">Adoption Finalized!</h3>
              </div>
            </div>
            
            <h3 style="color: #333; text-align: center;">Congratulations, ${userFullname}!</h3>
            
            <p style="color: #666; font-size: 16px; text-align: center;">
              We're delighted to inform you that your adoption of <strong>${petName}</strong> is now <span style="color: #3b82f6; font-weight: bold;">COMPLETED</span>!
            </p>
            
            <div style="background-color: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #333; margin-top: 0;">Final Message:</h4>
              <p style="color: #666; margin: 10px 0;">
                ${
                  adminMessage ||
                  "Thank you for giving a loving home to ${petName}! We wish you both many happy years together."
                }
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #666; font-size: 14px;">
                Remember that we're always here to support you and ${petName}. Don't hesitate to reach out if you need any post-adoption advice.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PawProject. All rights reserved.</p>
          </div>
        </div>
      `;
      break;

    default:
      subject = `Update on Your Adoption Request for ${petName} - PawProject`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B35; margin: 0;">PawProject</h1>
            <h2 style="color: #333; margin-top: 10px;">Adoption Request Update</h2>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px;">
            <h3 style="color: #333; text-align: center;">Hello, ${userFullname}</h3>
            
            <p style="color: #666; font-size: 16px; text-align: center;">
              Your adoption request status for <strong>${petName}</strong> has been updated to: <strong>${status.toUpperCase()}</strong>.
            </p>
            
            ${
              adminMessage
                ? `
            <div style="background-color: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #333; margin-top: 0;">Message from our team:</h4>
              <p style="color: #666; margin: 10px 0;">${adminMessage}</p>
            </div>
            `
                : ""
            }
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PawProject. All rights reserved.</p>
          </div>
        </div>
      `;
      break;
  }

  const textContent = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const msg = getEmailConfig(userEmail, subject, html, textContent);

  try {
    const result = await sgMail.send(msg);
    console.log(`✅ Adoption status email sent successfully to ${userEmail}`);
    console.log(`✅ Status: ${status}, Pet: ${petName}`);
    return {
      success: true,
      messageId: result[0].headers["x-message-id"],
      statusCode: result[0].statusCode,
    };
  } catch (error) {
    console.error("❌ SendGrid error for adoption status email:", error);
    throw new Error(`Failed to send adoption status email: ${error.message}`);
  }
};

module.exports = {
  sendOtpEmail,
  sendAdoptionEmail,
  sendContactEmail,
  sendDonationEmail,
  sendAdoptionStatusEmail,
};
