# TODO

## Auth 401 Unauthorized root-cause fix (profile endpoints)
- [x] Inspect auth middleware backend token verification flow (`server/middleware/authMiddleware.js`).
- [x] Inspect frontend token usage for profile endpoints (`client/services/profileService.js`).
- [x] Identify that frontend was using a cached token from `client/utils/authStorage.ts`.
- [x] Force fresh token per request using `auth.currentUser.getIdToken(true)`.
- [x] Add frontend debug logs in `client/services/profileService.js` (uid, token length, token prefix).
- [x] Add backend debug logs in `server/middleware/authMiddleware.js` (received token length, token prefix).
- [ ] Run manual verification:
  - [ ] GET /api/profile returns 200
  - [ ] PUT /api/profile returns 200
  - [ ] PUT /api/profile/preferences returns 200
  - [ ] MongoDB `userprofiles` gets/updates `fullName`, `profileImage`, `preferences`

