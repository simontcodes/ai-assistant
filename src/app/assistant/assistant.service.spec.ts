import { AssistantService } from './assistant.service';
import { AssistantIntentService } from './assistant-intent.service';
import { TaskService } from '../tasks/task.service';
import { TaskExtractionService, TaskExtractionResult } from '../tasks/task-extraction.service';
import { BackendApiService } from '../shared/services/backend-api.service';
import { CalendarService } from '../calendar/calendar.service';
import { GapDetectionService } from '../calendar/gap-detection.service';
import { KnownLocationService } from '../location/known-location.service';
import { LocationService } from '../location/location.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { PreferencesService } from '../settings/preferences.service';
import { CalendarGap, Task, TaskSuggestion, UserPreferences } from '../shared/models/domain.models';

describe('AssistantService', () => {
  let assistantService: AssistantService;
  let assistantIntentService: jasmine.SpyObj<AssistantIntentService>;
  let taskExtractionService: jasmine.SpyObj<TaskExtractionService>;
  let taskService: jasmine.SpyObj<TaskService>;
  let calendarService: jasmine.SpyObj<CalendarService>;
  let gapDetectionService: jasmine.SpyObj<GapDetectionService>;
  let schedulingService: jasmine.SpyObj<SchedulingService>;
  let preferencesService: jasmine.SpyObj<PreferencesService>;
  let knownLocationService: jasmine.SpyObj<KnownLocationService>;
  let locationService: jasmine.SpyObj<LocationService>;
  let backendApiService: jasmine.SpyObj<BackendApiService>;
  let importedTasks: Task[];

  const preferences: UserPreferences = {
    workDayStart: '09:00',
    workDayEnd: '17:00',
    allowPersonalTasksDuringWork: true,
    minimumUsefulGapMinutes: 10,
    homeLocationName: 'Home',
    workLocationName: 'Work',
  };

  beforeEach(() => {
    localStorage.clear();
    importedTasks = [];

    assistantIntentService = jasmine.createSpyObj<AssistantIntentService>('AssistantIntentService', ['detectIntent']);
    taskExtractionService = jasmine.createSpyObj<TaskExtractionService>('TaskExtractionService', [
      'extractTaskFromMessage',
    ]);
    taskService = jasmine.createSpyObj<TaskService>('TaskService', [
      'createTask',
      'importTask',
      'syncFromBackend',
      'getPendingTasks',
      'getTaskById',
      'markTaskDone',
      'findTaskByText',
      'findLikelyTaskForUpdate',
      'updateTask',
    ]);
    calendarService = jasmine.createSpyObj<CalendarService>('CalendarService', ['getTodayEvents']);
    gapDetectionService = jasmine.createSpyObj<GapDetectionService>('GapDetectionService', [
      'detectGaps',
      'findCurrentOrNextGap',
    ]);
    schedulingService = jasmine.createSpyObj<SchedulingService>('SchedulingService', [
      'getSuggestionsForGap',
      'getRejectedTasks',
    ]);
    preferencesService = jasmine.createSpyObj<PreferencesService>('PreferencesService', ['getPreferences']);
    knownLocationService = jasmine.createSpyObj<KnownLocationService>('KnownLocationService', ['getKnownLocations']);
    locationService = jasmine.createSpyObj<LocationService>('LocationService', ['getCurrentLocation']);
    backendApiService = jasmine.createSpyObj<BackendApiService>('BackendApiService', ['postAssistantMessage']);

    assistantIntentService.detectIntent.and.returnValue('CREATE_TASK');
    taskService.importTask.and.callFake((task) => {
      importedTasks = [task, ...importedTasks.filter((item) => item.id !== task.id)];
      return task;
    });
    taskService.createTask.and.callFake((input) =>
      buildTask({
        ...input,
        id: 'local-task',
      }),
    );
    taskService.syncFromBackend.and.resolveTo([]);
    taskService.getPendingTasks.and.returnValue([]);
    calendarService.getTodayEvents.and.resolveTo([]);
    preferencesService.getPreferences.and.returnValue(preferences);
    knownLocationService.getKnownLocations.and.returnValue([]);
    locationService.getCurrentLocation.and.resolveTo({
      lat: 43.65,
      lng: -79.38,
      capturedAt: '2026-06-08T12:00:00.000Z',
    });

    assistantService = new AssistantService(
      assistantIntentService,
      taskExtractionService,
      taskService,
      calendarService,
      gapDetectionService,
      schedulingService,
      preferencesService,
      knownLocationService,
      locationService,
      backendApiService,
    );
  });

  it('creates a task through chat using the backend response', async () => {
    const backendTask = buildTask({
      id: 'backend-task-1',
      title: 'Pay credit card bill',
      estimatedDurationMinutes: 15,
      priority: 'high',
    });

    backendApiService.postAssistantMessage.and.resolveTo({
      reply: 'Saved "Pay credit card bill" as a 15-minute task.',
      task: backendTask,
      source: 'fallback',
    });

    await assistantService.sendMessage('I need to pay my credit card bill today');

    expect(backendApiService.postAssistantMessage).toHaveBeenCalledOnceWith(
      'I need to pay my credit card bill today',
    );
    expect(taskExtractionService.extractTaskFromMessage).not.toHaveBeenCalled();
    expect(importedTasks).toEqual([backendTask]);
    expect(getLastMessageContent()).toBe('Saved "Pay credit card bill" as a 15-minute task.');
  });

  it('falls back to local task extraction when backend create fails', async () => {
    spyOn(console, 'warn');
    backendApiService.postAssistantMessage.and.rejectWith(new Error('Backend unavailable'));
    taskExtractionService.extractTaskFromMessage.and.resolveTo(
      buildTaskExtraction({
        title: 'Pay credit card bill',
        estimatedDurationMinutes: 15,
        priority: 'high',
      }),
    );

    await assistantService.sendMessage('I need to pay my credit card bill today');

    expect(backendApiService.postAssistantMessage).toHaveBeenCalled();
    expect(taskExtractionService.extractTaskFromMessage).toHaveBeenCalledOnceWith(
      'I need to pay my credit card bill today',
    );
    expect(taskService.createTask).toHaveBeenCalled();
    expect(getLastMessageContent()).toContain('Saved "Pay credit card bill"');
  });

  it('syncs backend tasks before calculating suggestions', async () => {
    const task = buildTask({
      id: 'backend-task',
      title: 'Pay credit card bill',
      estimatedDurationMinutes: 15,
    });
    const gap = buildGap();
    const suggestion = buildSuggestion({
      taskId: task.id,
      gapId: gap.id,
    });

    assistantIntentService.detectIntent.and.returnValue('ASK_FOR_SUGGESTION');
    taskService.syncFromBackend.and.resolveTo([task]);
    taskService.getPendingTasks.and.returnValue([task]);
    gapDetectionService.detectGaps.and.returnValue([gap]);
    gapDetectionService.findCurrentOrNextGap.and.returnValue(gap);
    schedulingService.getSuggestionsForGap.and.resolveTo([suggestion]);

    await assistantService.sendMessage('What can I do now?');

    expect(taskService.syncFromBackend).toHaveBeenCalledBefore(taskService.getPendingTasks);
    expect(schedulingService.getSuggestionsForGap).toHaveBeenCalledWith(gap, [task], jasmine.any(Object));
    expect(getLastMessage()?.suggestions?.[0].taskId).toBe(task.id);
  });

  it('uses local pending tasks for suggestions when backend sync fails', async () => {
    spyOn(console, 'warn');
    const task = buildTask({
      id: 'local-task',
      title: 'Pay credit card bill',
      estimatedDurationMinutes: 15,
    });
    const gap = buildGap();
    const suggestion = buildSuggestion({
      taskId: task.id,
      gapId: gap.id,
    });

    assistantIntentService.detectIntent.and.returnValue('ASK_FOR_SUGGESTION');
    taskService.syncFromBackend.and.rejectWith(new Error('Backend unavailable'));
    taskService.getPendingTasks.and.returnValue([task]);
    gapDetectionService.detectGaps.and.returnValue([gap]);
    gapDetectionService.findCurrentOrNextGap.and.returnValue(gap);
    schedulingService.getSuggestionsForGap.and.resolveTo([suggestion]);

    await assistantService.sendMessage('What can I do now?');

    expect(console.warn).toHaveBeenCalled();
    expect(taskService.getPendingTasks).toHaveBeenCalled();
    expect(schedulingService.getSuggestionsForGap).toHaveBeenCalledWith(gap, [task], jasmine.any(Object));
    expect(getLastMessage()?.suggestions?.[0].taskId).toBe(task.id);
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

  function buildGap(overrides: Partial<CalendarGap> = {}): CalendarGap {
    return {
      id: 'gap',
      start: '2026-06-08T12:00:00.000Z',
      end: '2026-06-08T13:00:00.000Z',
      durationMinutes: 60,
      contextLocation: 'home',
      ...overrides,
    };
  }

  function buildSuggestion(overrides: Partial<TaskSuggestion> = {}): TaskSuggestion {
    return {
      taskId: 'task',
      gapId: 'gap',
      score: 10,
      feasible: true,
      reason: 'Good fit because it can be done remotely.',
      totalRequiredMinutes: 15,
      ...overrides,
    };
  }

  function getLastMessage() {
    const messages = assistantService.getMessages();
    return messages[messages.length - 1];
  }

  function getLastMessageContent(): string | undefined {
    return getLastMessage()?.content;
  }

  function buildTaskExtraction(overrides: Partial<TaskExtractionResult>): TaskExtractionResult {
    return {
      title: 'Task',
      estimatedDurationMinutes: 20,
      estimatedDurationConfidence: 'medium',
      priority: 'medium',
      canDoRemotely: true,
      requiresLocation: false,
      bestTimeOfDay: ['morning', 'afternoon', 'evening'],
      energyRequired: 'low',
      ...overrides,
    };
  }
});
