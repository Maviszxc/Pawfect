const Schedule = require("../Models/scheduleModels");
const User = require("../Models/userModels");
// ✅ CRITICAL: Import the entire module, not destructured functions
const scheduleEmailService = require("../Utilities/scheduleEmailService");

// ✅ Add debug logging to verify the import
console.log("📧 Email service imported:", {
  hasCreationEmail:
    typeof scheduleEmailService.sendScheduleCreationEmail === "function",
  hasReminderEmail:
    typeof scheduleEmailService.sendScheduleReminderEmail === "function",
  hasLiveEmail: typeof scheduleEmailService.sendLiveStartedEmail === "function",
  allKeys: Object.keys(scheduleEmailService),
});

// Create new schedule
exports.createSchedule = async (req, res) => {
  try {
    const { title, description, scheduledDate, duration } = req.body;
    const createdBy = req.user.id;

    console.log("📅 Creating new schedule:", {
      title,
      scheduledDate,
      createdBy,
    });

    if (!title || !description || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and scheduled date are required",
      });
    }

    // Validate scheduled date is in the future
    const scheduleDate = new Date(scheduledDate);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date must be in the future",
      });
    }

    // Get all users to notify (excluding archived users)
    const users = await User.find({
      isArchived: { $ne: true },
      verified: true,
    }).select("email fullname");

    console.log(`📧 Found ${users.length} users to notify`);

    const schedule = new Schedule({
      title,
      description,
      scheduledDate: scheduleDate,
      duration: duration || 60,
      createdBy,
      participants: users.map((user) => ({
        user: user._id,
        email: user.email,
        fullname: user.fullname,
        notified: false,
      })),
    });

    await schedule.save();

    // Send creation emails to all users (async - don't wait for completion)
    sendEmailsToParticipants(schedule, "creation").catch((error) => {
      console.error("❌ Error sending creation emails:", error);
    });

    res.status(201).json({
      success: true,
      message: "Schedule created successfully and notifications sent to users",
      schedule,
    });
  } catch (error) {
    console.error("❌ Error creating schedule:", error);
    res.status(500).json({
      success: false,
      message: "Error creating schedule",
      error: error.message,
    });
  }
};

// Get all schedules
exports.getAllSchedules = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    const schedules = await Schedule.find(filter)
      .populate("createdBy", "fullname email")
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (error) {
    console.error("❌ Error fetching schedules:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching schedules",
      error: error.message,
    });
  }
};

// Get upcoming schedules
exports.getUpcomingSchedules = async (req, res) => {
  try {
    const now = new Date();
    const schedules = await Schedule.find({
      scheduledDate: { $gte: now },
      status: { $in: ["scheduled", "live"] },
    })
      .populate("createdBy", "fullname email")
      .sort({ scheduledDate: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (error) {
    console.error("❌ Error fetching upcoming schedules:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching upcoming schedules",
      error: error.message,
    });
  }
};

// Update schedule status to live (when admin starts camera)
exports.startLiveStream = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    // Update status to live
    schedule.status = "live";
    schedule.startNotificationSent = true;
    await schedule.save();

    // Send live started emails to all participants (async)
    sendEmailsToParticipants(schedule, "live").catch((error) => {
      console.error("❌ Error sending live started emails:", error);
    });

    res.status(200).json({
      success: true,
      message: "Live stream started and notifications sent",
      schedule,
    });
  } catch (error) {
    console.error("❌ Error starting live stream:", error);
    res.status(500).json({
      success: false,
      message: "Error starting live stream",
      error: error.message,
    });
  }
};

// Update schedule status to completed
exports.completeLiveStream = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      { status: "completed" },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Live stream marked as completed",
      schedule,
    });
  } catch (error) {
    console.error("❌ Error completing live stream:", error);
    res.status(500).json({
      success: false,
      message: "Error completing live stream",
      error: error.message,
    });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await Schedule.findByIdAndDelete(scheduleId);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting schedule:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting schedule",
      error: error.message,
    });
  }
};

// ✅ Helper function to send emails to all participants
async function sendEmailsToParticipants(schedule, emailType) {
  console.log(
    `📧 Starting to send ${emailType} emails to ${schedule.participants.length} participants`
  );

  const emailPromises = schedule.participants.map(async (participant) => {
    try {
      console.log(`📧 Sending ${emailType} email to: ${participant.email}`);

      switch (emailType) {
        case "creation":
          await scheduleEmailService.sendScheduleCreationEmail(
            participant.email,
            participant.fullname,
            schedule
          );
          console.log(`✅ Creation email sent to ${participant.email}`);
          break;
        case "reminder":
          await scheduleEmailService.sendScheduleReminderEmail(
            participant.email,
            participant.fullname,
            schedule
          );
          console.log(`✅ Reminder email sent to ${participant.email}`);
          break;
        case "live":
          await scheduleEmailService.sendLiveStartedEmail(
            participant.email,
            participant.fullname,
            schedule
          );
          console.log(`✅ Live email sent to ${participant.email}`);
          break;
        default:
          console.error(`❌ Unknown email type: ${emailType}`);
      }

      // Mark participant as notified for the specific email type
      if (emailType === "creation") {
        participant.notified = true;
      }
    } catch (error) {
      console.error(
        `❌ Failed to send ${emailType} email to ${participant.email}:`,
        error.message
      );
    }
  });

  await Promise.allSettled(emailPromises);

  // Save the updated participants if needed
  if (emailType === "creation") {
    try {
      await schedule.save();
      console.log(`✅ Schedule saved with notification status`);
    } catch (error) {
      console.error(`❌ Failed to save schedule:`, error);
    }
  }

  console.log(`✅ Finished sending ${emailType} emails`);
}
