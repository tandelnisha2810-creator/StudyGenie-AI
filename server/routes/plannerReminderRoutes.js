const express = require("express");
const router = express.Router();

const {
  listReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} = require("../controllers/plannerReminderController");

router.get("/", listReminders);
router.post("/", createReminder);
router.put("/:id", updateReminder);
router.delete("/:id", deleteReminder);

module.exports = router;

