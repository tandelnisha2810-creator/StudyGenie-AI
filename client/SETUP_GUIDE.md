# StudyGenie AI - Modern AI-Powered Study Assistant

A professional, production-ready mobile app built with React Native, Expo, Firebase, and Google's Gemini API. StudyGenie AI is your personal AI study companion designed to help students learn better and faster.

![StudyGenie AI](./assets/images/logo.png)

## ✨ Features

### 📱 Modern UI/UX
- **Bottom Tab Navigation**: Home, AI Chat, Notes, Profile
- **Glassmorphism Design**: Modern gradient cards with smooth shadows
- **Responsive Layout**: Works seamlessly on mobile and web
- **Dark-aware Typography**: Professional gradient headers and themed UI

### 🤖 AI-Powered Learning
- **AI Chat Assistant**: Interactive chat with Gemini API for instant help
- **Quiz Generation**: Auto-generate quiz questions on any topic
- **Note Summarization**: Summarize study materials with AI
- **Concept Explanation**: Get detailed explanations of complex concepts
- **Doubt Solving**: Get step-by-step solutions to your problems

### 📝 Notes Management
- **Create & Edit Notes**: Full-featured note editor with Firestore sync
- **Cloud Storage**: All notes synced to Firebase Firestore
- **Search & Filter**: Quickly find notes by title or content
- **Beautiful UI**: Modern card-based notes interface
- **Auto-Save**: Notes automatically saved to the cloud

### 👤 User Profile
- **Google Authentication**: Secure login with Google
- **User Info**: Display name, email, profile picture, join date
- **Statistics**: View your study stats and progress
- **Settings**: Customize your preferences
- **Logout**: Secure logout functionality

### 📊 Dashboard
- **Welcome Section**: Personalized greeting with user name
- **Quick Actions**: Fast access to all features
- **Recent Activity**: Track your recent study activities
- **Study Stats**: Monitor your learning progress

## 🏗️ Project Structure

```
client/
├── app/
│   ├── _layout.tsx              # Root navigation
│   ├── login.tsx                # Login screen (existing)
│   └── (tabs)/                  # Tab navigation
│       ├── _layout.tsx          # Tab layout with bottom nav
│       ├── home.tsx             # Home/Dashboard screen
│       ├── chat.tsx             # AI Chat screen
│       ├── notes.tsx            # Notes management screen
│       └── profile.tsx          # User profile screen
├── components/
│   └── ui/
│       ├── Button.tsx           # Reusable button component
│       ├── Card.tsx             # Card component with variants
│       ├── Header.tsx           # Header with gradient
│       ├── ChatBubble.tsx       # Chat message bubble
│       ├── Input.tsx            # Text input component
│       └── icon-symbol.*        # Icon components (existing)
├── services/
│   ├── gemini.ts                # Google Gemini API integration
│   └── firestore.ts             # Firebase Firestore operations
├── hooks/
│   ├── useAuth.ts               # Authentication hook
│   └── useUser.ts               # User profile hook
├── utils/
│   ├── colors.ts                # Color palette
│   ├── spacing.ts               # Spacing system
│   └── typography.ts            # Typography scales
├── constants/
│   ├── index.ts                 # App constants
│   └── theme.ts                 # Theme (existing)
├── firebase.js                  # Firebase config (updated)
├── package.json
├── tsconfig.json
├── app.json
├── .env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Firebase account
- Google Cloud account for Gemini API

### Installation

1. **Clone and navigate to client:**
```bash
cd client
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Create `.env` file:**
Copy `.env.example` to `.env` and add your API keys:
```bash
cp .env.example .env
```

4. **Update `.env` with your credentials:**
```
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### Firebase Setup

Firebase is already configured in `firebase.js`. Ensure you have:
- ✅ Firebase Authentication with Google OAuth enabled
- ✅ Firestore Database created
- ✅ Firestore rules allowing authenticated users

**Firestore Collections Structure:**
```
users/
  {uid}/
    - name (string)
    - email (string)
    - photoURL (string)
    - createdAt (timestamp)
    - bio (string)

notes/
  {noteId}/
    - userId (string)
    - title (string)
    - content (string)
    - createdAt (timestamp)
    - updatedAt (timestamp)

chatHistory/
  {chatId}/
    - userId (string)
    - message (string)
    - response (string)
    - createdAt (timestamp)
```

### Gemini API Setup

1. **Get Gemini API Key:**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create new API key
   - Copy the key

2. **Add to `.env`:**
```
EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
```

### Running the App

**Start Expo development server:**
```bash
npm start
# or
expo start
```

**Run on different platforms:**
```bash
# iOS simulator
npm run ios

# Android emulator
npm run android

