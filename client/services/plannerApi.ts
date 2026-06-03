// Backend API base URL helper for planner module

const DEFAULT_BASE_URL = "http://localhost:5000";

export function getPlannerApiBaseUrl() {
  // If you already use env vars in the app, wire them here.
  // Keeping it simple & robust for dev.
  return DEFAULT_BASE_URL;
}

