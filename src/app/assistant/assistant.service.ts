import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CalendarService } from '../calendar/calendar.service';
import { GapDetectionService } from '../calendar/gap-detection.service';
import { KnownLocationService } from '../location/known-location.service';
import { LocationService } from '../location/location.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { PreferencesService } from '../settings/preferences.service';
import { AssistantMessage, AssistantSuggestionCard } from '../shared/models/assistant-message.model';
import { Task } from '../shared/models/domain.models';
import { combineDateAndTime, formatTime } from '../shared/utils/date.utils';
import { TaskExtractionService } from '../tasks/task-extraction.service';
import { TaskService } from '../tasks/task.service';
import { AssistantIntentService } from './assistant-intent.service';
import { SuggestionAction } from '../shared/components/suggestion-card/suggestion-card.component';
import { BackendApiService } from '../shared/services/backend-api.service';

const STORAGE_KEY = 'ai-day-assistant.messages.v1';

@Injectable({
  providedIn: 'root',
})
export class AssistantService {
  private readonly messagesSubject = new BehaviorSubject<AssistantMessage[]>(this.loadMessages());
  private lastReferencedTaskId: string | null = null;

  readonly messages$ = this.messagesSubject.asObservable();

  constructor(
    private readonly assistantIntentService: AssistantIntentService,
    private readonly taskExtractionService: TaskExtractionService,
    private readonly taskService: TaskService,
    private readonly calendarService: CalendarService,
    private readonly gapDetectionService: GapDetectionService,
    private readonly schedulingService: SchedulingService,
    private readonly preferencesService: PreferencesService,
    private readonly knownLocationService: KnownLocationService,
    private readonly locationService: LocationService,
    private readonly backendApiService: BackendApiService,
  ) {
    if (this.messagesSubject.value.length === 0) {
      this.appendMessage({
        role: 'assistant',
        content: 'Milo here. Tell me what you need to do, or ask what fits into your day right now.',
      });
    }
  }

  getMessages(): AssistantMessage[] {
    return this.messagesSubject.value;
  }

  handleSuggestionAction(taskId: string, action: SuggestionAction): void {
    const task = this.taskService.getTaskById(taskId);
    if (!task) {
      this.appendMessage({
        role: 'assistant',
        content: 'That suggestion is no longer available.',
      });
      return;
    }

    this.lastReferencedTaskId = taskId;
    this.updateSuggestionState(taskId, action);

    if (action === 'done') {
      this.taskService.markTaskDone(taskId);
      this.appendMessage({
        role: 'assistant',
        content: `Marked "${task.title}" as done. I can suggest the next best option whenever you are ready.`,
      });
      return;
    }

    if (action === 'later') {
      this.appendMessage({
        role: 'assistant',
        content: `Keeping "${task.title}" for later. I will leave it in your backlog and we can check the next gap instead.`,
      });
      return;
    }

    this.appendMessage({
      role: 'assistant',
      content: `Focus on "${task.title}" now. It needs about ${task.estimatedDurationMinutes} minutes, so this is a realistic use of the current gap.`,
    });
  }

  async sendMessage(content: string): Promise<void> {
    this.appendMessage({
      role: 'user',
      content,
    });

    const intent = this.assistantIntentService.detectIntent(content);

    switch (intent) {
      case 'CREATE_TASK':
        await this.handleCreateTask(content);
        return;
      case 'ASK_FOR_SUGGESTION':
        await this.handleSuggestionRequest();
        return;
      case 'MARK_TASK_DONE':
        this.handleMarkDone(content);
        return;
      case 'UPDATE_TASK':
        this.handleUpdateTask(content);
        return;
      default:
        this.appendMessage({
          role: 'assistant',
          content: 'I can create tasks, update them, mark something done, or suggest what fits into your next gap.',
        });
    }
  }

  private async handleCreateTask(message: string): Promise<void> {
    const backendTask = await this.tryCreateTaskWithBackend(message);
    if (backendTask) {
      return;
    }

    const extracted = await this.taskExtractionService.extractTaskFromMessage(message);
    const task = this.taskService.createTask(extracted);
    this.lastReferencedTaskId = task.id;
    const locationNote = task.requiresLocation
      ? `It looks location-based, so I will only suggest it when travel fits.`
      : 'It looks remote, so it can fit into short gaps more easily.';

    this.appendMessage({
      role: 'assistant',
      content: `Saved "${task.title}" as a ${task.estimatedDurationMinutes}-minute task. ${locationNote}`,
    });
  }

