const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const chatRoutes = require('./routes/chatRoutes');
const noteRoutes = require('./routes/noteRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const voiceRoutes = require('./routes/voiceRoutes');

dotenv.config();
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


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;