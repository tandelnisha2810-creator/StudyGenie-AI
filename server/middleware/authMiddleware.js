const hasDebug = process.env.AUTH_DEBUG === "1";
function debugLog(...args) {
  if (hasDebug) console.log("[authMiddleware]", ...args);
}

const { getFirebaseAdmin } = require("../firebaseAdmin");



function extractToken(req) {
  const header = req.headers?.authorization;
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length !== 2) return null;
  const scheme = parts[0];
  const token = parts[1];
  if (!/^Bearer$/i.test(scheme)) return null;
  return token;
}

module.exports = async function authMiddleware(req, res, next) {
  try {

    const authHeader = req.headers?.authorization;
    debugLog("Authorization header:", authHeader);

    const token = extractToken(req);
    debugLog("Extracted token present:", !!token);

    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });


    // Frontend sends Firebase ID token as: Authorization: Bearer <token>
    // Verify it using Firebase Admin SDK and extract uid.
    // console.log("[authMiddleware] AUTH HEADER:", req.headers?.authorization);

    // Token debug logs for tracing (requested).
    console.log("[authMiddleware] received token length:", token?.length);
    console.log("[authMiddleware] received token first20:", token?.slice(0, 20));



    const admin = getFirebaseAdmin();

    let decodedToken;
    try {
      console.log("[authMiddleware] Verifying Firebase ID token...");
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (err) {
      console.log("[authMiddleware] verifyIdToken failed:", err?.code || err?.name, err?.message);

      debugLog("verifyIdToken failed:", err?.code || err?.name, err?.message);
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    debugLog("Decoded Firebase token:", {
      uid: decodedToken?.uid,
      email: decodedToken?.email,
    });

    const userId = decodedToken?.uid;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Attach useful decoded token claims so profile creation can be fully dynamic (no hardcoded placeholders).
    // Note: Firebase ID token typically contains: uid, email. displayName/photoURL may or may not be present.
    req.user = {
      id: String(userId),
      uid: String(userId),
      email: decodedToken?.email || "",
      displayName: decodedToken?.name || decodedToken?.displayName || "",
      photoURL: decodedToken?.picture || decodedToken?.photoURL || "",
    };

    return next();


  } catch (e) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