# Web browser
npm run web
```

## 🔐 Firebase Firestore Security Rules

Add these rules to your Firestore console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Users can only access their own notes
    match /notes/{noteId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own chat history
    match /chatHistory/{chatId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 🎨 Design System

### Colors
- **Primary**: `#6366F1` (Indigo)
- **Secondary**: `#8B5CF6` (Purple)
- **Success**: `#10B981` (Green)
- **Error**: `#EF4444` (Red)
- **Warning**: `#F59E0B` (Amber)

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 20px
- xxl: 24px
- xxxl: 32px

### Typography
- **H1**: 32px, Bold
- **H2**: 28px, Bold
- **H3**: 24px, Semibold
- **Body**: 16px, Regular
- **Caption**: 12px, Regular

## 📚 Component Usage Examples

### Button Component
```tsx
import { Button } from "@/components/ui/Button";

<Button
  title="Send Message"
  onPress={() => console.log("Pressed")}
  variant="primary"    // primary | secondary | outline | ghost
  size="medium"        // small | medium | large
  loading={false}
  disabled={false}
  fullWidth={true}
/>
```

### Card Component
```tsx
import { Card } from "@/components/ui/Card";

<Card 
  variant="default"    // default | gradient | outlined
  shadow="md"          // sm | md | lg | none
  onPress={() => {}}
>
  <Text>Card content</Text>
</Card>
```

### Input Component
```tsx
import { Input } from "@/components/ui/Input";

<Input
  placeholder="Enter text"
  value={text}
  onChangeText={setText}
  label="Email"
  error={error}
  icon={<Mail size={20} />}
/>
```

### Chat Bubble
```tsx
import { ChatBubble } from "@/components/ui/ChatBubble";

<ChatBubble
  message="Hello!"
  isUser={true}
  timestamp={new Date()}
/>
```

## 🔄 API Integration

### Gemini API Methods

```tsx
import {
  sendMessageToGemini,
  generateQuiz,
  summarizeNotes,
  explainConcept,
  solveDoubt,
} from "@/services/gemini";

// Send custom message
const response = await sendMessageToGemini("Explain photosynthesis");

// Generate quiz
const quiz = await generateQuiz("Mathematics", 5);

// Summarize notes
const summary = await summarizeNotes(longNotes);

// Explain concept
const explanation = await explainConcept("Quantum Computing");

// Solve problem
const solution = await solveDoubt("How to solve quadratic equations?");
```

### Firestore Methods

```tsx
import {
  saveUserProfile,
  getUserNotes,
  addNote,
  updateNote,
  deleteNote,
  saveChatHistory,
} from "@/services/firestore";

// Save user profile
await saveUserProfile({
  uid: user.uid,
  name: user.displayName,
  email: user.email,
  photoURL: user.photoURL,
});

// Get user notes
const notes = await getUserNotes(userId);

// Add new note
const noteId = await addNote(userId, "Title", "Content");

// Update note
await updateNote(noteId, "New Title", "New Content");

// Delete note
await deleteNote(noteId);

// Save chat history
await saveChatHistory(userId, userMessage, aiResponse);
```

## 🎯 Custom Hooks

### useAuth Hook
```tsx
import { useAuth } from "@/hooks/useAuth";

const { user, loading, error } = useAuth();
```

### useUser Hook
```tsx
import { useUser } from "@/hooks/useUser";

const { userProfile, loading, error } = useUser(userId);
```

## 📦 Dependencies

Key packages used:
- `expo`: ^54.0.33
- `expo-router`: ~6.0.23
- `react-native`: 0.81.5
- `firebase`: ^12.13.0
- `expo-linear-gradient`: ~15.0.8
- `lucide-react-native`: ^1.16.0
- `react-native-reanimated`: ~4.1.1
- `@react-navigation/bottom-tabs`: ^7.4.0

## 🧪 Testing

### Run lint
```bash
npm run lint
```

### Build for production
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android

# Web
npm run web
```

## 🐛 Troubleshooting

### Gemini API not working
- Check `.env` file has correct `EXPO_PUBLIC_GEMINI_API_KEY`
- Verify API key is active in Google Cloud Console
- Check network connectivity

### Firebase authentication issues
- Ensure Google OAuth is enabled in Firebase Console
- Check Firebase configuration in `firebase.js`
- Verify app URL is in authorized domains

### Notes not syncing
- Check Firestore rules (see Security Rules section)
- Verify user is authenticated
- Check network connectivity

### Build errors
- Run `npm install` again
- Clear node_modules: `rm -rf node_modules && npm install`
- Reset cache: `expo start -c`

## 📝 Environment Variables

Create `.env` file with:
```
EXPO_PUBLIC_GEMINI_API_KEY=your_api_key
```

Do NOT commit `.env` file to version control!

## 🔗 Useful Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Google Gemini API](https://ai.google.dev/)
- [Expo Router](https://docs.expo.dev/routing/introduction/)

## 📄 License

MIT License - feel free to use this project for personal or commercial use.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Made with ❤️ by StudyGenie AI Team**

Happy Learning! 🚀📚
