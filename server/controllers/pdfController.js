const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pdfParse = require("pdf-parse");

// pdf-parse@1.1.1 is a CommonJS export where `require('pdf-parse')` returns the parse function.
// Keep a fallback for safety (in case runtime differs).
const pdfParseFn = pdfParse;
if (typeof pdfParseFn !== "function") {
  console.error("pdf-parse import mismatch: expected function, got:", typeof pdfParseFn);
}




const PdfNote = require("../models/PdfNote");
const { callOpenRouter } = require("./chatController");

// Kept for backward compatibility; memoryStorage does not write temp files.
// If you later switch back to diskStorage, ensure this uploadDir exists.
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


// Use memoryStorage to make upload+pdf parsing reliable across Expo/web.
// This avoids reliance on req.file.path which can be missing/incorrect on some platforms.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});


const formatPdf = (doc) => {
  const obj = doc.toObject({ versionKey: false });
  const { _id, ...rest } = obj;
  return {
    id: _id.toString(),
    ...rest,
    uploadDate: obj.uploadDate || obj.createdAt,
  };
};

const buildPrompt = (extractedText) => {
  return `You are an educational AI assistant. Analyze this PDF content and generate:\n\n1. Short summary (2-5 sentences)\n2. Important exam topics (as a bullet list, 5-10 items)\n3. Key concepts (as a concise list, 8-15 items)\n4. Keywords (exact keywords list, 10-20 items)\n\nReturn your answer in this JSON ONLY (no markdown):\n{\n  "summary": string,\n  "importantPoints": string[],\n  "keywords": string[]\n}\n\nPDF content:\n${extractedText}`;
};

const safeJsonParse = (text) => {
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;
    const slice = text.slice(jsonStart, jsonEnd + 1);
    return JSON.parse(slice);
  } catch {
    return null;
  }
};

exports.uploadPdfController = async (req, res) => { // controller only (multer is mounted by routes)
  try {
    console.log("================================");
    console.log("PDF UPLOAD HIT");
    console.log("OPENROUTER_API_KEY present:", !!process.env.OPENROUTER_API_KEY);
    console.log("================================");
    console.log("req.body:", req.body);
    console.log(
      "req.file:",
      req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            hasBuffer: !!req.file.buffer,
          }
        : null
    );

    if (!req.file) {
      return res.status(400).json({ success: false, error: "PDF file missing" });
    }

    if (!req.file.buffer) {
      return res.status(400).json({ success: false, error: "PDF buffer missing" });
    }

    const userId = (req.body?.userId || "").toString();
    console.log("userId:", userId);

    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    console.log("================================");
    console.log("PDF CONTROLLER DEBUG START");
    console.log("userId:", userId);
    console.log("file buffer length:", req.file.buffer?.length);
    console.log("================================");

    console.log("Starting PDF parsing...");

    if (typeof pdfParseFn !== "function") {
      return res.status(500).json({ success: false, error: "pdf-parse import mismatch" });
    }

    const parsed = await pdfParseFn(req.file.buffer);
    console.log("PDF parsed successfully");

    const extractedText = (parsed.text || "").trim();
    console.log("Extracted text length:", extractedText.length);

    if (!extractedText) {
      return res.status(400).json({ success: false, error: "Could not extract text from PDF" });
    }

    const prompt = buildPrompt(extractedText.slice(0, 120000)); // cap for cost

    // Run AI generation in its own try/catch.
    // If AI fails, we still persist the extractedText to Mongo.
    let aiResponse = "";
    try {
      console.log("Calling OpenRouter API...");
      console.log("OPENROUTER_API_KEY exists:", !!process.env.OPENROUTER_API_KEY);

      const response = await callOpenRouter(prompt);
      aiResponse = response || "";

      console.log("AI summary generated successfully");
    } catch (aiErr) {
      console.error("AI summary generation failed:", aiErr);
      aiResponse = "";
    }


    const parsedJson = aiResponse ? safeJsonParse(aiResponse) : null;

    const summary = parsedJson?.summary || "";
    const importantPoints = Array.isArray(parsedJson?.importantPoints)
      ? parsedJson.importantPoints.map(String)
      : [];
    const keywords = Array.isArray(parsedJson?.keywords)
      ? parsedJson.keywords.map(String)
      : [];

    console.log("AI summary generated");

    const doc = await PdfNote.create({
      userId,
      fileName: req.file.originalname,
      extractedText,
      summary,
      importantPoints,
      keywords,
      uploadDate: new Date(),
    });

    const formatted = formatPdf(doc);
    return res.status(201).json({ success: true, pdf: formatted });
  } catch (error) {
    console.error("uploadPdf error:", error);
    return res.status(500).json({ success: false, error: "Unable to process PDF" });
  }
};



exports.getPdfNotes = async (req, res) => {
  try {
    const userId = (req.query.userId || "").toString();
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId query is required" });
    }

    const docs = await PdfNote.find({ userId }).sort({ uploadDate: -1 }).lean();
    const pdfNotes = docs.map((d) => ({
      ...d,
      id: d._id.toString(),
      uploadDate: d.uploadDate || d.createdAt,
    }));

    return res.status(200).json({ success: true, pdfNotes });
  } catch (error) {
    console.error("getPdfNotes error:", error);
    return res.status(500).json({ success: false, error: "Unable to load PDFs" });
  }
};

exports.getPdfNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "Missing id" });

    const doc = await PdfNote.findById(id);
    if (!doc) return res.status(404).json({ success: false, error: "PDF not found" });

    return res.status(200).json({ success: true, pdfNote: formatPdf(doc) });
  } catch (error) {
    console.error("getPdfNoteById error:", error);
    return res.status(500).json({ success: false, error: "Unable to load PDF" });
  }
};

exports.deletePdfNote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "Missing id" });

    const doc = await PdfNote.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, error: "PDF not found" });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("deletePdfNote error:", error);
    return res.status(500).json({ success: false, error: "Unable to delete PDF" });
  }
};

