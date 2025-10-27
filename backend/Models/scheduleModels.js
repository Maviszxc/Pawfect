const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const scheduleSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    startNotificationSent: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        email: String,
        fullname: String,
        notified: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

scheduleSchema.index({ scheduledDate: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ reminderSent: 1, scheduledDate: 1 });

module.exports = mongoose.model("Schedule", scheduleSchema);
