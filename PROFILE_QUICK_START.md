# Profile Management System - Quick Start Guide

**Get Your Profile System Running in 5 Minutes!**

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- MongoDB connection string ready
- Firebase project configured

### Step 1: Start Backend (2 minutes)

```bash
# Open terminal 1
cd server

# Check .env file has MONGO_URI
cat .env

# If MONGO_URI missing, add it:
echo 'MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/studygenie' >> .env

# Start server
npm run dev

# Expected output:
# MongoDB Connected: cluster0.mongodb.net
# Server running on port 5000
```

### Step 2: Start Frontend (2 minutes)

```bash
# Open terminal 2
cd client

# Start app
npm start

# Select your platform:
# - Press 'i' for iOS
# - Press 'a' for Android
# - Press 'w' for web
```

### Step 3: Test Profile (1 minute)

```
1. Open the app
2. Login with any Firebase account
3. Tap "Profile" tab at bottom
4. See your profile load
5. Try updating name or photo
6. Toggle preferences
7. Test logout
```

---

## ✨ Feature Showcase

### Avatar & Profile Info
```
User Avatar (initials or image)
├── Full Name (from database)
├── Email (from Firebase)
└── Joined Date (auto-created date)
```

### Edit Profile
```
Input Fields:
├── Full Name (editable)
└── Profile Photo URL (editable)

Button:
└── Update Profile (saves to MongoDB)
```

### Preferences
```
Toggles:
├── ☐ Dark Mode
├── ☐ Notifications  
└── ☐ Study Reminders

Button:
└── Save Preferences (saves to MongoDB)
```

### Account Actions
```
Buttons:
├── Logout (sign out + redirect to login)
└── Delete Account (permanent deletion)
```

---

## 🔧 Configuration

### Backend Setup

**File**: `server/.env`

```env
# MongoDB connection string
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/studygenie?retryWrites=true&w=majority

# Server port (optional)
PORT=5000

# Enable auth debugging (optional)
AUTH_DEBUG=0
```

### Frontend Setup

**File**: `client/firebase.js`

Already configured. If using different Firebase project:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 📱 What You'll See

### Profile Screen Loading
```
┌─────────────────────┐
│    Loading...       │
│     ⟳ spinner       │
└─────────────────────┘
```

### Profile Loaded
```
┌─────────────────────────────┐
│                             │
│          👤 JD              │
│     John Doe                │
│     john@example.com        │
│     Joined June 8, 2026     │
│                             │
├─────────────────────────────┤
│   Profile Information       │
│                             │
│   Full Name: [John Doe    ]│
│   Photo URL:[https://...  ]│
│                             │
│   [Update Profile ▶]        │
├─────────────────────────────┤
│   Preferences               │
│                             │
│   ☐ Dark Mode              │
│   ☑ Notifications          │
│   ☑ Study Reminders        │
│                             │
│   [Save Preferences ▶]      │
├─────────────────────────────┤
│   Account                   │
│                             │
│   [Logout]                  │
│   [Delete Account]          │
│                             │
└─────────────────────────────┘
```

---

## 🧪 Testing Features

### Test 1: Load Profile
```
1. Open Profile tab
2. See avatar with initials
3. See name, email, joined date
✅ Success: Data loads from MongoDB
```

### Test 2: Update Profile
```
1. Edit Full Name to "Jane Doe"
2. Edit Photo URL to "https://example.com/jane.jpg"
3. Tap "Update Profile"
4. See loading spinner
5. See success message
6. Refresh app
✅ Success: Changes persist in MongoDB
```

### Test 3: Preferences
```
1. Toggle "Dark Mode" ON
2. Toggle "Notifications" OFF
3. Tap "Save Preferences"
4. See loading spinner
5. See success message
6. Refresh app
✅ Success: Preferences saved
```

### Test 4: Logout
```
1. Tap "Logout"
2. See confirmation dialog
3. Tap "Logout" to confirm
4. Redirected to login page
✅ Success: Logged out cleanly
```

### Test 5: Delete Account
```
1. Tap "Delete Account"
2. See confirmation dialog
3. Tap "Cancel" → dismissed
4. Tap "Delete Account" again
5. Tap "Delete" to confirm
6. Account deleted, redirected to login
✅ Success: Account permanently deleted
```

---

## 🔍 Debugging

### Check Backend Logs

```bash
# In terminal running backend:
npm run dev

# Look for these logs:
[PROFILE CREATE] userId=xxx
[PROFILE READ] userId=xxx
[PROFILE UPDATE] userId=xxx
[PROFILE PREFERENCES UPDATE] userId=xxx
[PROFILE DELETE] userId=xxx
```

### Check Frontend Logs

```bash
# In browser console (F12):
[profileService] currentUser?.uid: xxx
[profileService] token length: 1234
[profileService] token first20: eyJ...
```

### Check MongoDB

```javascript
// Connect to MongoDB
db.userprofiles.findOne({ userId: "your-firebase-uid" })

// Should return:
{
  _id: ObjectId("..."),
  userId: "firebase-uid",
  email: "user@example.com",
  fullName: "John Doe",
  profileImage: "https://example.com/photo.jpg",
  preferences: {
    darkMode: false,
    notifications: true,
    studyReminders: true
  },
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## 🆘 Troubleshooting

### Problem: Profile Won't Load

**Solution**:
```bash
# 1. Check backend is running
curl http://localhost:5000/
# Should return: {"success":true,"message":"StudyGenie API is running."}

