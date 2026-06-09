# Implementation Progress - 2026-06-09

This document summarizes the work implemented today and the next steps needed to reach a working MVP.

## Implemented Today

### Backend Foundation

- Created a NestJS backend in the sibling `ai-assistant-backend` folder.
- Added API routes for:
  - health checks
  - assistant messages
  - task CRUD
  - today's schedule/calendar placeholders
- Added PostgreSQL persistence with Prisma.
- Replaced in-memory backend task storage with database-backed task storage.
- Verified backend task create, read, update, and mark-done flows.

### Frontend Backend Integration

- Added a backend API service to the Ionic Angular app.
- Connected chat task creation to the backend assistant endpoint.
- Connected the task backlog to backend task sync.
- Connected task editing and mark-done actions to backend persistence.
- Added local fallback behavior when backend calls fail.

### Task Backlog UX

- Added status filters for pending, done, and all tasks.
- Kept done tasks visually distinct.
- Confirmed task edits and done state survive browser refresh.

### Assistant Suggestions

- Connected "What can I do now?" to synced backend tasks before generating suggestions.
- Kept the deterministic scheduling logic in the frontend while using backend data as the source of truth.
- Added one-tap send behavior for the "What fits now?" shortcut.

### Chat Screen UX

- Reduced clutter in the chat screen:
  - removed large hero card
  - removed unused attachment/voice/options controls
  - made the header compact
  - hid quick prompts after the initial state
- Added an interaction model where the chat shows only the latest exchange by default.
- Added temporary history reveal on scroll/wheel/touch.
- Changed hidden history so it is not rendered or occupying layout space while collapsed.
- Added smooth enter/leave animations for revealed history messages.
- Added an "Up next" card that checks:
  - today's Google Calendar events
  - pending tasks with a future due date
- The "Up next" card shows the next confirmed event/task or a clear empty state.

### Google Calendar Settings UX

- Removed the Google Web Client ID field from user-facing Settings.
- Changed Google Calendar connection to a normal user flow:
  - Connect
  - Reconnect
  - Disconnect
- Moved the Google OAuth client ID into app configuration via `environment.google.webClientId`.
- Added a clearer disabled state when Google sign-in is not configured for the current build.

### Settings Save UX

- Disabled the "Save changes" button when there are no unsaved changes.
- Enabled it automatically when settings differ from the saved baseline.
- Added a short "Saved" state with a check icon and pulse animation after saving.

## Current MVP Status

The app now has the main MVP shell:

- Chat-first assistant UI
- Backend-backed task creation
- Persistent task backlog
- Task editing and done state persistence
- Basic scheduling suggestions
- Google Calendar connection UI
- Today/calendar reading service on the frontend
- PostgreSQL-backed backend task storage

The main remaining gap is turning the prototype-level integrations into a complete end-to-end product flow.

## Next Steps To Reach A Working MVP

### 1. Configure Google Calendar End To End

Goal: a user can click "Connect" and see real calendar events in the app.

Tasks:

- Add a real Google OAuth Web Client ID to `environment.google.webClientId`.
- Confirm the local authorized origin matches the frontend dev URL.
- Test the full Google sign-in and consent flow.
- Verify the Today tab displays real Google Calendar events.
- Verify the chat "Up next" card can show the next Google Calendar event.

Acceptance criteria:

- Settings shows the connected Google account email.
- Today tab loads today's calendar events.
- Chat "Up next" shows the next future calendar event when one exists.

### 2. Persist Confirmed Task Scheduling

Goal: the app can distinguish a normal backlog task from a task the user has confirmed they will do at a specific time.

Tasks:

- Add scheduled fields to the task model, for example:
  - `scheduledStart`
  - `scheduledEnd`
  - `confirmedAt`
- Add a Prisma migration for those fields.
- Update backend DTOs and task mapping.
- Update frontend task model.
- Update the "Up next" card to use confirmed scheduled tasks instead of treating `dueDate` as confirmation.

Acceptance criteria:

- A task can be marked as confirmed for a specific time.
- The confirmed task survives refresh.
- "Up next" chooses between confirmed tasks and Google Calendar events by start time.

### 3. Make Suggestion Actions Backend-Backed

Goal: actions taken from assistant suggestion cards persist after refresh.

Tasks:

- Update chat suggestion actions so "Done" uses the backend-backed task update flow.
- Add a "Plan this" or "Confirm" action for a suggested task.
- Persist the confirmed scheduled time on the backend.

Acceptance criteria:

- Marking a suggested task done persists after refresh.
- Confirming a suggested task creates a scheduled task commitment.
- The confirmed task appears in "Up next."

### 4. Move Calendar Access Behind The Backend

Goal: avoid keeping Google access tokens only in browser local storage for production-like MVP behavior.

Tasks:

- Add backend OAuth callback/session handling or a backend token exchange flow.
- Store refresh/access tokens securely server-side.
- Add backend endpoint for today's calendar events.
- Make the frontend call the backend for calendar data.

Acceptance criteria:

- Calendar events can be fetched through the backend.
- Frontend no longer needs direct Google Calendar API calls.
- Token handling is suitable for an MVP deployment.

### 5. Complete Today Plan Integration

Goal: Today tab shows useful gaps and recommended tasks based on real calendar data and backend tasks.

Tasks:

- Sync backend tasks before computing recommendations.
- Use real Google Calendar events when connected.
- Show gaps between real events.
- Show top recommended tasks for each useful gap.
- Allow accepting or dismissing recommendations.

Acceptance criteria:

- Today tab displays real events, useful gaps, and task recommendations.
- Accepted recommendations are saved as confirmed scheduled tasks.

### 6. Improve Time Horizon

Goal: move beyond only "today" when needed.

Tasks:

- Add calendar fetch for the next few days.
- Add scheduling suggestions for tomorrow/next available gap.
- Update "What fits now?" to explain when there is no useful gap today.

Acceptance criteria:

- If no useful gap exists today, the assistant can suggest the next realistic future slot.

### 7. Add MVP Polish And Reliability

Goal: make the app feel dependable during manual testing.

Tasks:

- Add loading and error states for backend connectivity.
- Add empty states for no tasks, no calendar events, and no suggestions.
- Add delete/archive task UI.
- Add a small diagnostics surface for backend/calendar status.
- Add focused tests for Settings dirty state, chat shortcuts, and Up Next selection.

Acceptance criteria:

- Common failure states are visible and understandable.
- Core user flows are covered by automated tests.

## Recommended Immediate Next Task

Configure Google Calendar end to end with a real OAuth client ID and verify the actual connect flow. This is the highest-value next step because the current MVP depends on real calendar events for gap detection, "Up next," and scheduling suggestions.
