const path = require('path');
const dotenv = require('dotenv');

// CRITICAL: Load env vars BEFORE importing any modules that depend on them
dotenv.config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const chatRoutes = require('./routes/chatRoutes');
const noteRoutes = require('./routes/noteRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const voiceRoutes = require('./routes/voiceRoutes');

const plannerTaskRoutes = require('./routes/plannerTaskRoutes');
const plannerReminderRoutes = require('./routes/plannerReminderRoutes');
const plannerTimerRoutes = require('./routes/plannerTimerRoutes');
const plannerStatsRoutes = require('./routes/plannerStatsRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const authMiddleware = require('./middleware/authMiddleware');
connectDB();



const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'StudyGenie API is running.' });
});

app.use('/api/chat', chatRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/pdf', pdfRoutes);

// Voice Notes
app.use('/api/voice', voiceRoutes);
app.use('/api/voice-notes', voiceRoutes);

// Planner (tasks/reminders/timers/stats)
app.use('/api/planner/tasks', plannerTaskRoutes);
app.use('/api/planner/reminders', plannerReminderRoutes);
app.use('/api/planner/timers', plannerTimerRoutes);
app.use('/api/planner/stats', plannerStatsRoutes);

// Profile (MongoDB)
app.use('/api/profile', (req, res, next) => {
  console.log('[PROFILE ROUTE] HEADERS:', {
    authorization: req.headers.authorization,
    'content-type': req.headers['content-type'],
  });
  console.log('[PROFILE ROUTE] BODY BEFORE AUTH:', req.body);
  next();
}, authMiddleware, userProfileRoutes);


app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);

  const statusCode = error?.statusCode || error?.status || 500;
  const message = error?.message || 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    message,
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;