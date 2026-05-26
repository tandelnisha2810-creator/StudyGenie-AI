const express = require("express");
const router = express.Router();
const { handleChatRequest } = require("../controllers/chatController");

router.post("/", handleChatRequest);

module.exports = router;
