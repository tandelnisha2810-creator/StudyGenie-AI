# 🚀 Notes Feature - Quick Reference Card

## Start Here

```bash
# Terminal 1 - Backend
cd server && npm start
# Should see: "Server running on port 5000"

# Terminal 2 - Frontend  
cd client && npm start
# Select emulator or Expo Go
```

---

## Test in 30 Seconds

1. Go to Notes tab
2. Tap **"+"** button
3. Fill in:
   - Title: `"React Hooks"`
   - Select Subject: `"React"`
   - Content: `"Hooks allow state in functional components"`
   - Pick Color: any
4. Tap **"Create Note"**
5. ✅ See note appear

---

## Features Checklist

| Feature | Status | How to Use |
|---------|--------|-----------|
| Create | ✅ | Tap **+** → Fill form → Tap "Create Note" |
| Edit | ✅ | Tap note card → Edit → Tap "Update Note" |
| Delete | ✅ | Tap trash icon → Confirm |
| Pin | ✅ | Tap pin icon → Goes to top |
| Favorite | ✅ | Tap star icon → Marked yellow |
| Search | ✅ | Type in search box (live) |
| Filter | ✅ | Click subject chip |
| Colors | ✅ | Pick during creation (5 options) |
| Summarize | ✅ | Tap "Summarize" button |
| Tags | ✅ | Add comma-separated in form |

---

## Subject Categories

```
React          JavaScript     DSA
DBMS           OS             CN
General
```

---

## Color Options

```
🟨 Yellow (default)
🟦 Blue
🟩 Green
🟥 Pink
🟪 Purple
```

---

## What Works Now

✅ Create notes  
✅ Search notes  
✅ Filter by subject  
✅ Pin notes  
✅ Edit notes  
✅ Delete notes  
✅ Favorite notes  
✅ Color selection  
✅ Tags  
✅ AI summarization  
✅ Live filtering  
✅ Error handling  
✅ Loading states  

---

## If Something's Wrong

**Issue: Button does nothing**
- Check: Backend running? (`Server running on port 5000`)
- Fix: Restart both server and client

**Issue: Notes don't save**
- Check: Is MongoDB connected?
- Fix: Verify `npm start` output in backend

**Issue: Search doesn't work**
- Check: Typed in search box?
- Fix: Try typing again

**Issue: Colors not showing**
- Check: Did you pick a color?
- Fix: Create new note and select color

---

## Backend Logs to Watch

```
✅ POST /api/notes HIT              Good! Request received
✅ Note created successfully        Good! Saved to DB
❌ Validation failed                Bad! Check form fields
❌ Database error                   Bad! Check MongoDB
```

---

## Network Check

1. Open DevTools: **F12** or **Cmd+Option+I**
2. Go to **Network** tab
3. Create a note
4. Look for **POST** to `/api/notes`
5. Should see **Status: 201**

---

## Most Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| Button unresponsive | Restart both servers |
| "Failed to load" | Check MongoDB connection |
| Network error | Verify backend running |
| No note appears | Check browser console for errors |
| Colors wrong | Refresh page and try again |

---

## Code Locations

| Feature | File |
|---------|------|
| Notes screen | `client/app/(tabs)/notes.tsx` |
| Note modal | `client/components/NoteModal.tsx` |
| Note card | `client/components/NoteCard.tsx` |
| API calls | `client/services/noteService.js` |
| Backend API | `server/controllers/noteController.js` |
| DB model | `server/models/Note.js` |

---

## API Endpoints

```
POST   /api/notes              Create
GET    /api/notes?userId=XXX   List
PUT    /api/notes/:id          Update
DELETE /api/notes/:id          Delete
POST   /api/notes/:id/summarize Summarize
```

---

## Important Docs

📄 **NOTES_QUICK_START.md** - Full 5-min test guide  
📄 **NOTES_FEATURE_COMPLETE.md** - Everything explained  
📄 **NOTES_IMPLEMENTATION_SUMMARY.md** - Technical details  

---

## Success Indicators

✅ Backend prints: `Server running on port 5000`  
✅ Create note appears instantly  
✅ Backend logs: `✅ Note created successfully`  
✅ Search filters results live  
✅ Pin icon is clickable  
✅ Edit opens modal with current data  

---

## Pro Tips

- **Search**: Case-insensitive, searches title/content/subject/tags
- **Filters**: Combine search + subject filter
- **Pin**: Pinned notes stay on top
- **Colors**: Pick during creation
- **Tags**: Comma-separated, searchable
- **Edit**: Click card to edit
- **Delete**: Trash icon, with confirmation

---

## What to Test First

1. ✅ Create note
2. ✅ Search for it
3. ✅ Filter by subject
4. ✅ Pin it
5. ✅ Edit it
6. ✅ Delete it

If all 6 work, everything is perfect! 🎉

---

## Emergency: Reset Everything

```bash
# Clear and reinstall
rm -rf server/node_modules client/node_modules
npm install (in both folders)
npm start (in both)
```

---

## You're Good to Go! 🚀

Start both servers, tap the Notes tab, create a note, and watch it work perfectly!

