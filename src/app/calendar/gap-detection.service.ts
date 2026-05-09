import { Injectable } from '@angular/core';
import { CalendarEvent, CalendarGap } from '../shared/models/domain.models';
import { differenceInMinutes } from '../shared/utils/date.utils';

@Injectable({
  providedIn: 'root',
})
export class GapDetectionService {
  detectGaps(events: CalendarEvent[], dayStart: string, dayEnd: string, minimumGapMinutes: number): CalendarGap[] {
    const sortedEvents = [...events].sort((a, b) => a.start.localeCompare(b.start));
    const gaps: CalendarGap[] = [];
    let cursor = new Date(dayStart);
    const endBoundary = new Date(dayEnd);

    for (const event of sortedEvents) {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      if (eventStart > cursor) {
        const durationMinutes = differenceInMinutes(cursor, eventStart);

        if (durationMinutes >= minimumGapMinutes) {
          gaps.push({
            id: `gap-${cursor.toISOString()}`,
            start: cursor.toISOString(),
            end: eventStart.toISOString(),
            durationMinutes,
            contextLocation: 'work',
          });
        }
      }

      if (eventEnd > cursor) {
        cursor = eventEnd;
      }
    }

    if (endBoundary > cursor) {
      const durationMinutes = differenceInMinutes(cursor, endBoundary);

      if (durationMinutes >= minimumGapMinutes) {
        gaps.push({
          id: `gap-${cursor.toISOString()}`,
          start: cursor.toISOString(),
          end: endBoundary.toISOString(),
          durationMinutes,
          contextLocation: 'home',
        });
      }
    }

    return gaps;
  }

  findCurrentOrNextGap(gaps: CalendarGap[], nowIso: string): CalendarGap | null {
    const now = new Date(nowIso);

    return gaps.find((gap) => new Date(gap.end) > now) ?? null;
  }
}
