const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      default: "General",
      enum: ["React", "JavaScript", "DSA", "DBMS", "OS", "CN", "General"],
    },
    tags: {
      type: [String],
      default: [],
    },
    color: {
      type: String,
      enum: ["yellow", "blue", "green", "pink", "purple"],
      default: "yellow",
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for sorting by pinned status and date
NoteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

module.exports = mongoose.model("Note", NoteSchema);
