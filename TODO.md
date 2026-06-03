# TODO.md — Planner DB-driven conversion

## 1) Repo understanding (done)
- Located existing local-storage driven planner implementation.
 - Identified files to update for backend + frontend.

## 2) Backend scaffolding
- [ ] Create MongoDB/Mongoose models:
  - [ ] server/models/plannerTaskModel.js
  - [ ] server/models/plannerReminderModel.js
  - [ ] server/models/plannerTimerModel.js
- [ ] Create controllers:
  - [ ] server/controllers/plannerTaskController.js
  - [ ] server/controllers/plannerReminderController.js
  - [ ] server/controllers/plannerTimerController.js
  - [ ] server/controllers/plannerStatsController.js
- [ ] Create routes:
  - [ ] server/routes/plannerTaskRoutes.js
  - [ ] server/routes/plannerReminderRoutes.js
  - [ ] server/routes/plannerTimerRoutes.js
  - [ ] server/routes/plannerStatsRoutes.js
- [ ] Mount routes in server/server.js under `/api/planner/*`

## 3) Frontend API service
- [ ] Replace client/services/plannerService.ts with API-driven implementation (no AsyncStorage as source of truth)
- [ ] Implement required methods:
  - [ ] getTasks/createTask/updateTask/deleteTask
  - [ ] getReminders/createReminder/updateReminder/deleteReminder
  - [ ] saveTimerSession
  - [ ] getStats

## 4) Frontend UI integration
- [ ] Update client/app/(tabs)/study-planner.tsx:
  - [ ] Fetch tasks/reminders/stats from backend
  - [ ] Wire CRUD handlers to API methods
  - [ ] Update UI counts based on stats response
- [ ] Update StudyTimer.tsx to call saveTimerSession on complete
- [ ] Update PomodoroTimer.tsx to call saveTimerSession for each completed focus session

## 5) Testing
- [x] Scaffold backend planner API (models/controllers/routes + mount)
- [ ] Start server and verify planner endpoints
- [ ] Confirm persistence after refresh/restart
- [ ] Confirm timer sessions are stored and reflected in stats


