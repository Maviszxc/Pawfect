// Utilities/scheduleEmailService.js
const sgMail = require("@sendgrid/mail");
const { getEmailConfig } = require("./emailConfig");
require("dotenv").config();

if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY is not configured!");
  throw new Error("SENDGRID_API_KEY is required");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Format date for display
const formatDate = (date) => {
  return new Date(date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

// Send schedule creation email
const sendScheduleCreationEmail = async (email, fullname, schedule) => {
  try {
    console.log(`📧 Sending creation email to: ${email}`);

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B35; margin: 0;">PawProject</h1>
            <h2 style="color: #333; margin-top: 10px;">New Live Stream Scheduled!</h2>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px;">
            <h3 style="color: #333; text-align: center;">Hello, ${fullname}!</h3>
            
            <p style="color: #666; font-size: 16px; text-align: center;">
              A new live stream has been scheduled and we'd love for you to join us!
            </p>
            
            <div style="background-color: white; border: 2px solid #FF6B35; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #333; margin-top: 0;">📅 ${schedule.title}</h4>
              <p style="color: #666; margin: 10px 0;"><strong>Description:</strong> ${
                schedule.description
              }</p>
              <p style="color: #666; margin: 10px 0;"><strong>Date & Time:</strong> ${formatDate(
                schedule.scheduledDate
              )}</p>
              <p style="color: #666; margin: 10px 0;"><strong>Duration:</strong> ${
                schedule.duration
              } minutes</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #666; font-size: 14px;">
                <strong>You'll receive:</strong><br>
                • A reminder 1 hour before the stream starts<br>
                • A notification when the live stream begins
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PawProject. All rights reserved.</p>
          </div>
        </div>
      `;

    const msg = {
      to: email,
      from: process.env.SENDGRID_VERIFIED_SENDER,
      subject: `🎉 New Live Stream: ${schedule.title}`,
      html: htmlContent,
    };

    const result = await sgMail.send(msg);
    console.log(`✅ Creation email sent to ${email}`);
    return {
      success: true,
      messageId: result[0].headers["x-message-id"],
    };
  } catch (error) {
    console.error(`❌ Failed to send creation email to ${email}:`, error);
    throw error;
  }
};

// Send schedule reminder email (1 hour before)
const sendScheduleReminderEmail = async (email, fullname, schedule) => {
  try {
    console.log(`⏰ Sending 1-hour reminder to: ${email}`);

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B35; margin: 0;">PawProject</h1>
            <h2 style="color: #333; margin-top: 10px;">Live Stream Starting Soon!</h2>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px;">
            <h3 style="color: #333; text-align: center;">Hello, ${fullname}!</h3>
            
            <p style="color: #666; font-size: 16px; text-align: center;">
              Don't forget! The live stream starts in 1 hour.
            </p>
            
            <div style="background-color: white; border: 2px solid #FF6B35; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #333; margin-top: 0;">📅 ${schedule.title}</h4>
              <p style="color: #666; margin: 10px 0;">${
                schedule.description
              }</p>
              <p style="color: #666; margin: 10px 0;"><strong>Starts at:</strong> ${formatDate(
                schedule.scheduledDate
              )}</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #666; font-size: 14px;">
                Get ready to join us for an exciting live stream about our furry friends!
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PawProject. All rights reserved.</p>
          </div>
        </div>
      `;

    const msg = {
      to: email,
      from: process.env.SENDGRID_VERIFIED_SENDER,
      subject: `⏰ Reminder: ${schedule.title} starts in 1 hour!`,
      html: htmlContent,
    };

    const result = await sgMail.send(msg);
    console.log(`✅ Reminder email sent to ${email}`);
    return {
      success: true,
      messageId: result[0].headers["x-message-id"],
    };
  } catch (error) {
    console.error(`❌ Failed to send reminder email to ${email}:`, error);
    throw error;
  }
};

// Send live started email
const sendLiveStartedEmail = async (email, fullname, schedule) => {
  try {
    console.log(`🔴 Sending live started notification to: ${email}`);

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF6B35; margin: 0;">PawProject</h1>
            <h2 style="color: #333; margin-top: 10px;">Live Stream Started!</h2>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 10px; padding: 30px;">
            <h3 style="color: #333; text-align: center;">Hello, ${fullname}!</h3>
            
            <p style="color: #666; font-size: 16px; text-align: center;">
              The live stream has started! Join us now to watch live.
            </p>
            
            <div style="background-color: white; border: 2px solid #FF6B35; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #333; margin-top: 0;">🔴 ${schedule.title}</h4>
              <p style="color: #666; margin: 10px 0;">${
                schedule.description
              }</p>
              <p style="color: #666; margin: 10px 0;"><strong>Started at:</strong> ${formatDate(
                new Date()
              )}</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; background-color: #FF6B35; padding: 15px; border-radius: 8px;">
              <a href="${
                process.env.FRONTEND_URL ||
                "https://biyayaanimalcare.vercel.app/live"
              }/live" 
                 style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;">
                 🎥 Watch Live Now
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #666; font-size: 14px;">
                Click the button above to join the live stream!
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PawProject. All rights reserved.</p>
          </div>
        </div>
      `;

    const msg = {
      to: email,
      from: process.env.SENDGRID_VERIFIED_SENDER,
      subject: `🔴 LIVE NOW: ${schedule.title}`,
      html: htmlContent,
    };

    const result = await sgMail.send(msg);
    console.log(`✅ Live started email sent to ${email}`);
    return {
      success: true,
      messageId: result[0].headers["x-message-id"],
    };
  } catch (error) {
    console.error(`❌ Failed to send live started email to ${email}:`, error);
    throw error;
  }
};

module.exports = {
  sendScheduleCreationEmail,
  sendScheduleReminderEmail,
  sendLiveStartedEmail,
};
