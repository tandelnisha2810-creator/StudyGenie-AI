const axios = require("axios");

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-3.5-turbo";

// Build a prompt for different chat modes.
const buildPrompt = (mode, message, options = {}) => {
  switch (mode) {
    case "quiz":
      return `Generate ${options.count || 5} multiple choice quiz questions on the topic: "${message}".
Format as:
Q1. Question text?
a) Option 1
b) Option 2
c) Option 3
d) Option 4
Answer: a

Repeat for all questions.`;
    case "summarize":
      return `Summarize the following study notes in a clear and concise way, highlighting the main ideas:\n\n${message}`;
    case "explain":
      return `Explain the concept of "${message}" at a ${options.level || "intermediate"} level.\nUse simple, study-friendly language and include examples where helpful.`;
    case "doubt":
      return `Help me solve this doubt or problem:\n\n${message}\n\nProvide a clear step-by-step explanation or solution.`;
    default:
      return `${message}`;
  }
};

// Call OpenRouter API with Mistral model.
const callOpenRouter = async (userMessage) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    console.error("OpenRouter API key missing. Set OPENROUTER_API_KEY in .env.");
    throw new Error("OpenRouter API key is not configured.");
  }

  console.log("OpenRouter endpoint:", OPENROUTER_BASE_URL);
  console.log("Model:", OPENROUTER_MODEL);

  const requestBody = {
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  };

  console.log("Request body:", JSON.stringify(requestBody));

  try {
    const response = await axios.post(OPENROUTER_BASE_URL, requestBody, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8081",
        "X-Title": "StudyGenie AI",
      },
    });

    console.log("API response status:", response.status);
    console.log("API response data:", JSON.stringify(response.data));

    const reply = response.data?.choices?.[0]?.message?.content;
    if (!reply || typeof reply !== "string") {
      console.error("OpenRouter response missing expected content path.", response.data);
      throw new Error("OpenRouter returned an unexpected response format.");
    }

    return reply.trim();
  } catch (error) {
    console.error("OpenRouter error:", error?.response?.status, error?.message || error);
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data?.error?.message || error.response.statusText || JSON.stringify(error.response.data);
      console.error("OpenRouter response error body:", JSON.stringify(error.response.data));

      if (status === 401) {
        throw new Error("OpenRouter API key is invalid or expired.");
      } else if (status === 429) {
        throw new Error("OpenRouter API rate limit exceeded. Please try again later.");
      } else if (status === 500 || status === 503) {
        throw new Error("OpenRouter service is temporarily unavailable. Please try again later.");
      } else {
        throw new Error(`OpenRouter request failed: ${status} - ${errorMessage}`);
      }
    } else if (error.request) {
      console.error("No response from OpenRouter:", error.message);
      throw new Error("Failed to reach OpenRouter service. Please check your internet connection.");
    } else {
      console.error("OpenRouter request error:", error.message);
      throw error;
    }
  }
};

// Express request handler for chat messages.
exports.handleChatRequest = async (req, res) => {
  try {
    const { message, mode = "general", count = 5, level = "intermediate" } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      console.warn("Invalid request: message is required or empty");
      return res.status(400).json({ success: false, error: "Invalid request: message is required." });
    }

    console.log("Chat request received - Mode:", mode, "Message length:", message.length);

    const prompt = buildPrompt(mode, message, { count, level });

    console.log("Calling OpenRouter with model and prompt...");
    const reply = await callOpenRouter(prompt);

    // Return clean text response to frontend
    res.set("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(reply);
  } catch (error) {
    console.error("Chat controller error:", error?.message || error);
    const errMsg = error?.message || "AI service temporarily unavailable. Please try again later.";
    console.error("Error response to client:", errMsg);
    return res.status(500).json({ success: false, error: errMsg });
  }
};

exports.callOpenRouter = callOpenRouter;
