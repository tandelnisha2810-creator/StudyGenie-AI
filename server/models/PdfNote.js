const mongoose = require("mongoose");

const PdfNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    extractedText: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
      default: "",
    },
    importantPoints: {
      type: [String],
      default: [],
    },
    keywords: {
      type: [String],
      default: [],
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

PdfNoteSchema.index({ userId: 1, uploadDate: -1 });

module.exports = mongoose.model("PdfNote", PdfNoteSchema);

