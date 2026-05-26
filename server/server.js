// Load environment variables as early as possible
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const chatRoutes = require("./routes/chatRoutes");
const notesRoutes = require("./routes/notes");
const pdfRoutes = require("./routes/pdfRoutes");


// Safe debug: log presence (boolean) of essential env vars without exposing values without exposing values
console.debug("ENV: GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
console.debug("ENV: OPENROUTER_API_KEY present:", !!process.env.OPENROUTER_API_KEY);

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("StudyGenie AI Backend Running...");
});

app.use("/api/chat", chatRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/pdf", pdfRoutes);
console.log("PDF routes loaded");



app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Server error. Please try again later." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});