# 2. Check MongoDB connection
# In backend logs, should see: MongoDB Connected: cluster0.mongodb.net

# 3. Check browser console for errors
# F12 → Console tab → check for red errors

# 4. If still not working:
# - Restart backend: npm run dev
# - Restart frontend: npm start
# - Clear app cache
# - Re-login to Firebase
```

### Problem: 401 Unauthorized

**Solution**:
```bash
# This means Firebase token is invalid
# 1. Logout and re-login
# 2. Clear browser cache
# 3. Check Firebase is configured correctly
# 4. Check serviceAccountKey.json exists in server/
```

### Problem: Data Not Saving

**Solution**:
```bash
# 1. Check PUT request succeeds
# Browser console → Network tab → PUT /api/profile
# Should return status 200

# 2. Check MongoDB connection
# Check MONGO_URI in server/.env

# 3. Check if data is actually in MongoDB
# Connect to MongoDB and query userprofiles collection

# 4. If database is missing:
# MongoDB creates it automatically when you insert data
```

### Problem: Cannot Delete Account

**Solution**:
```bash
# 1. Make sure confirmation dialog appears
# 2. Tap "Delete" in confirmation
# 3. Check backend logs for errors
# 4. Check MongoDB to see if document deleted
# 5. If still stuck, restart backend and try again
```

---

## 📞 Common Questions

### Q: How do I update my profile photo?
**A**: Paste the image URL in "Profile Photo URL" field and tap "Update Profile". The image must be publicly accessible (HTTPS recommended).

### Q: What if my profile photo doesn't load?
**A**: The image URL might be invalid. Try another URL or stick with the avatar initials. Invalid URLs don't prevent saving - they just won't display.

### Q: Can I change my email address?
**A**: No, email is read-only and comes from your Firebase account. To change it, update it in Firebase settings.

### Q: What happens if I delete my account?
**A**: Your profile is permanently deleted from the database. You can create a new account, but all your old data is gone.

### Q: Where is my data stored?
**A**: All profile data is stored in MongoDB collection called `userprofiles` in the `studygenie` database.

### Q: Is my data encrypted?
**A**: Data in transit is encrypted (HTTPS). Data at rest is encrypted by MongoDB (if Enterprise). Passwords are never stored (Firebase handles auth).

---

## ✅ Verification Checklist

Before considering it "working":

- [ ] Backend running without errors
- [ ] Frontend starts without errors
- [ ] Can login to Firebase
- [ ] Profile loads with avatar
- [ ] Can update profile name
- [ ] Can update profile photo
- [ ] Can toggle preferences
- [ ] Can save preferences
- [ ] Changes persist after refresh
- [ ] Can logout successfully
- [ ] Can delete account with confirmation
- [ ] Confirmation dialogs appear
- [ ] No red errors in console
- [ ] No red errors in terminal

---

## 🎓 Architecture Overview

```
Frontend (React Native - Expo)
    ↓ (Firebase ID Token)
Backend (Express.js)
    ↓ (Token Verification)
Database (MongoDB)
```

**Flow**:
1. User logs in via Firebase
2. Firebase generates ID token
3. Frontend sends token with each request
4. Backend verifies token with Firebase
5. Backend reads/writes MongoDB
6. Response sent back to frontend
7. UI updates with new data

---

## 🚀 Next Steps

### After Verification
1. Test all features manually
2. Check logs for any errors
3. Verify data in MongoDB
4. Deploy to production

### Performance Tips
- Use proper image formats (JPG, PNG)
- Keep image file sizes small (<1MB)
- Use content delivery networks (CDN) for images
- Monitor MongoDB indexes for performance

### Security Tips
- Never share Firebase credentials
- Keep serviceAccountKey.json private
- Use environment variables for secrets
- Validate all user input
- Monitor auth logs for suspicious activity

---

## 📚 Related Documentation

- **PROFILE_COMPLETE.md** - Full implementation guide
- **PROFILE_IMPLEMENTATION_GUIDE.md** - Setup and testing
- **PROFILE_FINAL_REPORT.md** - Verification report
- **Backend**: See `server/README.md`
- **Frontend**: See `client/README.md`

---

## 💡 Pro Tips

### Tip 1: Use Standard Image URLs
```
✅ Good: https://example.com/photos/profile.jpg
❌ Bad: https://example.com/very/long/path/with/special/chars/ßñ.jpg
```

### Tip 2: Monitor Logs
Keep a terminal open showing backend logs while testing:
```bash
cd server
npm run dev  # Watch for [PROFILE ...] logs
```

### Tip 3: Use MongoDB Compass
Visually browse and manage MongoDB data:
```
Download: mongodb.com/products/tools/compass
Connect: MONGO_URI from server/.env
Browse: studygenie → userprofiles
```

### Tip 4: Test with Multiple Accounts
Create multiple Firebase accounts and verify each has own profile.

---

## ❓ Need Help?

1. **Check logs** - Backend logs show detailed info
2. **Check console** - Browser console (F12) shows errors
3. **Check database** - Verify data exists in MongoDB
4. **Check network** - Browser network tab shows API calls
5. **Check docs** - Read the comprehensive guides

---

**Ready to launch!** 🚀

Start with Step 1 above and you'll have a working Profile system in minutes.

Questions? Check the troubleshooting section or review the detailed documentation.

Happy coding! 🎉
