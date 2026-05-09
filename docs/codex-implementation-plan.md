# Codex Implementation Plan

This document is written as an actionable task list for Codex.

## Phase 1: Project Setup

### Task 1.1 - Create Ionic Angular App

Create a new Ionic Angular app configured for Capacitor Android.

Acceptance criteria:
- App runs in browser.
- App can be built for Android.
- Basic routing exists.

### Task 1.2 - Create App Structure

Create folders:

```txt
assistant/
tasks/
calendar/
scheduling/
location/
settings/
shared/
```

Acceptance criteria:
- Each folder has at least one service or model file.
- App compiles.

## Phase 2: Assistant Chat UI

### Task 2.1 - Build Assistant Chat Screen

Create the default home screen with:
- character avatar placeholder
- assistant name
- message list
- text input
- send button

Acceptance criteria:
- User can send a message.
- Message appears in chat.
- Assistant returns placeholder response.

### Task 2.2 - Assistant Message Model

Create:

```ts
export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}
```

Acceptance criteria:
- Messages use this interface.
- Messages are stored in local state.

## Phase 3: Task Creation and Storage

### Task 3.1 - Create Task Model

Use the `Task` interface from `data-model.md`.

Acceptance criteria:
- Task model exists.
- App compiles.

### Task 3.2 - Create TaskService

TaskService should support:
- create task
- update task
- mark done
- list pending tasks
- list all tasks

Acceptance criteria:
- Tasks are stored locally.
- Tasks survive page refresh if using local storage.

## Phase 4: AI Task Extraction

### Task 4.1 - Create TaskExtractionService

Create a service that accepts natural language and returns structured task metadata.

Acceptance criteria:
- Service has a method:
```ts
extractTaskFromMessage(message: string): Promise<TaskExtractionResult>
```

### Task 4.2 - Add AI Prompt

Use the prompt from `ai-extraction.md`.

Acceptance criteria:
- AI returns JSON only.
- Response is parsed safely.
- Invalid responses are rejected.

### Task 4.3 - Connect Chat to Task Creation

When the user says a task-like message:
- call TaskExtractionService
- validate result
- save task
- show assistant confirmation

Acceptance criteria:
- User can type "I need to pay my credit card bill"
- App creates a structured task
- Assistant confirms it

## Phase 5: Calendar and Gap Detection

### Task 5.1 - CalendarEvent Model

Create model from `data-model.md`.

### Task 5.2 - CalendarService

For MVP, start with mock calendar events.

Acceptance criteria:
- CalendarService returns today's events.
- Later it can be replaced with Google Calendar integration.

### Task 5.3 - GapDetectionService

Implement:
```ts
detectGaps(events: CalendarEvent[], dayStart: string, dayEnd: string): CalendarGap[]
```

Acceptance criteria:
- Events are sorted.
- Gaps are returned.
- Short gaps are ignored.

## Phase 6: Location and Travel Feasibility

### Task 6.1 - LocationService

Create service that can return current location.

For MVP, allow mock location first.

Acceptance criteria:
- Service returns current or mock location.
- App does not crash if permission is missing.

### Task 6.2 - KnownLocationService

Store home and work locations.

Acceptance criteria:
- User can configure mock home/work values in code or settings.

### Task 6.3 - TravelTimeService

For MVP, implement a stub:

```ts
estimateTravelTimeMinutes(origin, destination): Promise<number | null>
```

Acceptance criteria:
- Returns mocked travel time.
- Later replaceable with maps API.

## Phase 7: Scheduling Engine

### Task 7.1 - SchedulingService

Implement:
```ts
getSuggestionsForGap(gap: CalendarGap, tasks: Task[], context: SchedulingContext): TaskSuggestion[]
```

Acceptance criteria:
- Filters tasks by duration.
- Rejects impossible location-based tasks.
- Scores feasible tasks.
- Returns top 3.

### Task 7.2 - Suggestion Explanation

Each suggestion must include:
- score
- reason
- totalRequiredMinutes
- travelTimeMinutes if relevant

Acceptance criteria:
- Assistant can explain why a task was recommended.

## Phase 8: Ask What To Do Flow

### Task 8.1 - Intent Detection

Create simple intent detection.

Acceptance criteria:
- "What can I do now?" triggers scheduling.
- "I need to..." triggers task creation.

### Task 8.2 - Assistant Suggestion Response

When user asks what to do:
- get current gap
- get pending tasks
- get suggestions
- respond with best suggestion

Acceptance criteria:
- Assistant returns a practical recommendation.
- Assistant explains time and travel constraints.

## Phase 9: Settings

### Task 9.1 - Settings Screen

Add settings for:
- work hours
- home location
- work location
- allow personal tasks during work
- minimum gap duration

Acceptance criteria:
- Settings are editable.
- Settings affect scheduling rules.

## Phase 10: Real API Integrations

Do this after the mock MVP works.

### Task 10.1 - Google Calendar Integration

Acceptance criteria:
- User can connect Google Calendar.
- App fetches real events.

### Task 10.2 - Real Location

Acceptance criteria:
- App requests Android location permission.
- App gets current location.

### Task 10.3 - Real Travel Time

Acceptance criteria:
- App estimates travel time using a maps provider.
- Scheduling engine uses real travel time.

## Build Rule

Do not start with advanced animations, voice, or auto-scheduling.

First working version must prove:
- chat creates tasks
- calendar gaps are detected
- suggestions are realistic
- bad suggestions are rejected
