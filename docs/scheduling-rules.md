# Scheduling Rules

## Goal

Given calendar gaps, current location, known locations, and pending tasks, suggest the most realistic tasks.

## Rule 1: Detect Calendar Gaps

Sort calendar events by start time.

A gap exists between:
- now and the next event
- event A end and event B start
- last event and configured day end

Ignore gaps shorter than the minimum useful duration.

Default minimum useful duration:
```ts
const MIN_GAP_MINUTES = 10;
```

## Rule 2: Basic Task Fit

A task can only be suggested if:

```ts
task.estimatedDurationMinutes <= gap.durationMinutes
```

For location-based tasks, use:

```ts
travelToTask + taskDuration + travelBackOrNextDestination <= gap.durationMinutes
```

## Rule 3: Travel Feasibility

If task.requiresLocation is true:

- App must know or estimate destination.
- App must calculate travel time.
- If travel time is unknown, reduce confidence or reject depending on context.
- Do not suggest location-based tasks during short gaps unless travel fits.

Example rejection:
"Not recommended now because the errand needs about 25 minutes plus 40 minutes of travel."

## Rule 4: Remote Tasks

If task.canDoRemotely is true:

- No travel time needed.
- Task can be suggested during work gaps only if user preferences allow personal tasks during work hours.

## Rule 5: Time of Day Match

Boost task score when the current gap matches task.bestTimeOfDay.

Example:
- Exercise may score higher in morning or evening.
- Paying bills can fit almost anytime.
- Errands may score higher during business hours.

## Rule 6: Energy Match

For MVP, energy can be simple:
- morning: medium/high
- afternoon: medium
- evening: low/medium
- late night: low

Boost tasks when energyRequired fits the likely energy level.

## Rule 7: Priority and Urgency

Priority weights:

```ts
low: 1
medium: 3
high: 5
```

Urgency:
- due today: +5
- due tomorrow: +3
- due this week: +1

## Rule 8: Final Score

Suggested scoring formula:

```ts
score =
  priorityScore +
  urgencyScore +
  durationFitScore +
  timeOfDayScore +
  energyMatchScore +
  travelFeasibilityScore;
```

## Rule 9: Return Top Suggestions

For each gap:
- filter infeasible tasks
- score feasible tasks
- return top 3

## Rule 10: Explain Results

Each suggestion should include a short explanation.

Example:
"Good fit because it takes about 10 minutes, can be done remotely, and you have 35 minutes before your next meeting."

## Codex Acceptance Criteria

Implement a scheduling service that:

- Accepts tasks, calendar events, current time, user location, and preferences.
- Returns calendar gaps.
- Returns top task suggestions per gap.
- Rejects tasks that do not fit.
- Includes reason strings for suggestions and rejections.
