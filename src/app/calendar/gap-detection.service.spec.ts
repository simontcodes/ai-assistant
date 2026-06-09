import { GapDetectionService } from './gap-detection.service';
import { CalendarEvent } from '../shared/models/domain.models';

describe('GapDetectionService', () => {
  let service: GapDetectionService;

  beforeEach(() => {
    service = new GapDetectionService();
  });

  it('detects useful gaps around sorted calendar events', () => {
    const events: CalendarEvent[] = [
      {
        id: 'meeting-2',
        title: 'Afternoon meeting',
        start: '2026-06-08T15:00:00.000Z',
        end: '2026-06-08T15:30:00.000Z',
        source: 'manual',
      },
      {
        id: 'meeting-1',
        title: 'Morning meeting',
        start: '2026-06-08T13:00:00.000Z',
        end: '2026-06-08T14:00:00.000Z',
        source: 'manual',
      },
    ];

    const gaps = service.detectGaps(
      events,
      '2026-06-08T12:00:00.000Z',
      '2026-06-08T17:00:00.000Z',
      30,
    );

    expect(gaps.map((gap) => [gap.start, gap.end, gap.durationMinutes])).toEqual([
      ['2026-06-08T12:00:00.000Z', '2026-06-08T13:00:00.000Z', 60],
      ['2026-06-08T14:00:00.000Z', '2026-06-08T15:00:00.000Z', 60],
      ['2026-06-08T15:30:00.000Z', '2026-06-08T17:00:00.000Z', 90],
    ]);
  });

  it('ignores gaps shorter than the configured minimum', () => {
    const events: CalendarEvent[] = [
      {
        id: 'meeting',
        title: 'Meeting',
        start: '2026-06-08T12:20:00.000Z',
        end: '2026-06-08T12:40:00.000Z',
        source: 'manual',
      },
    ];

    const gaps = service.detectGaps(
      events,
      '2026-06-08T12:00:00.000Z',
      '2026-06-08T13:20:00.000Z',
      30,
    );

    expect(gaps.map((gap) => [gap.start, gap.end, gap.durationMinutes])).toEqual([
      ['2026-06-08T12:40:00.000Z', '2026-06-08T13:20:00.000Z', 40],
    ]);
  });

  it('finds the current or next gap', () => {
    const gaps = service.detectGaps(
      [],
      '2026-06-08T12:00:00.000Z',
      '2026-06-08T13:00:00.000Z',
      10,
    );

    expect(service.findCurrentOrNextGap(gaps, '2026-06-08T12:30:00.000Z')?.id).toBe(gaps[0].id);
    expect(service.findCurrentOrNextGap(gaps, '2026-06-08T13:01:00.000Z')).toBeNull();
  });
});
