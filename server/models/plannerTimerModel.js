const mongoose = require("mongoose");

const plannerTimerHistorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 0 },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    completed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlannerTimerHistory", plannerTimerHistorySchema);

