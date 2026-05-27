 # TODO — Notes + Voice Notes Integration (Production)

## Step 1 — Fix route mismatch & confirm save endpoints
- [ ] Verify actual backend call used by “Save as Study Note” flow

## Step 2 — Update Note schema to support voice notes
- [x] Add `type`, `audioUri`, `quiz` fields to `server/models/Note.js`


## Step 3 — Update Note controller to accept voice-note payload
- [x] Update `createNote` / `updateNote` to persist `summary`, `quiz`, `audioUri`, `type`



## Step 4 — Save voice note into main Notes collection
- [x] Update `client/app/(tabs)/voice-notes.tsx` to call `createNote` on save

- [x] Include transcript(content), summary, quiz, title, audioUri, type, tags


## Step 5 — Prevent duplicate voice notes rendering
- [x] Update `client/app/(tabs)/notes.tsx` to stop fetching `VoiceNote` collection


## Step 6 — Update NoteCard UI for voice notes
- [x] Detect `note.type === "voice-note"` and render transcript preview + quiz count


- [x] Add play audio button for voice notes using `expo-av`



## Step 7 — Delete behavior stays correct
- [ ] Ensure Notes tab delete removes only from the main Note collection for voice notes

## Step 8 — Playback + counters
- [ ] Ensure createdAt/updatedAt mapping and notes count updates after save

