export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

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

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  source: 'google' | 'manual';
  calendarName?: string;
  description?: string;
  location?: string;
  attendees?: CalendarAttendee[];
}

export interface CalendarAttendee {
  email: string;
  name?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  self?: boolean;
}

export interface CalendarGap {
  id: string;
  start: string;
  end: string;
  durationMinutes: number;
  contextLocation?: 'home' | 'work' | 'unknown';
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracyMeters?: number;
  capturedAt: string;
}

export interface KnownLocation {
  id: string;
  label: 'home' | 'work' | 'custom';
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
}

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

export interface GapRecommendation {
  gap: CalendarGap;
  task?: Task;
  suggestion?: TaskSuggestion;
  alternatives?: GapRecommendationOption[];
  rejectionReason?: string;
  state?: 'active' | 'accepted' | 'deferred' | 'done';
}

export interface GapRecommendationOption {
  task: Task;
  suggestion: TaskSuggestion;
}

export interface UserPreferences {
  workDayStart: string;
  workDayEnd: string;
  allowPersonalTasksDuringWork: boolean;
  minimumUsefulGapMinutes: number;
  homeLocationName: string;
  workLocationName: string;
}

export interface SchedulingContext {
  now: string;
  currentLocation?: UserLocation;
  knownLocations: KnownLocation[];
  preferences: UserPreferences;
}
