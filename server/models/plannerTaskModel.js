const mongoose = require("mongoose");

const plannerTaskSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true, default: "" },
    dueTime: { type: String, trim: true, default: "" }, // "HH:mm" or "11:30 AM" (client decides)
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Keep consistent with requested fields (timestamps map to createdAt/updatedAt)
module.exports = mongoose.model("PlannerTask", plannerTaskSchema);

