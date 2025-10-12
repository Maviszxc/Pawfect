const cron = require("node-cron");
const Schedule = require("../Models/scheduleModels");
const { sendScheduleReminderEmail } = require("./scheduleEmailService");

class ScheduleReminderService {
  constructor() {
    this.init();
  }

  init() {
    // Check every minute for schedules that need reminders
    cron.schedule("* * * * *", async () => {
      try {
        await this.checkReminders();
      } catch (error) {
        console.error("❌ Error in schedule reminder service:", error);
      }
    });

    console.log("✅ Schedule reminder service initialized");
  }

  async checkReminders() {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find schedules that are:
    // 1. Scheduled to start within the next hour
    // 2. Haven't had reminders sent yet
    // 3. Are still in 'scheduled' status
    const schedulesNeedingReminders = await Schedule.find({
      scheduledDate: {
        $gte: now,
        $lte: oneHourFromNow,
      },
      reminderSent: false,
      status: "scheduled",
    });

    for (const schedule of schedulesNeedingReminders) {
      try {
        console.log(
          `⏰ Sending 1-hour reminder for schedule: ${schedule.title}`
        );

        // Send reminder emails to all participants
        const emailPromises = schedule.participants.map(async (participant) => {
          try {
            await sendScheduleReminderEmail(
              participant.email,
              participant.fullname,
              schedule
            );
          } catch (error) {
            console.error(
              `❌ Failed to send reminder to ${participant.email}:`,
              error
            );
          }
        });

        await Promise.allSettled(emailPromises);

        // Mark reminder as sent
        schedule.reminderSent = true;
        await schedule.save();

        console.log(`✅ Reminder sent for schedule: ${schedule.title}`);
      } catch (error) {
        console.error(
          `❌ Failed to send reminder for schedule ${schedule._id}:`,
          error
        );
      }
    }
  }
}

module.exports = new ScheduleReminderService();
