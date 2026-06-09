# Firebase Admin configuration fix (Invalid JWT Signature)

## Goal
Fix backend Firebase Admin SDK configuration causing:
- `invalid_grant: Invalid JWT Signature`
during:
- `DELETE /api/firebase-auth/user`

## Constraints
- Do not modify frontend.
- Do not modify Delete Account frontend logic.
- Fix only Firebase Admin authentication configuration.

## Proposed fix (to apply next)
- Normalize `serviceAccount.private_key` newlines in `server/firebaseAdmin.js`.
- Ensure Admin initialization is one-time and log:
  - `serviceAccount.project_id`
  - `admin.apps.length`
  - `app.options.projectId`

## Files
- `server/firebaseAdmin.js`
