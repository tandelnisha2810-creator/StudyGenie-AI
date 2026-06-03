const PlannerTask = require("../models/plannerTaskModel");

function getUserId(req) {
  // If you add Firebase token middleware later, replace this with req.user.uid.
  return (
    req.body?.userId ||
    req.query?.userId ||
    req.headers?.["x-user-id"] ||
    req.headers?.["x-userid"]

  );
}

async function listTasks(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const tasks = await PlannerTask.find({ userId }).sort({ createdAt: -1 });
    return res.json({ success: true, tasks });
  } catch (e) {
    console.error("listTasks error", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createTask(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const { title, subject, dueTime, completed } = req.body || {};
    if (!title || typeof title !== "string") {
      return res.status(400).json({ success: false, message: "title is required" });
    }

    const created = await PlannerTask.create({
      userId,
      title: title.trim(),
      subject: typeof subject === "string" ? subject.trim() : "",
      dueTime: typeof dueTime === "string" ? dueTime.trim() : "",
      completed: typeof completed === "boolean" ? completed : false,
    });

    return res.status(201).json({ success: true, task: created });
  } catch (e) {
    console.error("createTask error", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateTask(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const { id } = req.params;
    const { title, subject, dueTime, completed } = req.body || {};

    const updated = await PlannerTask.findOneAndUpdate(
      { _id: id, userId },
      {
        ...(typeof title === "string" ? { title: title.trim() } : {}),
        ...(typeof subject === "string" ? { subject: subject.trim() } : {}),
        ...(typeof dueTime === "string" ? { dueTime: dueTime.trim() } : {}),
        ...(typeof completed === "boolean" ? { completed } : {}),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Task not found" });
    return res.json({ success: true, task: updated });
  } catch (e) {
    console.error("updateTask error", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function deleteTask(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const { id } = req.params;

    const deleted = await PlannerTask.findOneAndDelete({ _id: id, userId });
    if (!deleted) return res.status(404).json({ success: false, message: "Task not found" });

    return res.json({ success: true, deletedId: id });
  } catch (e) {
    console.error("deleteTask error", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
};

