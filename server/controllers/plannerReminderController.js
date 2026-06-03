const PlannerExamReminder = require("../models/plannerReminderModel");

function getUserId(req) {
  return (
    req.body?.userId ||
    req.query?.userId ||
    req.headers?.["x-user-id"] ||
    req.headers?.["x-userid"]

  );
}

async function listReminders(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const reminders = await PlannerExamReminder.find({ userId }).sort({ createdAt: -1 });
    return res.json({ success: true, reminders });
  } catch (e) {
    console.error("listReminders error", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createReminder(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const { examName, subject, examDate, examTime, notificationEnabled } = req.body || {};

    if (!examName || typeof examName !== "string") {
      return res.status(400).json({ success: false, message: "examName is required" });
    }
    if (!examDate || typeof examDate !== "string") {
      return res.status(400).json({ success: false, message: "examDate is required" });
    }
    if (!examTime || typeof examTime !== "string") {
      return res.status(400).json({ success: false, message: "examTime is required" });
    }

    const created = await PlannerExamReminder.create({
      userId,
      examName: examName.trim(),
      subject: typeof subject === "string" ? subject.trim() : "",
      examDate: examDate.trim(),
      examTime: examTime.trim(),
      notificationEnabled: typeof notificationEnabled === "boolean" ? notificationEnabled : true,
    });

    return res.status(201).json({ success: true, reminder: created });
  } catch (e) {
    console.error("createReminder error", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateReminder(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const { id } = req.params;
    const { examName, subject, examDate, examTime, notificationEnabled } = req.body || {};

    const updated = await PlannerExamReminder.findOneAndUpdate(
      { _id: id, userId },
      {
        ...(typeof examName === "string" ? { examName: examName.trim() } : {}),
        ...(typeof subject === "string" ? { subject: subject.trim() } : {}),
        ...(typeof examDate === "string" ? { examDate: examDate.trim() } : {}),
        ...(typeof examTime === "string" ? { examTime: examTime.trim() } : {}),
        ...(typeof notificationEnabled === "boolean" ? { notificationEnabled } : {}),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Reminder not found" });
    return res.json({ success: true, reminder: updated });
  } catch (e) {
    console.error("updateReminder error", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function deleteReminder(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const { id } = req.params;
    const deleted = await PlannerExamReminder.findOneAndDelete({ _id: id, userId });
    if (!deleted) return res.status(404).json({ success: false, message: "Reminder not found" });

    return res.json({ success: true, deletedId: id });
  } catch (e) {
    console.error("deleteReminder error", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { listReminders, createReminder, updateReminder, deleteReminder };

