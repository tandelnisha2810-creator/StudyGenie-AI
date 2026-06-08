const mongoose = require("mongoose");

const PreferencesSchema = new mongoose.Schema(
  {
    darkMode: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    studyReminders: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    // Not required at schema level so auto-creation via GET /api/profile can be dynamic.
    // API-level validation enforces non-empty on Update Profile.
    fullName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },


    profileImage: {
      type: String,
      trim: true,
      default: "",
    },

    preferences: {
      type: PreferencesSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

UserProfileSchema.pre("validate", function (next) {
  if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
    return next(new Error("Invalid email format"));
  }
  next();
});

module.exports = mongoose.model("UserProfile", UserProfileSchema);

