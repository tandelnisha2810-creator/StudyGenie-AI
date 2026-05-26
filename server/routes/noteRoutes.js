const express = require("express");
const router = express.Router();
const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  summarizeNote,
} = require("../controllers/noteController");

// NOTE: protect middleware not available in this repo; keep delete unprotected


router.post("/", createNote);
router.get("/", getNotes);
router.get("/:id", getNoteById);
router.put("/:id", updateNote);
// Delete note
router.delete("/:id", deleteNote);
router.post("/:id/summarize", summarizeNote);

module.exports = router;
