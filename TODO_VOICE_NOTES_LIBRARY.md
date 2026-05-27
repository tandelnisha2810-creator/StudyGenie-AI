# TODO_VOICE_NOTES_LIBRARY

## Goal
Make the existing Voice Notes “Your Library” fully functional: cards render instantly after save, playback works, stats update, recent transcript updates, and delete works.

## Steps
1. Verify frontend wiring: ensure `client/app/(tabs)/voice-notes.tsx` uses `VoiceNoteCard` and calls `loadNotes()` immediately after save.
2. Fix backend route/API contract issues:
   - Ensure POST create + GET list + DELETE endpoints match `/api/voice-notes` expectations.
3. Fix Voice Notes service:
   - Ensure `getVoiceNotes()`, `createVoiceNote()`, and `deleteVoiceNote()` correctly call existing backend routes.
   - Ensure response parsing (`extractNotes`) handles actual backend response shape.
4. Fix card rendering data mapping:
   - Ensure created voice notes return `title`, `transcript`, `summary`, `quiz`, `durationSeconds` (or `duration`) and `audioUrl`.
   - Ensure card uses correct prop fields (`audioUri`/`audioUrl`, etc.).
5. Fix “immediate UI update” after Save:
   - Ensure `handleSave` refreshes notes list (or sets notes state correctly from created response).
   - Ensure counters recompute from updated `notes`.
6. Ensure delete:
   - Backend deletes by id and returns success.
   - Frontend removes from UI immediately and updates stats.
7. Validate playback:
   - Ensure only one card can play at a time (stop previous).
   - Ensure pause/resume works.
8. Add UX polish required by task:
   - Loading states (library loading)
   - Success/error toast for save/delete
   - Empty state (no voice notes yet) should be removed from the “Your Library” area only if required; keep global empty state if already designed.
9. Run lint/typecheck and test API calls locally.

