const admin = require("firebase-admin");

// Load service account JSON from local file (do not log key material).
const serviceAccount = require("./serviceAccountKey.json");

let app = null;

function initFirebaseAdmin() {
  if (app) return app;

  console.log("[firebaseAdmin] initFirebaseAdmin starting");

  if (admin.apps && admin.apps.length) {
    app = admin.app();
    const existingProjectId = app?.options?.projectId;
    if (existingProjectId) {
      console.log("Firebase Admin initialized successfully");
      console.log("[firebaseAdmin] Detected project ID:", existingProjectId);
    }
    return app;
  }

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ||
    (serviceAccount?.project_id ? `${serviceAccount.project_id}.appspot.com` : undefined);

  if (storageBucket) {
    console.log("[firebaseAdmin] Using Firebase Storage bucket:", storageBucket);
  } else {
    console.log("[firebaseAdmin] No Firebase Storage bucket configured");
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(storageBucket ? { storageBucket } : {}),
  });

  console.log("Firebase Admin initialized successfully");

  // Prefer project_id from service account JSON; fall back to initialized app options.
  const detectedProjectId = serviceAccount?.project_id || app?.options?.projectId;
  if (detectedProjectId) {
    console.log("[firebaseAdmin] Detected project ID:", detectedProjectId);
  } else {
    console.log("[firebaseAdmin] Detected project ID:", "(unknown)");
  }

  return app;
}

function getFirebaseAdmin() {
  initFirebaseAdmin();
  return admin;
}

module.exports = { getFirebaseAdmin };