  private async tryCreateTaskWithBackend(message: string): Promise<boolean> {
    try {
      const response = await this.backendApiService.postAssistantMessage(message);

      if (response.task) {
        const task = this.taskService.importTask(response.task);
        this.lastReferencedTaskId = task.id;
      }

      this.appendMessage({
        role: 'assistant',
        content: response.reply || 'I handled that.',
      });

      return true;
    } catch (error) {
      console.warn('Backend assistant request failed. Falling back to local task extraction.', error);
      return false;
    }
  }

  private async handleSuggestionRequest(): Promise<void> {
    try {
      await this.taskService.syncFromBackend();
    } catch (error) {
      console.warn('Backend task sync failed before suggestions. Using locally saved tasks.', error);
    }

    const preferences = this.preferencesService.getPreferences();
    const currentLocation = await this.locationService.getCurrentLocation();
    const knownLocations = this.knownLocationService.getKnownLocations();
    const events = await this.calendarService.getTodayEvents();
    const now = new Date();
    const dayStart = now.toISOString();
    const dayEnd = combineDateAndTime(now, preferences.workDayEnd).toISOString();
    const gaps = this.gapDetectionService.detectGaps(
      events,
      dayStart,
      dayEnd,
      preferences.minimumUsefulGapMinutes,
    );
    const gap = this.gapDetectionService.findCurrentOrNextGap(gaps, now.toISOString());

    if (!gap) {
      this.appendMessage({
        role: 'assistant',
        content: 'I do not see a useful free gap before the end of your day.',
      });
      return;
    }

    const pendingTasks = this.taskService.getPendingTasks();
    if (pendingTasks.length === 0) {
      this.appendMessage({
        role: 'assistant',
        content: `You have a ${gap.durationMinutes}-minute gap until ${formatTime(gap.end)}, but no pending tasks yet.`,
      });
      return;
    }

    const suggestions = await this.schedulingService.getSuggestionsForGap(gap, pendingTasks, {
      now: now.toISOString(),
      currentLocation,
      knownLocations,
      preferences,
    });

    if (suggestions.length === 0) {
      const rejections = await this.schedulingService.getRejectedTasks(gap, pendingTasks, {
        now: now.toISOString(),
        currentLocation,
        knownLocations,
        preferences,
      });
      const firstRejection = rejections[0];

      this.appendMessage({
        role: 'assistant',
        content: firstRejection?.rejectionReason
          ? `Nothing fits right now. ${firstRejection.rejectionReason}`
          : 'Nothing realistic fits into the current gap.',
      });
      return;
    }

    const topSuggestion = suggestions[0];
    const suggestionCards = suggestions
      .map((suggestion) => {
        const task = pendingTasks.find((item) => item.id === suggestion.taskId);
        if (!task) {
          return null;
        }

        return {
          taskId: task.id,
          title: task.title,
          reason: suggestion.reason,
          score: suggestion.score,
          totalRequiredMinutes: suggestion.totalRequiredMinutes,
          travelTimeMinutes: suggestion.travelTimeMinutes,
        };
      })
      .filter((card): card is NonNullable<typeof card> => card !== null);

    this.lastReferencedTaskId = topSuggestion.taskId;

    this.appendMessage({
      role: 'assistant',
      content: `I found ${suggestionCards.length} realistic option${suggestionCards.length === 1 ? '' : 's'}. Best fit first. This gap runs until ${formatTime(gap.end)}.`,
      suggestions: suggestionCards,
    });
  }

  private handleMarkDone(message: string): void {
    const matchedTask = this.taskService.findTaskByText(message);

    if (!matchedTask) {
      this.appendMessage({
        role: 'assistant',
        content: 'I could not match that to a pending task yet.',
      });
      return;
    }

    this.taskService.markTaskDone(matchedTask.id);
    this.lastReferencedTaskId = matchedTask.id;
    this.appendMessage({
      role: 'assistant',
      content: `Marked "${matchedTask.title}" as done.`,
    });
  }

