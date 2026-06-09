const admin = require("firebase-admin");
 
// Load service account JSON from local file (do not log key material).
const serviceAccount = require("./serviceAccountKey.json");
 
let app = null;
 
function normalizeServiceAccountKey(sa) {
  // Firebase Admin expects a valid private_key PEM.
  // Some JSON exports store it with escaped newlines (\\n). Normalize to real newlines.
  if (!sa?.private_key || typeof sa.private_key !== "string") return sa;

  const original = sa.private_key;
  const normalized = original.replace(/\\n/g, "\n");

  // Non-sensitive debug: check newline normalization happened.
  // (Do NOT log key material.)
  const originalHasEscapedNewlines = original.includes("\\n");
  const normalizedHasRealNewlines = normalized.includes("\n");

  console.log("[firebaseAdmin] serviceAccount.private_key newline normalization:", {
    originalHasEscapedNewlines,
    normalizedHasRealNewlines,
    originalLength: original.length,
    normalizedLength: normalized.length,
  });

  return {
    ...sa,
    private_key: normalized,
  };
}
 
function initFirebaseAdmin() {
  if (app) return app;
 
  console.log("[firebaseAdmin] initFirebaseAdmin starting");
 
  // Detect safe status even if already initialized elsewhere in the process.
  if (admin.apps && admin.apps.length) {
    app = admin.app();
    const existingProjectId = app?.options?.projectId;
    console.log("[firebaseAdmin] Using existing initialized app");
    console.log("[firebaseAdmin] serviceAccount.project_id:", serviceAccount?.project_id || "(unknown)");
    console.log("[firebaseAdmin] existingProjectId(app.options.projectId):", existingProjectId || "(unknown)");
    console.log("[firebaseAdmin] admin.apps.length:", admin.apps.length);
    return app;
  }
 
  const normalizedServiceAccount = normalizeServiceAccountKey(serviceAccount);
 
  // Safe, non-sensitive logs for debugging admin credential mismatches.
  console.log("[firebaseAdmin] serviceAccount.project_id:", serviceAccount?.project_id || "(unknown)");
  console.log(
    "[firebaseAdmin] serviceAccount.client_email:",
    serviceAccount?.client_email ? String(serviceAccount.client_email) : "(unknown)"
  );
  console.log("[firebaseAdmin] admin.apps.length:", admin.apps?.length || 0);
 
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ||
    (serviceAccount?.project_id ? `${serviceAccount.project_id}.appspot.com` : undefined);
 
  if (storageBucket) {
    console.log("[firebaseAdmin] Using Firebase Storage bucket:", storageBucket);
  } else {
    console.log("[firebaseAdmin] No Firebase Storage bucket configured");
  }
 
  app = admin.initializeApp({
    credential: admin.credential.cert(normalizedServiceAccount),
    ...(storageBucket ? { storageBucket } : {}),
  });
 
  console.log("Firebase Admin initialized successfully");
 
  // Prefer project_id from service account JSON; fall back to initialized app options.
  const detectedProjectId = serviceAccount?.project_id || app?.options?.projectId;
  console.log("[firebaseAdmin] Detected project ID:", detectedProjectId || "(unknown)");
  console.log("[firebaseAdmin] app.options.projectId:", app?.options?.projectId || "(unknown)");
 
  return app;
}
 
function getFirebaseAdmin() {
  // Ensure initialization happens exactly once per process.
  initFirebaseAdmin();
  console.log("[firebaseAdmin] getFirebaseAdmin called. admin.apps.length:", admin.apps?.length || 0);
  try {
    if (admin.apps && admin.apps.length) {
      const a = admin.app();
      console.log("[firebaseAdmin] active app.options.projectId:", a?.options?.projectId || "(unknown)");
    }
  } catch (e) {
    console.log("[firebaseAdmin] Could not read active app options:", e?.message || e);
  }
  return admin;
}
 
module.exports = { getFirebaseAdmin };


