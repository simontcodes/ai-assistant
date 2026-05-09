# Architecture

## Recommended Stack

Android app:
- Ionic
- Angular
- Capacitor

Language:
- TypeScript

Storage:
- Local storage for initial MVP
- SQLite later if needed

External APIs:
- OpenAI API for AI extraction and assistant responses
- Google Calendar API for events
- Location through Capacitor Geolocation
- Maps/travel time API later

## High-Level Modules

```txt
src/app/
  assistant/
    assistant-chat.page.ts
    assistant.service.ts
    assistant-intent.service.ts

  tasks/
    task.model.ts
    task.service.ts
    task-extraction.service.ts

  calendar/
    calendar-event.model.ts
    calendar.service.ts
    gap-detection.service.ts

  scheduling/
    scheduling.service.ts
    scoring.service.ts
    suggestion.model.ts

  location/
    location.service.ts
    known-location.service.ts
    travel-time.service.ts

  settings/
    settings.page.ts
    preferences.service.ts

  shared/
    models/
    utils/
```

## Responsibility Split

### AI Layer

Responsible for:
- interpreting task text
- generating assistant-style responses
- extracting structured metadata

Not responsible for:
- directly scheduling
- ignoring validation
- mutating app state without structured confirmation

### Scheduling Layer

Responsible for:
- detecting free gaps
- checking duration
- checking location and travel feasibility
- scoring tasks
- returning suggestions

### UI Layer

Responsible for:
- chat interface
- character display
- showing suggestions
- simple task list
- permissions/settings flow

## MVP Data Flow

```txt
User message
  ↓
AssistantIntentService
  ↓
TaskExtractionService / SchedulingService
  ↓
Validated result
  ↓
TaskService saves or SuggestionService returns suggestions
  ↓
AssistantService formats response
  ↓
Chat UI displays answer
```

## Security Note

Do not expose API keys in the mobile app long term.

For a personal MVP, local testing may be acceptable, but the production-ready version should use a backend proxy for OpenAI requests.
