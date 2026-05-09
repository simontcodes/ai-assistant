# Codex Master Prompt

Use this prompt when asking Codex to start the project.

```txt
You are helping me build an Android-first AI personal day assistant.

The app should be built with Ionic + Angular + Capacitor.

Product:
A character-based assistant is the main UI. The user chats with the assistant. The assistant helps manage the user's day by:
- creating tasks from natural language
- estimating task duration
- detecting whether tasks are remote or location-based
- checking calendar gaps
- checking location and travel feasibility
- suggesting realistic tasks for available time windows

Important architecture rule:
AI interprets natural language and returns structured metadata.
Deterministic TypeScript services make scheduling decisions.
Do not let AI directly mutate app state without validation.

Please read and follow the documentation in the /docs folder.

Start by implementing:
1. Ionic Angular project structure
2. Assistant chat screen
3. Task model and TaskService
4. Mock task extraction service
5. Mock calendar service
6. Gap detection service
7. Scheduling service with duration-based matching

Do not implement Google Calendar, real maps, voice input, notifications, or advanced animations yet.

Acceptance criteria for first version:
- The app opens to an assistant chat screen.
- User can type a task in natural language.
- App creates a structured task.
- App has mock calendar events.
- App detects free gaps.
- User can ask "What can I do now?"
- Assistant recommends a realistic pending task.
```
