import axios from "axios";
import { Platform } from "react-native";

const API_HOST =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
const API_BASE_URL = `${API_HOST}/api/pdf`;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

const safeData = (resp) => {
  if (!resp || !resp.data) throw new Error("Invalid API response");
  return resp.data;
};

export const uploadPdf = async (formData, userId) => {
  const fd = formData instanceof FormData ? formData : new FormData(formData);

  // Ensure userId is present (backend multer parses text fields into req.body).
  if (!fd.has?.("userId")) {
    fd.append("userId", userId);
  }

  console.log("Uploading PDF - fd:", fd);

  const resp = await axios.post(`${API_BASE_URL}/upload`, fd, {
    // IMPORTANT: DO NOT set Content-Type manually.
    timeout: 60000,
  });
  const data = safeData(resp);
  return data.pdf || null;
};


export const getPdfNotes = async (userId) => {
  const resp = await axiosInstance.get("", { params: { userId } });
  const data = safeData(resp);
  return data.pdfNotes || [];
};

export const deletePdfNote = async (id) => {
  const resp = await axiosInstance.delete(`/${id}`);
  const data = safeData(resp);
  return data.success ?? true;
};

export const getPdfNoteById = async (id) => {
  const resp = await axiosInstance.get(`/${id}`);
  const data = safeData(resp);
  return data.pdfNote || null;
};

