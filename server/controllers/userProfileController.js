const UserProfile = require("../models/UserProfile");
const Note = require("../models/Note");
const PdfNote = require("../models/PdfNote");
const PlannerReminder = require("../models/plannerReminderModel");
const PlannerTask = require("../models/plannerTaskModel");
const PlannerTimer = require("../models/plannerTimerModel");
const VoiceNote = require("../models/VoiceNote");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary lazily to ensure env vars are loaded by the time a request comes in
function ensureCloudinaryConfigured() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("[CLOUDINARY CONFIG ERROR]");
    console.error("  Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME || "(undefined)");
    console.error("  API Key Exists:", !!process.env.CLOUDINARY_API_KEY);
    console.error("  API Secret Exists:", !!process.env.CLOUDINARY_API_SECRET);
    throw new Error("Cloudinary environment variables not configured (check .env file)");
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("[CLOUDINARY CONFIG] Configured successfully");
}

function getUserId(req) {
  // Prefer stable Firebase uid when available.
  return req?.user?.uid || req?.user?.id;
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function coerceBoolean(value, defaultValue) {
  if (typeof value === "boolean") return value;
  return defaultValue;
}

function parseMaybeUrlLike(str) {
  // Keep validation minimal to avoid blocking valid URLs.
  // UI is already allowing arbitrary URL strings.
  return typeof str === "string" ? str.trim() : str;
}

function extractCloudinaryPublicId(imageUrl) {
  if (!isNonEmptyString(imageUrl)) return null;

  const uploadIndex = imageUrl.indexOf("/upload/");
  if (uploadIndex === -1) return null;

  let remainder = imageUrl.slice(uploadIndex + "/upload/".length);
  const queryIndex = remainder.indexOf("?");
  if (queryIndex !== -1) remainder = remainder.slice(0, queryIndex);

  const lastDot = remainder.lastIndexOf(".");
  if (lastDot === -1) return null;
  remainder = remainder.slice(0, lastDot);

  const parts = remainder.split("/");
  if (parts.length > 1 && /^v\d+$/.test(parts[1])) {
    return [parts[0], ...parts.slice(2)].join("/");
  }

  return remainder;
}

function buildProfileResponse(profileDoc) {
  // MongoDB is the single source of truth.
  // Return fields required by the client.
  if (!profileDoc) return null;
  return {
    userId: profileDoc.userId,
    email: profileDoc.email,
    fullName: profileDoc.fullName,
    profileImage: profileDoc.profileImage,
    createdAt: profileDoc.createdAt,
    updatedAt: profileDoc.updatedAt,
    preferences: profileDoc.preferences,
  };
}

exports.getProfile = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const { email, displayName, photoURL } = req.user || {};

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        // Only seed creation fields; never overwrite existing Mongo values.
        $setOnInsert: {
          userId,
          ...(typeof displayName === "string" ? { fullName: displayName.trim() } : {}),
          ...(typeof email === "string" ? { email: email.trim() } : {}),
          ...(typeof photoURL === "string" ? { profileImage: photoURL.trim() } : {}),
          preferences: {
            darkMode: false,
            notifications: true,
            studyReminders: true,
          },
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // Temporary logs (required tags)
    console.log(`[PROFILE READ] userId=${userId}`);
    console.log("[PROFILE READ]", buildProfileResponse(profile));

    // Detect upsert-create and log creation
    // Heuristic: createdAt == updatedAt typically only on insert.
    if (
      profile?.createdAt &&
      profile?.updatedAt &&
      String(profile.createdAt) === String(profile.updatedAt)
    ) {
      console.log(`[PROFILE CREATE] userId=${userId}`);
      console.log("[PROFILE CREATE]", buildProfileResponse(profile));
    }

    console.log(`[PROFILE READ] mongoDocId=${profile?._id?.toString?.() || profile?._id}`);

    const profileData = buildProfileResponse(profile) || {
      preferences: {
        darkMode: false,
        notifications: true,
        studyReminders: true,
      },
    };

    if (!profileData.preferences) {
      profileData.preferences = {
        darkMode: false,
        notifications: true,
        studyReminders: true,
      };
    }

    return res.status(200).json({ success: true, data: profileData });
  } catch (err) {
    console.log(`[PROFILE READ] failed userId=${userId}:`, err?.message || err);
    // Most likely validation error; still return 400 as requested.
    return res.status(400).json({ success: false, message: err?.message || "Failed to load/create profile" });
  }
};

