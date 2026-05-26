# TODO_PDF_AI Fixes Progress

## Step 0 - Repo analysis (done)
- Located current PDF upload flow across:
  - `client/app/(tabs)/pdf-ai.tsx`
  - `client/services/pdfService.js`
  - `server/controllers/pdfController.js`
  - `server/routes/pdfRoutes.js`
  - `server/server.js`

## Step 1 - Fix Expo package version (to do)
- Remove wrong `expo-document-picker` version.
- Install correct version via `npx expo install expo-document-picker`.
- Clear metro cache and restart.

## Step 2 - Fix frontend FormData + field name (to do)
- Change frontend form field from `file` -> `pdf`.
- Ensure `userId` is appended in FormData (not axios headers).

## Step 3 - Fix frontend upload request (to do)
- Remove manual multipart `Content-Type` header.

## Step 4 - Fix backend multer handling (to do)
- Switch to `multer.memoryStorage()`.
- Set `upload.single('pdf')`.
- Add debug logs for `req.file` and `req.body`.

## Step 5 - Fix PDF parsing (to do)
- Parse from `req.file.buffer`.

## Step 6 - Fix OpenRouter request robustness (to do)
- Try/catch OpenRouter call.
- Save extracted text and fallback summary if AI fails.

## Step 7 - Verify route registration (to do)
- Confirm `/api/pdf` mount and `/upload` handler hit.

## Step 8 - Run & verify (done)
- Start backend + Expo (Expo restart with cache).
- Upload a PDF and confirm no 400.
- Confirm history card appears.


