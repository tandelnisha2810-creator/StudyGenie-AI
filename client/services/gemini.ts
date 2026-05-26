/**
 * Gemini API Service (now powered by Grok AI)
 * Handles all AI chat interactions by forwarding requests to the backend.
 */

const API_BASE_URL = "http://localhost:5000/api/chat";

type ChatMode = "general" | "quiz" | "summarize" | "explain" | "doubt";

interface ChatRequestBody {
  message: string;
  mode: ChatMode;
  count?: number;
  level?: string;
}

interface ChatResponse {
  success?: boolean;
  reply?: string;
  message?: string;
  error?: string;
}

const postChatToServer = async (
  message: string,
  mode: ChatMode,
  options: { count?: number; level?: string } = {}
): Promise<string> => {
  try {
    const payload: ChatRequestBody = {
      message,
      mode,
      count: options.count,
      level: options.level,
    };

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data: ChatResponse = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new Error(`Invalid JSON from chat server: ${responseText}`);
    }

    console.log("Chat API response:", {
      status: response.status,
      ok: response.ok,
      body: data,
    });

    const parsedMessage = data.reply ?? data.message;

    if (!response.ok) {
      const serverMessage = data.error || parsedMessage || response.statusText;
      throw new Error(`Chat server error: ${response.status} ${serverMessage}`);
    }

    if (data.success === false) {
      const serverMessage = data.error || parsedMessage || "AI service returned failure.";
      throw new Error(serverMessage);
    }

    if (!parsedMessage) {
      throw new Error("Invalid server response: missing reply or message field.");
    }

    console.log("Parsed AI message:", parsedMessage);
    return parsedMessage;
  } catch (error) {
    console.error("Error calling StudyGenie backend:", error);
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error("Sorry, I encountered an error. Please try again.");
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  return postChatToServer(message, "general");
};

export const generateQuiz = async (
  topic: string,
  count: number = 5
): Promise<string> => {
  return postChatToServer(topic, "quiz", { count });
};

export const summarizeNotes = async (notes: string): Promise<string> => {
  return postChatToServer(notes, "summarize");
};

export const explainConcept = async (
  concept: string,
  level: "beginner" | "intermediate" | "advanced" = "intermediate"
): Promise<string> => {
  return postChatToServer(concept, "explain", { level });
};

export const solveDoubt = async (doubt: string): Promise<string> => {
  return postChatToServer(doubt, "doubt");
};
