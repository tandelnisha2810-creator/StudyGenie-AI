const { getFirebaseAdmin } = require("../firebaseAdmin");

exports.deleteFirebaseUser = async (req, res) => {
  try {
    const uid = req?.user?.uid || req?.user?.id;
    if (!uid) return res.status(401).json({ success: false, message: "Unauthorized" });

    console.log("[FIREBASE ADMIN DELETE] requested uid:", uid);

    const admin = getFirebaseAdmin();

    // Admin SDK deletion. This removes the Auth user permanently.
    await admin.auth().deleteUser(uid);

    console.log("[FIREBASE ADMIN DELETE] success uid:", uid);
    return res.status(200).json({ success: true, message: "Firebase user deleted" });
  } catch (err) {
    console.log("[FIREBASE ADMIN DELETE] failed:", err?.code || err?.name, err?.message);
    return res.status(500).json({ success: false, message: err?.message || "Failed to delete Firebase user" });
  }
};

