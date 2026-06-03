const mongoose = require("mongoose");

const plannerReminderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, trim: true },
    examName: { type: String, required: true, trim: true },
    subject: { type: String, trim: true, default: "" },
    examDate: { type: String, required: true, trim: true }, // "YYYY-MM-DD"
    examTime: { type: String, required: true, trim: true }, // "11:00 AM" or "HH:mm"
    notificationEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlannerExamReminder", plannerReminderSchema);

