# Data Model

Use TypeScript interfaces as the starting point.

## Task

```ts
export interface Task {
  id: string;
  title: string;
  description?: string;

  estimatedDurationMinutes: number;
  estimatedDurationConfidence: 'low' | 'medium' | 'high';

  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'done' | 'dismissed';

  canDoRemotely: boolean;
  requiresLocation: boolean;

  locationType?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;

  bestTimeOfDay?: TimeOfDay[];
  energyRequired?: 'low' | 'medium' | 'high';

  dueDate?: string;

  createdAt: string;
  updatedAt: string;
}
```

## TimeOfDay

```ts
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
```

## Calendar Event

```ts
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  source: 'google' | 'manual';
  location?: string;
}
```

## Calendar Gap

```ts
export interface CalendarGap {
  id: string;
  start: string;
  end: string;
  durationMinutes: number;
  contextLocation?: 'home' | 'work' | 'unknown';
}
```

## User Location

```ts
export interface UserLocation {
  lat: number;
  lng: number;
  accuracyMeters?: number;
  capturedAt: string;
}
```

## Known Location

```ts
export interface KnownLocation {
  id: string;
  label: 'home' | 'work' | 'custom';
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
}
```

## Suggestion

```ts
export interface TaskSuggestion {
  taskId: string;
  gapId: string;
  score: number;
  feasible: boolean;
  reason: string;
  rejectionReason?: string;
  travelTimeMinutes?: number;
  totalRequiredMinutes: number;
}
```

## Storage Notes

For MVP, store these locally:
- tasks
- assistant messages
- known locations
- user preferences

Calendar events can be fetched on demand and cached temporarily.
