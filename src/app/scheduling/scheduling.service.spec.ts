import { SchedulingService } from './scheduling.service';
import { CalendarGap, SchedulingContext, Task } from '../shared/models/domain.models';
import { TravelTimeService } from '../location/travel-time.service';

describe('SchedulingService', () => {
  let service: SchedulingService;
  let travelTimeService: jasmine.SpyObj<TravelTimeService>;

  const gap: CalendarGap = {
    id: 'gap-1',
    start: '2026-06-08T14:00:00.000Z',
    end: '2026-06-08T15:00:00.000Z',
    durationMinutes: 60,
    contextLocation: 'work',
  };

  const context: SchedulingContext = {
    now: '2026-06-08T14:00:00.000Z',
    currentLocation: {
      lat: 43.65,
      lng: -79.38,
      capturedAt: '2026-06-08T14:00:00.000Z',
    },
    knownLocations: [],
    preferences: {
      workDayStart: '09:00',
      workDayEnd: '17:00',
      allowPersonalTasksDuringWork: true,
      minimumUsefulGapMinutes: 10,
      homeLocationName: 'Home',
      workLocationName: 'Work',
    },
  };

  beforeEach(() => {
    travelTimeService = jasmine.createSpyObj<TravelTimeService>('TravelTimeService', [
      'estimateTravelTimeMinutes',
    ]);
    travelTimeService.estimateTravelTimeMinutes.and.resolveTo(10);
    service = new SchedulingService(travelTimeService);
  });

  it('returns the top feasible suggestions sorted by score', async () => {
    const suggestions = await service.getSuggestionsForGap(gap, [
      buildTask({
        id: 'low',
        title: 'Low priority remote task',
        priority: 'low',
        estimatedDurationMinutes: 20,
      }),
      buildTask({
        id: 'high',
        title: 'High priority remote task',
        priority: 'high',
        estimatedDurationMinutes: 20,
        bestTimeOfDay: ['afternoon'],
      }),
    ], context);

    expect(suggestions.length).toBe(2);
    expect(suggestions[0].taskId).toBe('high');
    expect(suggestions[0].feasible).toBeTrue();
    expect(suggestions[0].reason).toContain('Good fit');
  });

  it('rejects location tasks when round trip travel does not fit the gap', async () => {
    travelTimeService.estimateTravelTimeMinutes.and.resolveTo(20);

    const task = buildTask({
      id: 'errand',
      title: 'Return package',
      estimatedDurationMinutes: 30,
      canDoRemotely: false,
      requiresLocation: true,
      locationType: 'Drop-off location',
    });

    const suggestions = await service.getSuggestionsForGap(gap, [task], context);
    const rejected = await service.getRejectedTasks(gap, [task], context);

    expect(suggestions).toEqual([]);
    expect(rejected[0].feasible).toBeFalse();
    expect(rejected[0].totalRequiredMinutes).toBe(70);
    expect(rejected[0].rejectionReason).toContain('Needs about 70 minutes');
  });

  it('rejects personal tasks during work when preferences disable them', async () => {
    const suggestions = await service.getSuggestionsForGap(
      gap,
      [buildTask({ id: 'task', title: 'Pay bill', estimatedDurationMinutes: 15 })],
      {
        ...context,
        preferences: {
          ...context.preferences,
          allowPersonalTasksDuringWork: false,
        },
      },
    );

    const rejected = await service.getRejectedTasks(
      gap,
      [buildTask({ id: 'task', title: 'Pay bill', estimatedDurationMinutes: 15 })],
      {
        ...context,
        preferences: {
          ...context.preferences,
          allowPersonalTasksDuringWork: false,
        },
      },
    );

    expect(suggestions).toEqual([]);
    expect(rejected[0].rejectionReason).toBe('Personal tasks are disabled during work hours.');
  });

  function buildTask(overrides: Partial<Task>): Task {
    return {
      id: 'task',
      title: 'Task',
      estimatedDurationMinutes: 20,
      estimatedDurationConfidence: 'medium',
      priority: 'medium',
      status: 'pending',
      canDoRemotely: true,
      requiresLocation: false,
      bestTimeOfDay: ['morning', 'afternoon', 'evening'],
      energyRequired: 'low',
      createdAt: '2026-06-08T12:00:00.000Z',
      updatedAt: '2026-06-08T12:00:00.000Z',
      ...overrides,
    };
  }
});
