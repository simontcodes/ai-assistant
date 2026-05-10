import { Injectable } from '@angular/core';
import { CalendarEvent } from '../shared/models/domain.models';
import { GoogleAuthService } from './google-auth.service';

type GoogleCalendarEventsResponse = {
  summary?: string;
  items?: GoogleCalendarEvent[];
};

type GoogleCalendarEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    self?: boolean;
  }>;
  start?: {
    date?: string;
    dateTime?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
  };
};

export interface CalendarFetchDebugInfo {
  connected: boolean;
  requestUrl?: string;
  status?: number;
  rawItemCount?: number;
  mappedEventCount?: number;
  error?: string;
  fetchedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private cachedEvents: CalendarEvent[] | null = null;
  private cachedEventsDate = '';
  private lastDebugInfo: CalendarFetchDebugInfo | null = null;

  constructor(private readonly googleAuthService: GoogleAuthService) {}

  async getTodayEvents(): Promise<CalendarEvent[]> {
    return this.getGoogleTodayEvents();
  }

  clearCache(): void {
    this.cachedEvents = null;
    this.cachedEventsDate = '';
  }

  getLastDebugInfo(): CalendarFetchDebugInfo | null {
    return this.lastDebugInfo;
  }

  private async getGoogleTodayEvents(): Promise<CalendarEvent[]> {
    const session = this.googleAuthService.getSession();
    if (!session) {
      this.lastDebugInfo = {
        connected: false,
        fetchedAt: new Date().toISOString(),
      };
      return [];
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    if (this.cachedEvents && this.cachedEventsDate === todayKey) {
      return this.cachedEvents;
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');

    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('timeMin', startOfDay.toISOString());
    url.searchParams.set('timeMax', endOfDay.toISOString());

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        const message =
          response.status === 401
            ? 'Google Calendar connection expired. Reconnect Google Calendar in Settings.'
            : `Google Calendar fetch failed with status ${response.status}: ${error}`;

        if (response.status === 401) {
          this.googleAuthService.clearLocalSession();
          this.clearCache();
        }

        this.lastDebugInfo = {
          connected: true,
          requestUrl: url.toString(),
          status: response.status,
          error: message,
          fetchedAt: new Date().toISOString(),
        };
        throw new Error(message);
      }

      const payload = (await response.json()) as GoogleCalendarEventsResponse;
      const rawItemCount = payload.items?.length ?? 0;
      const events = (payload.items ?? [])
        .map((event, index) => this.mapGoogleEvent(event, index, payload.summary ?? 'Primary calendar'))
        .filter((event): event is CalendarEvent => event !== null)
        .sort((a, b) => a.start.localeCompare(b.start));

      this.cachedEvents = events;
      this.cachedEventsDate = todayKey;
      this.lastDebugInfo = {
        connected: true,
        requestUrl: url.toString(),
        status: response.status,
        rawItemCount,
        mappedEventCount: events.length,
        fetchedAt: new Date().toISOString(),
      };
      return events;
    } catch (error) {
      if (!this.lastDebugInfo?.error) {
        this.lastDebugInfo = {
          connected: true,
          requestUrl: url.toString(),
          error: error instanceof Error ? error.message : 'Unknown calendar fetch error.',
          fetchedAt: new Date().toISOString(),
        };
      }

      throw error;
    }
  }

  private mapGoogleEvent(event: GoogleCalendarEvent, index: number, calendarName: string): CalendarEvent | null {
    const start = event.start?.dateTime ?? event.start?.date;
    const end = event.end?.dateTime ?? event.end?.date;

    if (!start || !end) {
      return null;
    }

    return {
      id: event.id ?? `google-event-${index}`,
      title: event.summary || 'Busy',
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      source: 'google',
      calendarName,
      description: this.cleanDescription(event.description),
      location: event.location,
      attendees: (event.attendees ?? [])
        .filter((attendee) => Boolean(attendee.email))
        .map((attendee) => ({
          email: attendee.email!,
          name: attendee.displayName,
          responseStatus: attendee.responseStatus,
          self: attendee.self,
        })),
    };
  }

  private cleanDescription(description?: string): string | undefined {
    if (!description) {
      return undefined;
    }

    const text = description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .trim();

    return text || undefined;
  }
}
