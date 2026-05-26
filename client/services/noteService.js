import axios from "axios";
import { Platform } from "react-native";

const API_HOST =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
const API_BASE_URL = `${API_HOST}/api/notes`;

console.log("noteService: Initialized with API_BASE_URL:", API_BASE_URL);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});


axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API Response [${response.status}]:`,
      response.config.method?.toUpperCase(),
      response.config.url
    );

    return response;
  },
  (error) => {
    console.error(
      "❌ API Error:",
      error.response?.status,
      error.message
    );

    return Promise.reject(error);
  }
);

const safeData = (resp) => {
  if (!resp || !resp.data) {
    throw new Error("Invalid API response: missing data");
  }
  return resp.data;
};

export const getNotes = async (userId) => {
  try {
    console.log("📖 noteService.getNotes - userId:", userId);

    const resp = await axiosInstance.get("", {
      params: { userId },
    });

    const data = safeData(resp);
    console.log("✅ getNotes response - count:", data.notes?.length);

    return data.notes || [];
  } catch (error) {
    console.error("❌ noteService.getNotes error:", error.message);
    throw error;
  }
};

export const createNote = async (notePayload) => {
  try {
    console.log("✍️ noteService.createNote - payload:", JSON.stringify(notePayload, null, 2));

    const resp = await axiosInstance.post("", notePayload);

    const data = safeData(resp);
    console.log("✅ createNote response - note ID:", data.note?.id);

    if (!data.note) {
      throw new Error("createNote: response missing note object");
    }

    return data.note;
  } catch (error) {
    console.error("❌ noteService.createNote error:", error.message);
    throw error;
  }
};

export const updateNote = async (noteId, updatePayload) => {
  try {
    console.log("✏️ noteService.updateNote - id:", noteId, "payload:", updatePayload);

    const resp = await axiosInstance.put(`/${noteId}`, updatePayload);

    const data = safeData(resp);
    console.log("✅ updateNote response - note ID:", data.note?.id);

    return data.note;
  } catch (error) {
    console.error("❌ noteService.updateNote error:", error.message);
    throw error;
  }
};

export const deleteNote = async (noteId) => {
  try {
    console.log("🗑️ noteService.deleteNote - raw id:", noteId);

    const id = typeof noteId === "string" ? noteId : noteId?.toString?.();
    if (!id) {
      console.error("❌ noteService.deleteNote - missing/invalid noteId:", noteId);
      throw new Error("deleteNote: noteId is required");
    }

    // REQUIRED: use axios.delete(`${API_BASE_URL}/${id}`)
    console.log(
      "🌐 Sending DELETE request:",
      `${API_BASE_URL}/${id}`
    );

    const resp = await axios.delete(`${API_BASE_URL}/${id}`);

    console.log("📐 noteService.deleteNote - backend returned:", resp.status, resp.data);

    const data = safeData(resp);
    console.log("✅ deleteNote response data:", data);

    return data?.success ?? true;
  } catch (error) {
    console.error(
      "❌ noteService.deleteNote error:",
      error?.response?.status,
      error?.response?.data || "",
      error.message
    );
    throw error;
  }
};


export const summarizeNote = async (noteId) => {
  try {
    console.log("✨ noteService.summarizeNote - id:", noteId);

    const resp = await axiosInstance.post(`/${noteId}/summarize`);

    const data = safeData(resp);
    console.log("✅ summarizeNote response - success");

    return data.note || null;
  } catch (error) {
    console.error("❌ noteService.summarizeNote error:", error.message);
    throw error;
  }
};

