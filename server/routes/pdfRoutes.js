const express = require("express");
const router = express.Router();
const {
  uploadPdfController,
  getPdfNotes,
  getPdfNoteById,
  deletePdfNote,
} = require("../controllers/pdfController");

// Mount middleware with explicit multer memory storage at the route level
// to ensure the expected multipart field name matches.
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post("/upload", upload.single("pdf"), uploadPdfController);

router.get("/", getPdfNotes);
router.get("/:id", getPdfNoteById);
router.delete("/:id", deletePdfNote);

module.exports = router;


