# StudyGenie AI

A full-stack study companion built with Expo React Native on the frontend and Node.js + Express on the backend.

## Project Structure

- `client/` — Expo React Native app
- `server/` — Node.js backend with Express and MongoDB

## Prerequisites

- Node.js 18+ installed
- npm (bundled with Node.js)
- Expo CLI available via `npx expo` or global install
- MongoDB connection string for backend
- Google Gemini API key for AI features

## Frontend Setup (`client/`)

1. Open a terminal and install dependencies:

```bash
cd client
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env
```

3. Open `client/.env` and set:

```env
EXPO_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

4. If you want to use your own Firebase project, update the config in `client/firebase.js`.

5. Start the Expo app:

```bash
npm start
```

6. Launch on a device or emulator:

```bash
npm run android
npm run ios
npm run web
```

## Backend Setup (`server/`)

1. Open a terminal and install backend dependencies:

```bash
cd server
npm install
```

2. Create a backend environment file:

```bash
copy .env.example .env
```

3. Open `server/.env` and set your MongoDB connection string:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/studygenie?retryWrites=true&w=majority
PORT=5000
```

4. Start the backend server:

```bash
npm run dev
```

or for production:

```bash
npm start
```

5. Confirm backend is running:

```bash
curl http://localhost:5000/
```

## Notes

- The frontend uses Expo Router with tab navigation.
- Gemini AI requires an API key from Google AI Studio.
- Firebase authentication is configured in `client/firebase.js`.
- The backend currently connects to MongoDB and exposes a root health route.

## Validation

- `client/app/(tabs)/profile.tsx` has been reviewed and validated for proper JSX syntax.
- No syntax errors were found in `client/app/(tabs)/profile.tsx` or `server/server.js`.
