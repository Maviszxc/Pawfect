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
    case "approved":
      subject = `🎉 Great News! Your Adoption Request for ${petName} Has Been Approved!`;
      html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0fdf4; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; border-radius: 0;">
            <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🐾 PawProject</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Adoption Request Approved!</p>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: white; padding: 40px 30px; margin: 0;">
            <!-- Success Badge -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px 40px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                <h2 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 Congratulations!</h2>
              </div>
            </div>
            
            <h3 style="color: #1f2937; text-align: center; font-size: 24px; margin-bottom: 20px;">Hello, ${userFullname}!</h3>
            
            <p style="color: #4b5563; font-size: 17px; line-height: 1.6; text-align: center; margin: 20px 0;">
              We're absolutely <strong style="color: #10b981;">thrilled</strong> to inform you that your adoption request for <strong style="color: #1f2937;">${petName}</strong> has been <span style="color: #10b981; font-weight: bold; font-size: 18px;">APPROVED</span>! ✨
            </p>
            
            <!-- Next Steps Box -->
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 5px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);">
              <h4 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 10px;">📋</span> Next Steps
              </h4>
              <p style="color: #047857; margin: 0; line-height: 1.6; font-size: 15px;">
                ${adminMessage || "Congratulations! You've passed the initial review. Our team will contact you within 24-48 hours to schedule an interview and provide additional forms to complete. Please keep your phone nearby and check your email regularly."}
              </p>
            </div>
            
            <!-- Important Notice -->
            <div style="background-color: #fef3c7; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="color: #92400e; margin: 0; font-size: 15px; line-height: 1.5;">
                <strong>⚠️ Important:</strong> Please keep an eye on your email and phone for further instructions from our team.
              </p>
            </div>
            
            <!-- Paw Print Decoration -->
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 40px; opacity: 0.3;">🐾 🐾 🐾</span>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 3px solid #10b981;">
            <p style="color: #6b7280; font-size: 15px; margin: 0 0 10px 0; line-height: 1.5;">
              Thank you for choosing to adopt and give a loving home to <strong>${petName}</strong>! 💚
            </p>
            <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} PawProject. All rights reserved.
            </p>
          </div>
        </div>
      `;
      break;

    case "rejected":
      subject = `Update on Your Adoption Request for ${petName}`;
      html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fef2f2; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🐾 PawProject</h1>
            <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Adoption Request Update</p>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: white; padding: 40px 30px; margin: 0;">
            <h3 style="color: #1f2937; text-align: center; font-size: 24px; margin-bottom: 20px;">Hello, ${userFullname}</h3>
            
            <p style="color: #4b5563; font-size: 17px; line-height: 1.6; text-align: center; margin: 20px 0;">
              After careful consideration, we regret to inform you that your adoption request for <strong style="color: #1f2937;">${petName}</strong> has <span style="color: #ef4444; font-weight: bold;">not been approved</span> at this time.
            </p>
            
            <!-- Message Box -->
            <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left: 5px solid #ef4444; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);">
              <h4 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 10px;">💬</span> Message from our team
              </h4>
              <p style="color: #b91c1c; margin: 0; line-height: 1.6; font-size: 15px;">
                ${adminMessage || "After reviewing your application form, we regret to inform you that we are unable to proceed with your adoption request at this time. We encourage you to consider other available pets that might be a perfect match for you!"}
              </p>
            </div>
            
            <!-- Encouragement Box -->
            <div style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="color: #92400e; margin: 0; font-size: 15px; line-height: 1.5;">
                <strong>🌟 Don't give up!</strong> We have many other wonderful pets waiting for a loving home. Please visit our adoption page to find your perfect companion.
              </p>
            </div>
            
            <!-- Paw Print Decoration -->
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 40px; opacity: 0.3;">🐾 🐾 🐾</span>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 3px solid #ef4444;">
            <p style="color: #6b7280; font-size: 15px; margin: 0 0 10px 0; line-height: 1.5;">
              We appreciate your understanding and hope you'll find your perfect pet soon! ❤️
            </p>
            <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} PawProject. All rights reserved.
            </p>
          </div>
        </div>
      `;
      break;

    case "completed":
      subject = `🎊 Adoption Completed! Welcome ${petName} to Your Family!`;
      html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #eff6ff; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🐾 PawProject</h1>
            <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">Adoption Completed!</p>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: white; padding: 40px 30px; margin: 0;">
            <!-- Success Badge -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 20px 40px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
                <h2 style="margin: 0; font-size: 28px; font-weight: bold;">🎊 Adoption Finalized!</h2>
              </div>
            </div>
            
            <h3 style="color: #1f2937; text-align: center; font-size: 24px; margin-bottom: 20px;">Congratulations, ${userFullname}!</h3>
            
            <p style="color: #4b5563; font-size: 17px; line-height: 1.6; text-align: center; margin: 20px 0;">
              We're absolutely <strong style="color: #3b82f6;">delighted</strong> to inform you that your adoption of <strong style="color: #1f2937;">${petName}</strong> is now <span style="color: #3b82f6; font-weight: bold; font-size: 18px;">COMPLETED</span>! 🏠✨
            </p>
            
            <!-- Message Box -->
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 5px solid #3b82f6; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);">
              <h4 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 10px;">💙</span> Final Message
              </h4>
              <p style="color: #1e3a8a; margin: 0; line-height: 1.6; font-size: 15px;">
                ${adminMessage || `Congratulations! You've successfully passed the screening and interview process. ${petName} is now ready to be picked up! Please coordinate with our team for the pickup schedule. We wish you both many happy years together filled with joy, cuddles, and unforgettable memories.`}
              </p>
            </div>
            
            <!-- Support Box -->
            <div style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="color: #92400e; margin: 0; font-size: 15px; line-height: 1.5;">
                <strong>💡 Need Help?</strong> We're always here to support you and ${petName}. Don't hesitate to reach out if you need any post-adoption advice!
              </p>
            </div>
            
            <!-- Celebration -->
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px;">
              <p style="color: #92400e; font-size: 18px; margin: 0; font-weight: bold;">
                🎉 Welcome to the PawProject Family! 🎉
              </p>
            </div>
            
            <!-- Paw Print Decoration -->
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 40px; opacity: 0.3;">🐾 🐾 🐾</span>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 3px solid #3b82f6;">
            <p style="color: #6b7280; font-size: 15px; margin: 0 0 10px 0; line-height: 1.5;">
              Wishing you and <strong>${petName}</strong> a lifetime of happiness together! 💙
            </p>
            <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} PawProject. All rights reserved.
            </p>
          </div>
        </div>
      `;
      break;

    case "denied":
      subject = `Important Update on Your Adoption Request for ${petName}`;
      html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff7ed; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🐾 PawProject</h1>
            <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 16px;">Adoption Request Update</p>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: white; padding: 40px 30px; margin: 0;">
            <h3 style="color: #1f2937; text-align: center; font-size: 24px; margin-bottom: 20px;">Hello, ${userFullname}</h3>
            
            <p style="color: #4b5563; font-size: 17px; line-height: 1.6; text-align: center; margin: 20px 0;">
              We regret to inform you that your previously approved adoption request for <strong style="color: #1f2937;">${petName}</strong> has been <span style="color: #f97316; font-weight: bold;">denied</span>.
            </p>
            
            <!-- Message Box -->
            <div style="background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%); border-left: 5px solid #f97316; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 2px 8px rgba(249, 115, 22, 0.1);">
              <h4 style="color: #9a3412; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 10px;">📢</span> Important Information
              </h4>
              <p style="color: #c2410c; margin: 0; line-height: 1.6; font-size: 15px;">
                ${adminMessage || "After careful evaluation during the interview process, we regret to inform you that we are unable to proceed with this adoption. We appreciate your time and understanding. Please contact us if you have any questions or concerns about this decision."}
              </p>
            </div>
            
            <!-- Contact Box -->
            <div style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="color: #1e40af; margin: 0; font-size: 15px; line-height: 1.5;">
                <strong>📞 Need Clarification?</strong> Please don't hesitate to contact us. We're here to answer any questions you may have.
              </p>
            </div>
            
            <!-- Paw Print Decoration -->
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 40px; opacity: 0.3;">🐾 🐾 🐾</span>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 3px solid #f97316;">
            <p style="color: #6b7280; font-size: 15px; margin: 0 0 10px 0; line-height: 1.5;">
              We sincerely apologize for any inconvenience this may cause. 🧡
            </p>
            <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} PawProject. All rights reserved.
            </p>
          </div>
        </div>
      `;
      break;

    case "returned":
      subject = `Update: ${petName} Has Been Returned`;
      html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #faf5ff; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🐾 PawProject</h1>
            <p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 16px;">Adoption Status Update</p>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: white; padding: 40px 30px; margin: 0;">
            <h3 style="color: #1f2937; text-align: center; font-size: 24px; margin-bottom: 20px;">Hello, ${userFullname}</h3>
            
            <p style="color: #4b5563; font-size: 17px; line-height: 1.6; text-align: center; margin: 20px 0;">
              We wanted to inform you that <strong style="color: #1f2937;">${petName}</strong> has been <span style="color: #a855f7; font-weight: bold;">returned</span> and is now available for adoption again.
            </p>
            
            <!-- Message Box -->
            <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-left: 5px solid #a855f7; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 2px 8px rgba(168, 85, 247, 0.1);">
              <h4 style="color: #6b21a8; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 10px;">ℹ️</span> Additional Information
              </h4>
              <p style="color: #7e22ce; margin: 0; line-height: 1.6; font-size: 15px;">
                ${adminMessage || "The pet has been returned to our care and is now available for adoption. Thank you for your understanding during this process."}
              </p>
            </div>
            
            <!-- Info Box -->
            <div style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="color: #1e40af; margin: 0; font-size: 15px; line-height: 1.5;">
                <strong>🏠 Looking to Adopt?</strong> ${petName} is now available again. If you're interested, please visit our adoption page!
              </p>
            </div>
            
            <!-- Paw Print Decoration -->
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 40px; opacity: 0.3;">🐾 🐾 🐾</span>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 3px solid #a855f7;">
            <p style="color: #6b7280; font-size: 15px; margin: 0 0 10px 0; line-height: 1.5;">
              Thank you for your understanding and continued support! 💜
            </p>
            <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} PawProject. All rights reserved.
            </p>
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
