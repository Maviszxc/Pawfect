// Utilities/emailService.js
// Choose ONE of the following options by uncommenting it

// ============================================
// OPTION 1: RESEND (RECOMMENDED - EASIEST)
// ============================================
// Install: npm install resend
// Get API key from: https://resend.com
// Free tier: 100 emails/day

// const { Resend } = require("resend");
// require("dotenv").config();

// const resend = new Resend(process.env.RESEND_API_KEY);

// const sendOtpEmail = async (email, otp) => {
//   try {
//     const { data, error } = await resend.emails.send({
//       from: "PawProject <onboarding@resend.dev>", // Change to your verified domain
//       to: [email],
//       subject: "Verification Code - PawProject",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//           <div style="text-align: center; margin-bottom: 30px;">
//             <h1 style="color: #FF6B35; margin: 0;">PawProject</h1>
//           </div>
//           <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px; text-align: center;">
//             <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
//             <p style="color: #666; font-size: 16px;">Your verification code is:</p>
//             <div style="background-color: white; border: 2px dashed #FF6B35; border-radius: 8px; padding: 20px; margin: 20px 0;">
//               <h1 style="font-size: 36px; color: #FF6B35; letter-spacing: 8px; margin: 0;">${otp}</h1>
//             </div>
//             <p style="color: #666; font-size: 14px; margin-top: 20px;">This code is valid for 1 hour.</p>
//             <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
//           </div>
//           <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
//             <p>© ${new Date().getFullYear()} PawProject. All rights reserved.</p>
//           </div>
//         </div>
//       `,
//     });

//     if (error) {
//       console.error("❌ Resend error:", error);
//       throw new Error(`Failed to send email: ${error.message}`);
//     }

//     console.log("✅ Email sent successfully via Resend:", data.id);
//     return { success: true, messageId: data.id };
//   } catch (error) {
//     console.error("❌ Email sending failed:", error);
//     throw error;
//   }
// };

// module.exports = { sendOtpEmail };

// ============================================
// OPTION 2: SENDGRID (POPULAR CHOICE)
// ============================================
// Install: npm install @sendgrid/mail
// Get API key from: https://sendgrid.com
// Free tier: 100 emails/day

/*
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOtpEmail = async (email, otp) => {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_VERIFIED_SENDER, // Must be verified in SendGrid
      subject: 'Verification Code - PawProject',
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
    console.log('✅ Email sent successfully via SendGrid:', result[0].statusCode);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ SendGrid error:', error.response?.body || error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendOtpEmail };
*/

// ============================================
// OPTION 3: NODEMAILER WITH RETRY (If you must use Gmail)
// ============================================
// NOTE: This may still fail on cloud platforms
// Requires Gmail App Password (not regular password)
// Get App Password: https://myaccount.google.com/apppasswords


const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter with better cloud compatibility
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASSWORD, // Must be App Password
    },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 3,
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });
};

let transporter = createTransporter();

// Retry logic for sending emails
const sendEmailWithRetry = async (mailOptions, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) {
        transporter = createTransporter();
        console.log(`🔄 Retry attempt ${i + 1}/${retries}`);
      }

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent via Nodemailer:', result.messageId);
      return result;
    } catch (error) {
      console.error(`❌ Attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
};

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"PawProject" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: 'Verification Code - PawProject',
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

  return await sendEmailWithRetry(mailOptions);
};

module.exports = { sendOtpEmail };

