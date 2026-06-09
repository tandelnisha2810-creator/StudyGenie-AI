const express = require("express");
const router = express.Router();

const firebaseAdminController = require("../controllers/firebaseAdminController");
const authMiddleware = require("../middleware/authMiddleware");

// Deletes the currently authenticated Firebase user (Admin only)
router.delete("/user", authMiddleware, firebaseAdminController.deleteFirebaseUser);

module.exports = router;

