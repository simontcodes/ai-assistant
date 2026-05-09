import { Component } from '@angular/core';
import { CalendarService } from '../calendar.service';
import { GapDetectionService } from '../gap-detection.service';
import { CalendarEvent, CalendarGap } from '../../shared/models/domain.models';
import { PreferencesService } from '../../settings/preferences.service';
import { combineDateAndTime, formatTime } from '../../shared/utils/date.utils';
import { TaskService } from '../../tasks/task.service';

@Component({
  selector: 'app-today-plan',
  templateUrl: './today-plan.page.html',
  styleUrls: ['./today-plan.page.scss'],
  standalone: false,
})
export class TodayPlanPage {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly gapDetectionService: GapDetectionService,
    private readonly preferencesService: PreferencesService,
    private readonly taskService: TaskService,
  ) {}

  get events(): CalendarEvent[] {
    return this.calendarService.getTodayEvents();
  }

  get gaps(): CalendarGap[] {
    const preferences = this.preferencesService.getPreferences();
    const now = new Date();
    return this.gapDetectionService.detectGaps(
      this.events,
      now.toISOString(),
      combineDateAndTime(now, preferences.workDayEnd).toISOString(),
      preferences.minimumUsefulGapMinutes,
    );
  }

  get featuredTaskTitle(): string | undefined {
    return this.taskService.getPendingTasks()[0]?.title;
  }

  formatTime = formatTime;
}
