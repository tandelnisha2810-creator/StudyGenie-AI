const PlannerTimerHistory = require("../models/plannerTimerModel");

function getUserId(req) {
  return (
    req.body?.userId ||
    req.query?.userId ||
    req.headers?.["x-user-id"] ||
    req.headers?.["x-userid"]

  );
}

async function listTimers(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const timers = await PlannerTimerHistory.find({ userId }).sort({ createdAt: -1 });
    return res.json({ success: true, timers });
  } catch (e) {
    console.error("listTimers error", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function saveTimerSession(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const {
      durationMinutes,
      startedAt,
      endedAt,
      completed,
    } = req.body || {};

    if (typeof durationMinutes !== "number" || !Number.isFinite(durationMinutes)) {
      return res.status(400).json({ success: false, message: "durationMinutes is required" });
    }

    const start = startedAt ? new Date(startedAt) : new Date();
    const end = endedAt ? new Date(endedAt) : new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid startedAt/endedAt" });
    }

    const created = await PlannerTimerHistory.create({
      userId,
      durationMinutes,
      startedAt: start,
      endedAt: end,
      completed: typeof completed === "boolean" ? completed : true,
    });

    return res.status(201).json({ success: true, timer: created });
  } catch (e) {
    console.error("saveTimerSession error", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { listTimers, saveTimerSession };