exports.createProfile = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const { fullName, email, profileImage, darkMode, notifications, studyReminders } = req.body || {};

    // Minimal strict validation
    if (!isNonEmptyString(fullName)) {
      return res.status(400).json({ success: false, message: "fullName is required" });
    }
    if (!isNonEmptyString(email)) {
      return res.status(400).json({ success: false, message: "email is required" });
    }
    if (profileImage !== undefined && typeof profileImage !== "string") {
      return res.status(400).json({ success: false, message: "profileImage must be a string" });
    }

    const doc = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          fullName: fullName.trim(),
          email: email.trim(),
          profileImage: typeof profileImage === "string" ? parseMaybeUrlLike(profileImage) : "",
          preferences: {
            darkMode: coerceBoolean(darkMode, false),
            notifications: coerceBoolean(notifications, true),
            studyReminders: coerceBoolean(studyReminders, true),
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // If createProfile is called, log creation only when insert happens.
    if (
      doc?.createdAt &&
      doc?.updatedAt &&
      String(doc.createdAt) === String(doc.updatedAt)
    ) {
      console.log(`[PROFILE CREATE] userId=${userId}`);
      console.log("[PROFILE CREATE]", buildProfileResponse(doc));
    }

    return res.status(201).json({ success: true, data: buildProfileResponse(doc) });
  } catch (err) {
    console.log(`[PROFILE CREATE] failed userId=${userId}:`, err?.message || err);
    return res.status(500).json({ success: false, message: err?.message || "Failed to create profile" });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch (parseError) {
        console.warn("[PROFILE UPDATE] req.body is a string and JSON.parse failed:", parseError?.message);
      }
    }

    const { fullName, profileImage } = req.body || {};

    console.log("[PROFILE UPDATE REQUEST] userId=", userId);
    console.log("REQUEST BODY:", req.body);
    console.log("Incoming Name:", fullName, "type:", typeof fullName);
    console.log("Incoming Image:", profileImage, "type:", typeof profileImage);

    const updateData = {};

    if (typeof fullName === "string" && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }

    if (typeof profileImage === "string" && profileImage.trim()) {
      updateData.profileImage = parseMaybeUrlLike(profileImage);
    }

    if (Object.keys(updateData).length === 0) {
      console.log("[PROFILE UPDATE] no valid update fields supplied. body keys:", Object.keys(req.body || {}));
      return res.status(400).json({
        success: false,
        message: "Nothing to update. Send fullName or profileImage in request body.",
      });
    }

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: updateData,
        $setOnInsert: {
          userId,
          email: req.user?.email || "",
          preferences: {
            darkMode: false,
            notifications: true,
            studyReminders: true,
          },
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("Mongo Update Result:", updatedProfile);
    console.log("[PROFILE UPDATE RESPONSE]", buildProfileResponse(updatedProfile));
    console.log(`[PROFILE UPDATE] userId=${userId}`);

    return res.status(200).json({
      success: true,
      data: buildProfileResponse(updatedProfile),
      profile: buildProfileResponse(updatedProfile),
    });
  } catch (err) {
    console.log(`[PROFILE UPDATE] failed userId=${userId}:`, err?.message || err);
    return res.status(500).json({ success: false, message: err?.message || "Failed to update profile" });
  }
};

exports.updatePreferences = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const payload = req.body || {};
    const preferences = payload.preferences || payload;
    const { darkMode, notifications, studyReminders } = preferences;

    console.log("[PREFERENCES REQUEST]", {
      userId,
      body: req.body,
      normalizedPreferences: { darkMode, notifications, studyReminders },
    });

    const update = {};

    if (darkMode !== undefined) {
      if (typeof darkMode !== "boolean") {
        return res.status(400).json({ success: false, message: "preferences.darkMode must be boolean" });
      }
      update["preferences.darkMode"] = darkMode;
    }

    if (notifications !== undefined) {
      if (typeof notifications !== "boolean") {
        return res.status(400).json({ success: false, message: "preferences.notifications must be boolean" });
      }
      update["preferences.notifications"] = notifications;
    }

    if (studyReminders !== undefined) {
      if (typeof studyReminders !== "boolean") {
        return res.status(400).json({ success: false, message: "preferences.studyReminders must be boolean" });
      }
      update["preferences.studyReminders"] = studyReminders;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const { email, photoURL, displayName } = req.user || {};

    const preferencesPayload = {
      darkMode: typeof darkMode === "boolean" ? darkMode : false,
      notifications: typeof notifications === "boolean" ? notifications : true,
      studyReminders: typeof studyReminders === "boolean" ? studyReminders : true,
    };

    const updateObject = {
      $set: {
        preferences: preferencesPayload,
      },
      $setOnInsert: {
        userId,
        ...(typeof displayName === "string" ? { fullName: displayName.trim() } : {}),
        ...(typeof email === "string" ? { email: email.trim() } : {}),
        ...(typeof photoURL === "string" ? { profileImage: photoURL.trim() } : {}),
      },
    };

    console.log("[PREFERENCES UPDATE]");
    console.log("Incoming Body:", req.body);
    console.log("FINAL MONGODB UPDATE:", JSON.stringify(updateObject, null, 2));

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      updateObject,
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );

    console.log("[PREFERENCES RESPONSE]", profile?.preferences);
    console.log(`[PROFILE PREFERENCES UPDATE] userId=${userId}`);

    return res.status(200).json({ success: true, preferences: profile?.preferences });
  } catch (err) {
    console.log(`[PROFILE PREFERENCES UPDATE] failed userId=${userId}:`, err?.message || err);
    return res.status(500).json({ success: false, message: err?.message || "Failed to update preferences" });
  }
};

