# 🚀 StudyGenie AI - Complete Installation & Setup Instructions

## 📋 Overview

**StudyGenie AI** is a production-ready AI-powered Study Assistant app built with React Native, Expo, Firebase, and Google Gemini API. This guide walks you through the complete installation and setup process.

---

## ⚡ Prerequisites

Before you begin, ensure you have:
- **Node.js** 16+ installed ([Download](https://nodejs.org/))
- **npm** or **yarn** (comes with Node.js)
- **Google account** (for Gemini API)
- **Firebase account** (already configured)
- **Expo CLI** (install globally)

### Install Expo CLI
```bash
npm install -g expo-cli
expo --version  # Verify installation
```

---

## 📦 Step 1: Install Dependencies

Navigate to the client folder and install all required packages:

```bash
# Navigate to client folder
cd client

# Install dependencies
npm install

# Verify installation completed successfully
npm list
```

**Expected output**: All packages should be installed without errors.

---

## 🔑 Step 2: Set Up Environment Variables

### Create .env File
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Gemini API key
# (See next section for API key)
```

### Get Gemini API Key

1. **Go to Google AI Studio**
   - Visit: https://aistudio.google.com/app/apikey
   - Log in with your Google account

2. **Create New API Key**
   - Click on "Create API key"
   - Click "Create API key in Google Cloud Project"
   - Copy the generated key

3. **Add to .env**
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=sk-...your-key-here...
   ```

4. **Save the file** (Do NOT commit .env to Git!)

---

## 🔥 Step 3: Firebase Configuration

Your Firebase is already configured in `firebase.js`. Verify it's set up correctly:

### Check Firebase Configuration
```javascript
// firebase.js should have:
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Enable Features in Firebase Console

1. **Enable Google Authentication**
   - Go to: https://console.firebase.google.com/
   - Select: studygenieai-5fc1b project
   - Go to: Authentication → Sign-in method
   - Enable: Google provider
   - Add authorized domains if needed

2. **Create Firestore Database**
   - Go to: Firestore Database
   - Click: Create database
   - Start in: Production mode
   - Location: Your preference
   - Click: Enable

3. **Add Security Rules**
   - In Firestore console
   - Go to: Rules tab
   - Replace with rules from [SETUP_GUIDE.md](./SETUP_GUIDE.md#firestore-security-rules)
   - Publish rules

4. **Create Collections** (If not auto-created)
   - Collections → Create collection
   - Create: `users`, `notes`, `chatHistory`

---

## 🚀 Step 4: Start Development Server

### Start Expo
```bash
npm start
# or
expo start
```

You'll see output like:
```
Metro waiting on exp://192.168.1.x:19000
```

### Run on Different Platforms

**Option 1: iOS Simulator**
```bash
# Press 'i' in the terminal
# or run:
npm run ios
```

**Option 2: Android Emulator**
```bash
# Press 'a' in the terminal
# or run:
npm run android
```

**Option 3: Web Browser**
```bash
# Press 'w' in the terminal
# or run:
npm run web
```

---

## ✅ Step 5: Verify Installation

After the app loads, test these features:

### Test Home Screen
- [ ] See welcome message with your name
- [ ] View feature cards
- [ ] Check statistics
- [ ] See recent activity

### Test AI Chat
- [ ] Switch to Chat tab
- [ ] Type a message
- [ ] Receive AI response
- [ ] See typing indicator
- [ ] Check message formatting

### Test Notes
- [ ] Go to Notes tab
- [ ] Create a new note
- [ ] Edit the note
- [ ] Delete a note
- [ ] Search notes

### Test Profile
- [ ] View profile information
- [ ] See statistics
- [ ] Check user data
- [ ] Test logout (will return to login)

---

## 🛠️ Troubleshooting

### Issue: "Cannot find module 'firebase'"
**Solution**:
```bash
rm -rf node_modules
npm install
npm start -c  # Clear cache
```

### Issue: Gemini API returns error
**Solution**:
1. Verify API key in `.env`
2. Check API key is active in Google Cloud Console
3. Ensure network connectivity
4. Check API request limit

### Issue: Firebase authentication fails
**Solution**:
1. Verify Firebase config in `firebase.js`
2. Enable Google OAuth in Firebase Console
3. Add your domain to authorized domains
4. Check network connectivity

### Issue: Notes not saving to Firestore
**Solution**:
1. Check Firestore security rules
2. Verify user is authenticated
3. Check Firestore quota
4. Ensure collections exist

### Issue: "Expo is not installed globally"
**Solution**:
```bash
npm install -g expo-cli
expo --version
```

### Issue: TypeScript errors
**Solution**:
```bash
npm install
expo start -c  # Clear cache
```

### Issue: Port already in use
**Solution**:
```bash
# Kill the process using port 19000
# On Mac/Linux:
lsof -i :19000
kill -9 <PID>

# On Windows:
netstat -ano | findstr :19000
taskkill /PID <PID> /F
```

---

## 📱 Running on Physical Device

### iOS (Physical iPhone)
1. Install Expo Go app from App Store
2. Run: `npm start`
3. Scan QR code with iPhone camera
4. App opens in Expo Go

### Android (Physical Device)
1. Install Expo Go from Google Play Store
2. Run: `npm start`
3. Scan QR code with Expo Go app
4. App opens automatically

---

## 🎯 Project Structure

After setup, your project structure looks like:

```
client/
├── app/
│   ├── (tabs)/
│   │   ├── home.tsx       # Dashboard
│   │   ├── chat.tsx       # AI Chat
│   │   ├── notes.tsx      # Notes Management
│   │   └── profile.tsx    # User Profile
│   ├── login.tsx          # Login screen
│   └── _layout.tsx        # Root navigation
├── components/
│   └── ui/                # Reusable components
├── services/              # API services
├── hooks/                 # Custom hooks
├── utils/                 # Utilities
├── constants/             # Constants
├── firebase.js            # Firebase config
├── package.json
├── tsconfig.json
└── .env                   # Environment variables
```

---

## 🔗 Useful Commands

### Development
```bash
npm start                 # Start dev server
npm run ios              # Run on iOS
npm run android          # Run on Android
npm run web              # Run on web
npm run lint             # Check code quality
```

### Building
```bash
eas build --platform ios      # Build for iOS
eas build --platform android  # Build for Android
npm run build                 # Build for web
```

### Cleaning
```bash
npm install              # Reinstall dependencies
expo start -c            # Clear cache and restart
rm -rf node_modules      # Remove node_modules
```

---

## 📚 Documentation Files

### Available Guides
1. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup manual with Firebase & Gemini
2. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Architecture & code documentation
3. **[BUILD_SUMMARY.md](./BUILD_SUMMARY.md)** - Quick reference of what was built
4. **[README.md](./README.md)** - Project overview

### Component Documentation
- Each component file has detailed comments
- JSDoc comments for all functions
- Props documentation with types
- Usage examples in SETUP_GUIDE.md

---

## 🎨 Default Values & Customization

### Customize App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "StudyGenie AI",
    "slug": "studygenie-ai"
  }
}
```

### Customize Colors
Edit `utils/colors.ts`:
```typescript
primary: "#6366F1",    // Your primary color
secondary: "#8B5CF6"   // Your secondary color
```

### Customize Spacing
Edit `utils/spacing.ts`:
```typescript
const SPACING = {
  xs: 4,    // Extra small
  sm: 8,    // Small
  md: 12    // Medium
  // ...
}
```

---

## 🚀 Deployment

### Deploy to App Store (iOS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for App Store
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Deploy to Play Store (Android)

```bash
# Build for Play Store
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

### Deploy to Web

```bash
# Build web version
npm run web

# Deploy to Vercel
npm install -g vercel
vercel

# Or deploy to Netlify
netlify deploy --prod --dir=.expo/web
```

---

## 📞 Getting Help

### Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Gemini API](https://ai.google.dev/)
- [Expo Router](https://docs.expo.dev/routing/)

### Common Issues & Solutions
See [Troubleshooting](#-troubleshooting) section above

---

## ✨ Success Checklist

After following this guide, you should have:

- ✅ Node.js and npm installed
- ✅ Expo CLI installed globally
- ✅ Dependencies installed
- ✅ `.env` file created with Gemini API key
- ✅ Firebase configured and verified
- ✅ Development server running
- ✅ App displays on simulator/device/web
- ✅ All 4 screens functional
- ✅ AI chat working
- ✅ Notes creating and saving
- ✅ User profile displaying

---

## 🎉 Congratulations!

Your StudyGenie AI app is now **installed and ready to use**! 

### Next Steps:
1. Explore the app features
2. Test AI chat functionality
3. Create and manage notes
4. View your profile and stats
5. Read the documentation files
6. Customize colors and content
7. Deploy to app stores

### Happy Learning! 📚🚀

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Status**: Production Ready ✅
