const express = require("express");
const router = express.Router();

const userProfileController = require("../controllers/userProfileController");
const multer = require('multer');

// Use memory storage so uploaded file can be forwarded to Firebase Storage
const storage = multer.memoryStorage();

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
	fileFilter: (req, file, cb) => {
		const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (allowed.includes(file.mimetype)) return cb(null, true);
		return cb(new Error('Invalid file type'));
	},
});

// NOTE: auth middleware is expected to set req.user.{id}.
// We'll wire it in server.js.

router.get("/", userProfileController.getProfile);
router.post("/", userProfileController.createProfile);
router.put("/", userProfileController.updateProfile);
router.put("/preferences", userProfileController.updatePreferences);
router.post('/upload-photo', upload.single('photo'), userProfileController.uploadPhoto);
router.delete("/", userProfileController.deleteProfile);


module.exports = router;

