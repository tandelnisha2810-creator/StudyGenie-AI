const PlannerTask = require("../models/plannerTaskModel");
const PlannerExamReminder = require("../models/plannerReminderModel");
const PlannerTimerHistory = require("../models/plannerTimerModel");

function getUserId(req) {
  return (
    req.query?.userId ||
    req.body?.userId ||
    req.headers?.["x-user-id"] ||
    req.headers?.["x-userid"]

  );
}

// Upcoming exams: exams whose combined examDate+examTime is in the future (local time)
function toMs(dateYmd, timeHm) {
  const [y, m, d] = String(dateYmd).split("-").map((x) => Number(x));
  const [hh, mm] = String(timeHm).split(":").map((x) => Number(x));
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return dt.getTime();
}

async function getStats(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const [tasks, reminders, timerHistory] = await Promise.all([
      PlannerTask.find({ userId }).select("completed").lean(),
      PlannerExamReminder.find({ userId }).select("examDate examTime").lean(),
      PlannerTimerHistory.find({ userId }).select("completed").lean(),
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    const now = Date.now();
    const upcomingExams = reminders.filter((r) => toMs(r.examDate, r.examTime) > now).length;

    const completedPomodoroSessions = timerHistory.filter((t) => t.completed).length;

    return res.json({
      success: true,
      stats: {
        totalTasks,
        pendingTasks,
        completedTasks,
        upcomingExams,
        completedPomodoroSessions,
      },
    });
  } catch (e) {
    console.error("getStats error", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getStats };

