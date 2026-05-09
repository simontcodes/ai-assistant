# Android Permissions

## Required or Likely Permissions

### Calendar

Purpose:
- Read user's calendar events
- Detect free gaps

MVP:
- Google OAuth calendar integration is preferred over raw Android calendar permissions.

### Location

Purpose:
- Know where the user currently is
- Avoid suggesting tasks that are too far away
- Estimate travel feasibility

Capacitor plugin:
- `@capacitor/geolocation`

User-facing explanation:
"The app uses your location to avoid suggesting tasks that are not realistic based on travel time."

### Microphone

Purpose:
- Voice input in a later version

MVP:
- Not required for first implementation.

### Notifications

Purpose:
- Proactive suggestions in a later version

MVP:
- Not required immediately.

## Permission Strategy

Ask only when needed.

Recommended order:
1. Ask for calendar access during onboarding.
2. Ask for location when the user requests context-aware suggestions.
3. Ask for notifications later.
4. Ask for microphone later.

## Settings Screen Requirements

Settings should let the user configure:

- Home location
- Work location
- Work hours
- Whether personal tasks can be suggested during work hours
- Minimum useful gap duration
- Assistant name/personality later
