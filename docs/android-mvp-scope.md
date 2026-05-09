# Android MVP Scope

## Platform

Target Android first.

Recommended implementation:

- Ionic + Angular + Capacitor
- Android build through Capacitor
- Chat-first mobile UI

## Included in MVP

### Assistant Experience
- Character assistant as the home screen
- Chat input
- Assistant responses
- Natural language task creation
- Basic assistant personality

### Task Intelligence
- AI extracts structured task metadata from natural language
- Duration estimation
- Remote vs location-required detection
- Best time of day estimation
- Energy level estimation
- Priority and due date extraction when mentioned

### Calendar Intelligence
- Read Google Calendar events
- Detect free gaps for today
- Detect free gaps for the next few days

### Location Awareness
- Get current user location
- Store known locations such as home and work
- Mark tasks as remote or location-based
- Reject suggestions when travel time makes them unrealistic

### Suggestions
- Suggest top 1 to 3 tasks for a gap
- Explain why a task is recommended
- Explain why a task is not recommended when useful

## Not Included in MVP

- iOS support
- 3D animated character
- Voice input
- Auto-scheduling calendar events
- Multi-user accounts
- Wearable support
- Full productivity analytics
- Complex recurring task system

## MVP Screens

1. Assistant Chat Screen
2. Today Plan Screen
3. Task Backlog Screen
4. Settings and Permissions Screen

## Default Home Screen

The Assistant Chat Screen should be the default home screen.

The user should not need to navigate through many forms. Most actions should be possible through chat.
