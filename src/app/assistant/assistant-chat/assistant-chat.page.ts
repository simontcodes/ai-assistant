import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { CalendarService } from '../../calendar/calendar.service';
import { ASSISTANT_PROFILE } from '../../shared/constants/assistant-profile';
import { AssistantMessage } from '../../shared/models/assistant-message.model';
import { CalendarEvent, Task } from '../../shared/models/domain.models';
import { formatTime } from '../../shared/utils/date.utils';
import { TaskService } from '../../tasks/task.service';
import { AssistantService } from '../assistant.service';
import { SuggestionAction } from '../../shared/components/suggestion-card/suggestion-card.component';

interface UpNextItem {
  id: string;
  source: 'calendar' | 'task';
  title: string;
  start: string;
  end?: string;
  location?: string;
  meta: string;
}

@Component({
  selector: 'app-assistant-chat',
  templateUrl: './assistant-chat.page.html',
  styleUrls: ['./assistant-chat.page.scss'],
  animations: [
    trigger('messageReveal', [
      transition(':enter', [
        style({
          height: 0,
          opacity: 0,
          filter: 'blur(4px)',
          transform: 'translateY(-12px) scale(0.985)',
        }),
        animate(
          '280ms cubic-bezier(0.2, 0, 0, 1)',
          style({
            height: '*',
            opacity: 1,
            filter: 'blur(0)',
            transform: 'translateY(0) scale(1)',
          }),
        ),
      ]),
      transition(':leave', [
        style({
          height: '*',
          opacity: 1,
          filter: 'blur(0)',
          transform: 'translateY(0) scale(1)',
        }),
        animate(
          '220ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({
            height: 0,
            opacity: 0,
            filter: 'blur(4px)',
            transform: 'translateY(-10px) scale(0.985)',
          }),
        ),
      ]),
    ]),
  ],
  standalone: false,
})
export class AssistantChatPage implements OnDestroy {
  private historyHideTimer: ReturnType<typeof setTimeout> | undefined;
  private suppressHistoryReveal = false;

  @ViewChild(IonContent) private readonly content?: IonContent;

  readonly assistantProfile = ASSISTANT_PROFILE;
  draftMessage = '';
  isSending = false;
  isLoadingUpNext = false;
  historyRevealed = false;
  upNextItem: UpNextItem | null = null;
  avatarState: 'idle' | 'listening' | 'thinking' | 'suggesting' | 'success' | 'warning' = 'idle';

  constructor(
    private readonly assistantService: AssistantService,
    private readonly calendarService: CalendarService,
    private readonly taskService: TaskService,
  ) {}

  get messages(): AssistantMessage[] {
    return this.assistantService.getMessages();
  }

  get visibleMessages(): AssistantMessage[] {
    if (this.historyRevealed) {
      return this.messages;
    }

    return this.messages.slice(-2);
  }

  get showQuickActions(): boolean {
    return this.messages.length <= 1;
  }

  ionViewDidEnter(): void {
    this.scrollToLatestExchange();
    void this.loadUpNextItem();
  }

  ngOnDestroy(): void {
    this.clearHistoryHideTimer();
  }

  revealHistoryTemporarily(): void {
    if (this.suppressHistoryReveal || this.messages.length <= 2) {
      return;
    }

    this.historyRevealed = true;
    this.clearHistoryHideTimer();
    this.historyHideTimer = setTimeout(() => {
      this.historyRevealed = false;
      this.scrollToLatestExchange();
    }, 3000);
  }

  trackByMessageId(_index: number, message: AssistantMessage): string {
    return message.id;
  }

  formatItemTime(item: UpNextItem): string {
    if (item.end) {
      return `${formatTime(item.start)} - ${formatTime(item.end)}`;
    }

    return formatTime(item.start);
  }

  async sendMessage(): Promise<void> {
    const content = this.draftMessage.trim();
    if (!content || this.isSending) {
      return;
    }

    this.isSending = true;
    this.avatarState = 'thinking';
    this.draftMessage = '';

    try {
      await this.assistantService.sendMessage(content);
      this.avatarState = 'suggesting';
      this.historyRevealed = false;
      this.scrollToLatestExchange();
    } finally {
      this.isSending = false;
      setTimeout(() => {
        this.avatarState = 'idle';
      }, 600);
    }
  }

  usePrompt(prompt: string): void {
    this.draftMessage = prompt;
    this.avatarState = 'listening';
  }

  async sendPrompt(prompt: string): Promise<void> {
    if (this.isSending) {
      return;
    }

    this.draftMessage = prompt;
    await this.sendMessage();
  }

  handleSuggestionAction(event: { taskId: string; action: SuggestionAction }): void {
    this.assistantService.handleSuggestionAction(event.taskId, event.action);

    if (event.action === 'done') {
      this.avatarState = 'success';
    } else if (event.action === 'later') {
      this.avatarState = 'warning';
    } else {
      this.avatarState = 'suggesting';
    }

    setTimeout(() => {
      this.avatarState = 'idle';
    }, 700);
  }

  private scrollToLatestExchange(): void {
    this.suppressHistoryReveal = true;
    setTimeout(() => {
      void this.content?.scrollToBottom(250);
    });
    setTimeout(() => {
      this.suppressHistoryReveal = false;
    }, 350);
  }

  private async loadUpNextItem(): Promise<void> {
    this.isLoadingUpNext = true;

    try {
      const [events] = await Promise.all([
        this.loadTodayCalendarEvents(),
        this.taskService.syncFromBackend().catch((error) => {
          console.warn('Backend task sync failed while loading up next. Using local tasks.', error);
          return this.taskService.getAllTasks();
        }),
      ]);

      this.upNextItem = this.findUpNextItem(events, this.taskService.getAllTasks());
    } finally {
      this.isLoadingUpNext = false;
    }
  }

  private async loadTodayCalendarEvents(): Promise<CalendarEvent[]> {
    try {
      return await this.calendarService.getTodayEvents();
    } catch (error) {
      console.warn('Calendar fetch failed while loading up next.', error);
      return [];
    }
  }

  private findUpNextItem(events: CalendarEvent[], tasks: Task[]): UpNextItem | null {
    const now = new Date();
    const calendarItems = events
      .filter((event) => new Date(event.end) > now)
      .map((event): UpNextItem => ({
        id: event.id,
        source: 'calendar',
        title: event.title,
        start: event.start,
        end: event.end,
        location: event.location,
        meta: event.calendarName || 'Google Calendar',
      }));

    const taskItems = tasks
      .filter((task) => task.status === 'pending' && task.dueDate && new Date(task.dueDate) > now)
      .map((task): UpNextItem => ({
        id: task.id,
        source: 'task',
        title: task.title,
        start: task.dueDate!,
        meta: `${task.estimatedDurationMinutes} min task`,
      }));

    return [...calendarItems, ...taskItems].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] ?? null;
  }

  private clearHistoryHideTimer(): void {
    if (this.historyHideTimer) {
      clearTimeout(this.historyHideTimer);
      this.historyHideTimer = undefined;
    }
  }
}
