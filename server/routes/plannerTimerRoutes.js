const express = require("express");
const router = express.Router();

const {
  listTimers,
  saveTimerSession,
} = require("../controllers/plannerTimerController");

router.get("/", listTimers);
router.post("/", saveTimerSession);

module.exports = router;

