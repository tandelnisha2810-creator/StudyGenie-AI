import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Platform } from "react-native";

const DEFAULT_BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

function getBaseUrl() {
  return ENV_BASE_URL || DEFAULT_BASE_URL;
}

async function request(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  console.log("[profileService] request headers:", headers);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = json?.message || json?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json;
}

function safeFirst20(str) {
  if (!str) return "";
  return str.slice(0, 20);
}

function waitForCurrentUser(timeoutMs = 5000) {
  return new Promise((resolve) => {
    const currentUser = auth?.currentUser;
    if (currentUser) return resolve(currentUser);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      () => {
        unsubscribe();
        resolve(null);
      }
    );

    setTimeout(() => {
      unsubscribe();
      resolve(auth?.currentUser || null);
    }, timeoutMs);
  });
}

async function getFreshIdToken() {
  let currentUser = auth?.currentUser;
  if (!currentUser) {
    currentUser = await waitForCurrentUser();
  }

  if (!currentUser) {
    throw new Error("No authenticated user available to request a fresh token");
  }

  const token = await currentUser.getIdToken(true);
  if (!token) {
    throw new Error("Unable to acquire authentication token");
  }

  console.log("[profileService] currentUser?.uid:", currentUser?.uid);
  console.log("[profileService] token length:", token?.length);
  console.log("[profileService] token first20:", safeFirst20(token));
  console.log("[profileService] forced refresh: true");

  return token;
}


export async function getProfile() {
  const token = await getFreshIdToken();
  const baseUrl = getBaseUrl();
  const json = await request(`${baseUrl}/api/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return json?.data;
}


export async function createProfile(payload) {
  const token = await getFreshIdToken();
  const baseUrl = getBaseUrl();
  const json = await request(`${baseUrl}/api/profile`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return json?.data;
}


export async function updateProfile(payload) {
  console.log("[profileService] updateProfile payload:", payload);
  const token = await getFreshIdToken();
  const baseUrl = getBaseUrl();
  const json = await request(`${baseUrl}/api/profile`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log("[profileService] updateProfile response:", json);

  return json?.data;
}




export async function updatePreferences(payload) {
  const token = await getFreshIdToken();
  const baseUrl = getBaseUrl();
  const json = await request(`${baseUrl}/api/profile/preferences`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return json?.data;
}


export async function uploadProfilePhoto(formData) {
  const token = await getFreshIdToken();
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/api/profile/upload-photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do not set Content-Type so the browser/node can set multipart boundary
    },
    body: formData,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json?.message || json?.error || `Upload failed (${res.status})`;
    throw new Error(message);
  }

  return {
    imageUrl: json?.imageUrl || json?.data?.imageUrl,
    profile: json?.data || null,
  };
}



export async function deleteProfile() {
  const token = await getFreshIdToken();
  const baseUrl = getBaseUrl();
  const json = await request(`${baseUrl}/api/profile`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return json;
}


