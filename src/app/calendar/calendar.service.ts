import { Injectable } from '@angular/core';
import { CalendarEvent } from '../shared/models/domain.models';
import { addMinutes } from '../shared/utils/date.utils';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  getTodayEvents(): CalendarEvent[] {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);

    const events: CalendarEvent[] = [
      {
        id: 'evt-1',
        title: 'Morning Focus Block',
        start: addMinutes(base, -120).toISOString(),
        end: addMinutes(base, -75).toISOString(),
        source: 'manual',
        location: 'Desk',
      },
      {
        id: 'evt-2',
        title: 'Team Check-in',
        start: addMinutes(base, 45).toISOString(),
        end: addMinutes(base, 90).toISOString(),
        source: 'manual',
        location: 'Conference room',
      },
      {
        id: 'evt-3',
        title: 'Project Review',
        start: addMinutes(base, 210).toISOString(),
        end: addMinutes(base, 270).toISOString(),
        source: 'manual',
        location: 'Zoom',
      },
    ];

    return events.sort((a, b) => a.start.localeCompare(b.start));
  }
}
