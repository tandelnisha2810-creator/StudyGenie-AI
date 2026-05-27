const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {
  createVoiceNote,
  deleteVoiceNote,
  generateQuiz,
  getVoiceNotesByUser,
  summarizeTranscript,
} = require('../controllers/voiceController');

const router = express.Router();

const voiceUploadsDir = path.join(__dirname, '..', 'uploads', 'voice-notes');
fs.mkdirSync(voiceUploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, voiceUploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

function handleAudioUpload(req, res, next) {
  upload.single('audio')(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid audio upload.',
      });
    }

    return next();
  });
}

router.post('/create', handleAudioUpload, createVoiceNote);
router.post('/', handleAudioUpload, createVoiceNote);
router.post('/api/voice-notes', handleAudioUpload, createVoiceNote);

router.get('/user/:userId', getVoiceNotesByUser);
// Support both /api/voice-notes?userId=... and /api/voice-notes/:userId
router.get('/:userId', getVoiceNotesByUser);
router.get('/', (req, res, next) => {
  // If a query param userId exists, forward to the same controller.
  if (req.query && req.query.userId) {
    req.params.userId = String(req.query.userId);
    return getVoiceNotesByUser(req, res, next);
  }
  return res.status(400).json({
    success: false,
    message: 'userId is required (via query param or /:userId route).',
  });
});
router.delete('/:id', deleteVoiceNote);
router.post('/summarize', summarizeTranscript);
router.post('/quiz', generateQuiz);


module.exports = router;