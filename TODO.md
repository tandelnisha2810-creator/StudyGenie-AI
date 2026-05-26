# TODO - Fix DELETE NOTE FEATURE

## Plan steps
- [ ] Update `client/components/NoteCard.tsx` delete button so it reliably calls `onDelete(note.id, note._id)` and cannot be swallowed by the card press.
- [ ] Update `client/app/(tabs)/notes.tsx`:
  - [ ] Modify `handleDeleteNote` signature to accept `(id, mongoId)` and log: `🚀 handleDeleteNote called with:`
  - [ ] Ensure NoteCard gets `onDelete={handleDeleteNote}` prop.
  - [ ] Add exact required logs on delete click.
  - [ ] Ensure optimistic UI removal uses `setNotes(prev => prev.filter(note => note.id !== id && note._id !== id))`.
- [ ] Update `client/services/noteService.js` delete implementation:
  - [ ] Add exact required log: `🌐 Sending DELETE request:` and use `axios.delete(`${API_BASE_URL}/${id}`)`.
- [ ] Update `server/controllers/noteController.js`:
  - [ ] Add exact required log: `🔥 DELETE API HIT:`
  - [ ] Ensure delete uses `await Note.findByIdAndDelete(req.params.id)`.
  - [ ] Return EXACT response: `return res.status(200).json({ success: true })`.
- [ ] Verify route `server/routes/noteRoutes.js` is exactly `router.delete("/:id", deleteNote)`.
- [ ] Test end-to-end and confirm:
  - [ ] Browser logs show `🗑 DELETE CLICKED`
  - [ ] Frontend calls DELETE and backend logs `🔥 DELETE API HIT`.
  - [ ] Card disappears instantly.

