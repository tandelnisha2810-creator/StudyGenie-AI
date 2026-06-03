const express = require("express");
const router = express.Router();

const { getStats } = require("../controllers/plannerStatsController");

router.get("/", getStats);

module.exports = router;

