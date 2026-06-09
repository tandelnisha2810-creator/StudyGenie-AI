import { auth } from "@/firebase";
import { Platform } from "react-native";

const DEFAULT_BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";


// Keep same env behavior as other services
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

function getBaseUrl() {
  return ENV_BASE_URL || DEFAULT_BASE_URL;
}

function safeJson(res) {
  return res.json().catch(() => null);
}

async function getFreshIdToken() {
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error("No authenticated user available");
  const token = await currentUser.getIdToken(true);
  if (!token) throw new Error("Unable to acquire authentication token");
  return token;
}

export async function deleteFirebaseUser() {
  const token = await getFreshIdToken();
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/api/firebase-auth/user`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await safeJson(res);
  if (!res.ok) {
    const message = json?.message || json?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json;
}

