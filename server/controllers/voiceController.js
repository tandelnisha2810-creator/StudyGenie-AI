const fs = require('fs');
const path = require('path');
const VoiceNote = require('../models/VoiceNote');
const { callOpenRouter } = require('./chatController');
const {
  audioUrlToDiskPath,
  buildQuizPrompt,
  buildSummaryPrompt,
  normalizeText,
  parsePossibleJson,
  stripCodeFences,
  toNumber,
  toPublicAudioUrl,
} = require('../utils/voiceHelpers');

const uploadsDir = path.join(__dirname, '..', 'uploads');

function extractResponseText(response) {
  if (typeof response === 'string') return response;

  if (response && typeof response === 'object') {
    if (typeof response.content === 'string') return response.content;
    if (typeof response.text === 'string') return response.text;
    if (typeof response.message === 'string') return response.message;
    if (response.data && typeof response.data === 'string') return response.data;
    if (response.data && typeof response.data.content === 'string') return response.data.content;
    if (response.data && typeof response.data.text === 'string') return response.data.text;
    if (response.data && typeof response.data.message === 'string') return response.data.message;
    if (response.data && Array.isArray(response.data.choices) && response.data.choices[0]) {
      const choice = response.data.choices[0];
      if (choice.message && typeof choice.message.content === 'string') return choice.message.content;
      if (typeof choice.text === 'string') return choice.text;
    }
  }

  return '';
}

async function invokeOpenRouter(prompt) {
  const attempts = [
    () => callOpenRouter(prompt),
    () => callOpenRouter({ prompt }),
    () => callOpenRouter([{ role: 'user', content: prompt }]),
    () => callOpenRouter({ messages: [{ role: 'user', content: prompt }] }),
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      const response = await attempt();
      const text = extractResponseText(response);
      return text || response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function parseQuizField(value) {
  const parsed = parsePossibleJson(value, []);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.quiz)) return parsed.quiz;
    if (Array.isArray(parsed.questions)) return parsed.questions;
  }
  return parsed || [];
}

function normalizeSummaryResponse(aiResponse) {
  const cleaned = stripCodeFences(extractResponseText(aiResponse));
  const parsed = parsePossibleJson(cleaned, null);

  if (parsed && typeof parsed === 'object') {
    if (typeof parsed.summary === 'string') return normalizeText(parsed.summary);
    if (typeof parsed.text === 'string') return normalizeText(parsed.text);
    if (typeof parsed.content === 'string') return normalizeText(parsed.content);
  }

  return normalizeText(cleaned);
}

function normalizeQuizResponse(aiResponse) {
  const cleaned = stripCodeFences(extractResponseText(aiResponse));
  const parsed = parsePossibleJson(cleaned, null);

  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.quiz)) return parsed.quiz;
    if (Array.isArray(parsed.questions)) return parsed.questions;
    if (Array.isArray(parsed.items)) return parsed.items;
  }

  return cleaned;
}

async function createVoiceNote(req, res) {
  try {
    const userId = normalizeText(req.body.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required.',
      });
    }

    const title = normalizeText(req.body.title) || 'Voice Note';
    const transcript = normalizeText(req.body.transcript);
    const summary = normalizeText(req.body.summary);
    const duration = toNumber(req.body.duration, 0);
    const quiz = parseQuizField(req.body.quiz);

    const file = req.file;
    const audioUrl = file
      ? toPublicAudioUrl(req, `/uploads/voice-notes/${file.filename}`)
      : toPublicAudioUrl(req, normalizeText(req.body.audioUrl));

    const voiceNote = await VoiceNote.create({
      userId,
      title,
      transcript,
      summary,
      quiz,
      duration,
      audioUrl,
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      voiceNote,
      note: voiceNote,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create voice note.',
      error: error.message,
    });
  }
}

async function getVoiceNotesByUser(req, res) {
  try {
    const userId = normalizeText(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required.',
      });
    }

    const notes = await VoiceNote.find({ userId }).sort({ createdAt: -1, _id: -1 });

    return res.json({
      success: true,
      notes,
      voiceNotes: notes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load voice notes.',
      error: error.message,
    });
  }
}

async function deleteVoiceNote(req, res) {
  try {
    const { id } = req.params;
    const note = await VoiceNote.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Voice note not found.',
      });
    }

    const diskPath = audioUrlToDiskPath(note.audioUrl, uploadsDir);
    if (diskPath) {
      try {
        await fs.promises.unlink(diskPath);
      } catch (fileError) {
        if (fileError.code !== 'ENOENT') {
          console.warn('Unable to delete voice note audio file:', fileError.message);
        }
      }
    }

    await note.deleteOne();

    return res.json({
      success: true,
      message: 'Voice note deleted successfully.',
      deletedId: id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete voice note.',
      error: error.message,
    });
  }
}

async function summarizeTranscript(req, res) {
  try {
    const transcript = normalizeText(req.body.transcript);

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: 'transcript is required.',
      });
    }

    const aiResponse = await invokeOpenRouter(buildSummaryPrompt(transcript));
    const summary = normalizeSummaryResponse(aiResponse) || transcript;

    return res.json({
      success: true,
      summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to summarize transcript.',
      error: error.message,
    });
  }
}

async function generateQuiz(req, res) {
  try {
    const transcript = normalizeText(req.body.transcript);
    const count = Math.max(1, Math.min(10, toNumber(req.body.count, 5)));

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: 'transcript is required.',
      });
    }

    const aiResponse = await invokeOpenRouter(buildQuizPrompt(transcript, count));
    const quiz = normalizeQuizResponse(aiResponse);

    return res.json({
      success: true,
      quiz,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate quiz.',
      error: error.message,
    });
  }
}

module.exports = {
  createVoiceNote,
  createVoice: createVoiceNote,
  deleteVoiceNote,
  deleteVoice: deleteVoiceNote,
  generateQuiz,
  generateVoiceQuiz: generateQuiz,
  getVoiceNotesByUser,
  getVoiceNotes: getVoiceNotesByUser,
  summarizeTranscript,
  summarizeVoice: summarizeTranscript,
};