/**
 * App Constants
 * Centralized app-wide constants
 */

export const APP_NAME = "StudyGenie AI";
export const APP_VERSION = "1.0.0";

export const API_ENDPOINTS = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
};

export const FEATURE_FLAGS = {
  enableOfflineMode: false,
  enableAnalytics: true,
  enableNotifications: false,
};

export const LIMITS = {
  maxNoteTitle: 100,
  maxNoteContent: 10000,
  maxMessageLength: 4000,
  maxQuizQuestions: 20,
};

export const DELAY_CONSTANTS = {
  SHORT: 300,
  MEDIUM: 500,
  LONG: 1000,
};

// Feature descriptions
export const FEATURES = {
  aiChat: {
    title: "AI Chat",
    description: "Chat with your personal AI tutor",
    icon: "MessageCircle",
  },
  notes: {
    title: "Notes",
    description: "Create and manage study notes",
    icon: "BookOpen",
  },
  quiz: {
    title: "Quiz AI",
    description: "Generate quiz questions instantly",
    icon: "Zap",
  },
  summarize: {
    title: "Summarize",
    description: "Summarize your study materials",
    icon: "BookMarked",
  },
};

// Error messages
export const ERROR_MESSAGES = {
  networkError: "Network error. Please check your connection.",
  authError: "Authentication failed. Please login again.",
  firebaseError: "Database error. Please try again.",
  geminiError: "AI service error. Please try again.",
  validationError: "Please fill in all required fields.",
};

// Success messages
export const SUCCESS_MESSAGES = {
  noteSaved: "Note saved successfully",
  noteDeleted: "Note deleted successfully",
  noteUpdated: "Note updated successfully",
  logoutSuccess: "Logged out successfully",
  settingsSaved: "Settings saved successfully",
};