  private handleUpdateTask(message: string): void {
    const matchedTask = this.taskService.findLikelyTaskForUpdate(message, this.lastReferencedTaskId);

    if (!matchedTask) {
      this.appendMessage({
        role: 'assistant',
        content: 'I could not tell which task to update.',
      });
      return;
    }

    const updates = this.extractTaskUpdates(message, matchedTask);
    if (!updates) {
      this.appendMessage({
        role: 'assistant',
        content: `I found "${matchedTask.title}", but I did not detect a supported update yet. Try a duration, priority, or due date change.`,
      });
      return;
    }

    const updatedTask = this.taskService.updateTask(matchedTask.id, updates);
    this.lastReferencedTaskId = matchedTask.id;

    if (!updatedTask) {
      this.appendMessage({
        role: 'assistant',
        content: 'That task could not be updated.',
      });
      return;
    }

    this.appendMessage({
      role: 'assistant',
      content: this.buildUpdateConfirmation(updatedTask, updates),
    });
  }

  private loadMessages(): AssistantMessage[] {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as AssistantMessage[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private appendMessage(message: Omit<AssistantMessage, 'id' | 'createdAt'>): void {
    const nextMessage: AssistantMessage = {
      ...message,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const next = [...this.messagesSubject.value, nextMessage];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.messagesSubject.next(next);
  }

  private updateSuggestionState(taskId: string, action: SuggestionAction): void {
    const nextState: AssistantSuggestionCard['state'] =
      action === 'do-now' ? 'accepted' : action === 'later' ? 'deferred' : 'done';

    const nextMessages = this.messagesSubject.value.map((message) => {
      if (!message.suggestions?.length) {
        return message;
      }

      const nextSuggestions = message.suggestions.map((suggestion) => {
        if (suggestion.taskId !== taskId) {
          return suggestion;
        }

        return {
          ...suggestion,
          state: nextState,
        };
      });

      return {
        ...message,
        suggestions: nextSuggestions,
      };
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMessages));
    this.messagesSubject.next(nextMessages);
  }

  private extractTaskUpdates(message: string, task: Task): Partial<Task> | null {
    const updates: Partial<Task> = {};
    const normalized = message.toLowerCase();

    const minuteMatch = normalized.match(/(\d+)\s*(minute|min)/);
    const hourMatch = normalized.match(/(\d+)\s*(hour|hr)/);
    if (minuteMatch) {
      updates.estimatedDurationMinutes = Number(minuteMatch[1]);
      updates.estimatedDurationConfidence = 'high';
    } else if (hourMatch) {
      updates.estimatedDurationMinutes = Number(hourMatch[1]) * 60;
      updates.estimatedDurationConfidence = 'high';
    }

    if (/\bhigh priority\b|\burgent\b/.test(normalized)) {
      updates.priority = 'high';
    } else if (/\bmedium priority\b/.test(normalized)) {
      updates.priority = 'medium';
    } else if (/\blow priority\b/.test(normalized)) {
      updates.priority = 'low';
    }

    if (/tomorrow/.test(normalized)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      updates.dueDate = tomorrow.toISOString();
    } else if (/today|tonight/.test(normalized)) {
      updates.dueDate = new Date().toISOString();
    } else if (/this week/.test(normalized)) {
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 5);
      updates.dueDate = endOfWeek.toISOString();
    }

    if (/remote/.test(normalized)) {
      updates.canDoRemotely = true;
      updates.requiresLocation = false;
      updates.locationType = undefined;
    } else if (/in person|location|errand/.test(normalized)) {
      updates.canDoRemotely = false;
      updates.requiresLocation = true;
      updates.locationType = task.locationType ?? 'Errand location';
    }

    return Object.keys(updates).length > 0 ? updates : null;
  }

  private buildUpdateConfirmation(task: Task, updates: Partial<Task>): string {
    const changes: string[] = [];

    if (updates.estimatedDurationMinutes) {
      changes.push(`duration to ${updates.estimatedDurationMinutes} minutes`);
    }

    if (updates.priority) {
      changes.push(`priority to ${updates.priority}`);
    }

    if (updates.dueDate) {
      changes.push(`due timing`);
    }

    if (typeof updates.requiresLocation === 'boolean') {
      changes.push(updates.requiresLocation ? 'location requirement' : 'remote status');
    }

    return `Updated "${task.title}"${changes.length ? `: ${changes.join(', ')}.` : '.'}`;
  }
}
