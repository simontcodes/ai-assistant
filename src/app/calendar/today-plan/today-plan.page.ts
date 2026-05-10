import { Component, OnInit } from '@angular/core';
import { CalendarFetchDebugInfo, CalendarService } from '../calendar.service';
import { GapDetectionService } from '../gap-detection.service';
import { CalendarAttendee, CalendarEvent, CalendarGap, GapRecommendation } from '../../shared/models/domain.models';
import { PreferencesService } from '../../settings/preferences.service';
import { formatTime } from '../../shared/utils/date.utils';
import { TaskService } from '../../tasks/task.service';
import { SchedulingService } from '../../scheduling/scheduling.service';
import { KnownLocationService } from '../../location/known-location.service';
import { LocationService } from '../../location/location.service';

@Component({
  selector: 'app-today-plan',
  templateUrl: './today-plan.page.html',
  styleUrls: ['./today-plan.page.scss'],
  standalone: false,
})
export class TodayPlanPage implements OnInit {
  events: CalendarEvent[] = [];
  gaps: CalendarGap[] = [];
  recommendations: GapRecommendation[] = [];
  debugInfo: CalendarFetchDebugInfo | null = null;
  isLoading = false;
  loadError = '';

  constructor(
    private readonly calendarService: CalendarService,
    private readonly gapDetectionService: GapDetectionService,
    private readonly preferencesService: PreferencesService,
    private readonly taskService: TaskService,
    private readonly schedulingService: SchedulingService,
    private readonly locationService: LocationService,
    private readonly knownLocationService: KnownLocationService,
  ) {}

  ngOnInit(): void {
    void this.loadEvents();
  }

  async loadEvents(forceRefresh = false): Promise<void> {
    this.isLoading = true;
    this.loadError = '';

    if (forceRefresh) {
      this.calendarService.clearCache();
    }

    try {
      this.events = await this.calendarService.getTodayEvents();
      this.debugInfo = this.calendarService.getLastDebugInfo();
      this.gaps = this.detectGaps();
      this.recommendations = await this.buildRecommendations();
    } catch (error) {
      this.debugInfo = this.calendarService.getLastDebugInfo();
      this.loadError = error instanceof Error ? error.message : 'Could not load calendar events.';
    } finally {
      this.isLoading = false;
    }
  }

  formatTime = formatTime;

  attendeeLabel(attendee: CalendarAttendee): string {
    return attendee.name || attendee.email;
  }

  gapRecommendation(gapId: string): GapRecommendation | undefined {
    return this.recommendations.find((recommendation) => recommendation.gap.id === gapId);
  }

  shouldShowGap(gapId: string): boolean {
    return Boolean(this.gapRecommendation(gapId)?.task);
  }

  handleRecommendationAction(gapId: string, action: 'do-now' | 'later' | 'done'): void {
    const recommendation = this.gapRecommendation(gapId);
    if (!recommendation?.task) {
      return;
    }

    if (action === 'done') {
      this.taskService.markTaskDone(recommendation.task.id);
      recommendation.state = 'done';
      void this.buildRecommendations().then((recommendations) => {
        this.recommendations = recommendations;
      });
      return;
    }

    recommendation.state = action === 'do-now' ? 'accepted' : 'deferred';
  }

  selectRecommendationTask(gapId: string, taskId: string): void {
    const recommendation = this.gapRecommendation(gapId);
    const selected = recommendation?.alternatives?.find((option) => option.task.id === taskId);

    if (!recommendation || !selected) {
      return;
    }

    recommendation.task = selected.task;
    recommendation.suggestion = selected.suggestion;
    recommendation.state = 'active';
  }

  private detectGaps(): CalendarGap[] {
    const preferences = this.preferencesService.getPreferences();
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return this.gapDetectionService.detectGaps(
      this.events,
      now.toISOString(),
      endOfDay.toISOString(),
      preferences.minimumUsefulGapMinutes,
    );
  }

  private async buildRecommendations(): Promise<GapRecommendation[]> {
    const pendingTasks = this.taskService.getPendingTasks();
    const preferences = this.preferencesService.getPreferences();
    const currentLocation = await this.locationService.getCurrentLocation();
    const knownLocations = this.knownLocationService.getKnownLocations();
    const now = new Date().toISOString();

    return Promise.all(
      this.gaps.map(async (gap) => {
        const suggestions = await this.schedulingService.getSuggestionsForGap(gap, pendingTasks, {
          now,
          currentLocation,
          knownLocations,
          preferences,
        });
        const topSuggestion = suggestions[0];

        if (topSuggestion) {
          const alternatives = suggestions
            .map((suggestion) => {
              const task = pendingTasks.find((item) => item.id === suggestion.taskId);
              return task ? { task, suggestion } : null;
            })
            .filter((option): option is NonNullable<typeof option> => option !== null);

          return {
            gap,
            task: alternatives[0]?.task,
            suggestion: topSuggestion,
            alternatives,
            state: 'active',
          };
        }

        const rejections = await this.schedulingService.getRejectedTasks(gap, pendingTasks, {
          now,
          currentLocation,
          knownLocations,
          preferences,
        });

        return {
          gap,
          rejectionReason:
            pendingTasks.length === 0
              ? 'No pending tasks yet.'
              : rejections[0]?.rejectionReason ?? 'No pending task fits this gap.',
          state: 'active',
        };
      }),
    );
  }
}