exports.uploadPhoto = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ success: false, message: "No file uploaded" });

    // Ensure Cloudinary is configured at request time
    ensureCloudinaryConfigured();

    // Extract file extension safely
    const originalName = file.originalname || '';
    const ext = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() : '';
    const validExt = ext && /^[a-z0-9]{1,6}$/.test(ext) ? ext : 'jpg';

    // Create simple public_id without path separators
    const publicId = `profile_${userId}_${Date.now()}`;
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    console.log("[PROFILE UPLOAD] Original filename:", originalName);
    console.log("[PROFILE UPLOAD] Extracted extension:", ext);
    console.log("[PROFILE UPLOAD] Valid extension:", validExt);
    console.log("[PROFILE UPLOAD] Generated publicId:", publicId);
    console.log("[PROFILE UPLOAD] Mime type:", file.mimetype);

    const uploadOptions = {
      folder: "studygenie/profile-images",
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
    };

    console.log("[PROFILE UPLOAD] Cloudinary upload options:", JSON.stringify(uploadOptions, null, 2));

    const uploadResult = await cloudinary.uploader.upload(dataUri, uploadOptions);

    console.log("[PROFILE UPLOAD] Cloudinary Upload Success:", {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    });

    const imageUrl = uploadResult.secure_url;
    if (!imageUrl) throw new Error('Cloudinary did not return an image URL');

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          profileImage: imageUrl,
        },
        $setOnInsert: {
          userId,
          email: req.user?.email || "",
          fullName: req.user?.displayName || "",
          preferences: {
            darkMode: false,
            notifications: true,
            studyReminders: true,
          },
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(`[PROFILE UPLOAD SUCCESS] userId=${userId} savedImageUrl=${imageUrl}`);

    return res.status(200).json({ success: true, imageUrl, data: buildProfileResponse(profile) });
  } catch (err) {
    console.error(`[PROFILE UPLOAD ERROR] userId=${userId}:`, err?.message);
    console.error("[PROFILE UPLOAD ERROR STACK]:", err?.stack);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to upload photo",
      error: process.env.NODE_ENV === "development" ? err?.message : undefined,
    });
  }
};

exports.deleteProfile = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const profile = await UserProfile.findOne({ userId });
    let cloudinaryDeleted = false;

    if (profile?.profileImage?.includes("res.cloudinary.com")) {
      try {
        ensureCloudinaryConfigured();
        const publicId = extractCloudinaryPublicId(profile.profileImage);
        if (publicId) {
          const destroyResult = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
          cloudinaryDeleted = destroyResult?.result === "ok" || destroyResult?.result === "not found";
          console.log(`[PROFILE DELETE] Cloudinary destroy result for ${publicId}:`, destroyResult);
        } else {
          console.log(`[PROFILE DELETE] Could not parse Cloudinary public_id from URL: ${profile.profileImage}`);
        }
      } catch (destroyError) {
        console.warn(`[PROFILE DELETE] Cloudinary destroy failed for userId=${userId}:`, destroyError?.message || destroyError);
      }
    }

    const [profileResult, noteResult, pdfResult, reminderResult, taskResult, timerResult, voiceResult] = await Promise.all([
      UserProfile.deleteOne({ userId }),
      Note.deleteMany({ userId }),
      PdfNote.deleteMany({ userId }),
      PlannerReminder.deleteMany({ userId }),
      PlannerTask.deleteMany({ userId }),
      PlannerTimer.deleteMany({ userId }),
      VoiceNote.deleteMany({ userId }),
    ]);

    console.log(
      `[PROFILE DELETE] userId=${userId} profileDeleted=${profileResult.deletedCount} notesDeleted=${noteResult.deletedCount} pdfsDeleted=${pdfResult.deletedCount} remindersDeleted=${reminderResult.deletedCount} tasksDeleted=${taskResult.deletedCount} timersDeleted=${timerResult.deletedCount} voiceNotesDeleted=${voiceResult.deletedCount} cloudinaryDeleted=${cloudinaryDeleted}`
    );

    return res.status(200).json({ success: true, message: "Profile and related account data deleted" });
  } catch (err) {
    console.log(`[PROFILE DELETE] failed userId=${userId}:`, err?.message || err);
    return res.status(500).json({ success: false, message: err?.message || "Failed to delete profile" });
  }
};


