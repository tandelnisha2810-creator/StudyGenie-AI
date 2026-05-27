const mongoose = require('mongoose');

const { Schema } = mongoose;

const voiceNoteSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      default: 'Voice Note',
      trim: true,
    },
    transcript: {
      type: String,
      default: '',
      trim: true,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    quiz: {
      type: Schema.Types.Mixed,
      default: [],
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    audioUrl: {
      type: String,
      default: '',
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

voiceNoteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('VoiceNote', voiceNoteSchema);