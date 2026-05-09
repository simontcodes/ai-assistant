import { Injectable } from '@angular/core';
import { CalendarGap, SchedulingContext, Task, TaskSuggestion } from '../shared/models/domain.models';
import { TravelTimeService } from '../location/travel-time.service';
import { getTimeOfDay, isWithinTimeRange } from '../shared/utils/date.utils';

@Injectable({
  providedIn: 'root',
})
export class SchedulingService {
  constructor(private readonly travelTimeService: TravelTimeService) {}

  async getSuggestionsForGap(gap: CalendarGap, tasks: Task[], context: SchedulingContext): Promise<TaskSuggestion[]> {
    const evaluated = await Promise.all(
      tasks
        .filter((task) => task.status === 'pending')
        .map(async (task) => this.evaluateTask(task, gap, context)),
    );

    return evaluated
      .filter((suggestion) => suggestion.feasible)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  async getRejectedTasks(gap: CalendarGap, tasks: Task[], context: SchedulingContext): Promise<TaskSuggestion[]> {
    const evaluated = await Promise.all(
      tasks
        .filter((task) => task.status === 'pending')
        .map(async (task) => this.evaluateTask(task, gap, context)),
    );

    return evaluated.filter((suggestion) => !suggestion.feasible);
  }

  private async evaluateTask(task: Task, gap: CalendarGap, context: SchedulingContext): Promise<TaskSuggestion> {
    const now = new Date(context.now);
    const duringWorkHours = isWithinTimeRange(
      now,
      context.preferences.workDayStart,
      context.preferences.workDayEnd,
    );

    let travelTimeMinutes = 0;
    if (task.requiresLocation) {
      travelTimeMinutes =
        (await this.travelTimeService.estimateTravelTimeMinutes(context.currentLocation!, {
          label: gap.contextLocation === 'work' ? 'work' : 'custom',
          name: task.locationType ?? 'Task destination',
        })) ?? 20;
    }

    const totalRequiredMinutes = task.estimatedDurationMinutes + (task.requiresLocation ? travelTimeMinutes * 2 : 0);

    if (duringWorkHours && !context.preferences.allowPersonalTasksDuringWork) {
      return {
        taskId: task.id,
        gapId: gap.id,
        score: 0,
        feasible: false,
        reason: '',
        rejectionReason: 'Personal tasks are disabled during work hours.',
        travelTimeMinutes,
        totalRequiredMinutes,
      };
    }

    if (totalRequiredMinutes > gap.durationMinutes) {
      return {
        taskId: task.id,
        gapId: gap.id,
        score: 0,
        feasible: false,
        reason: '',
        rejectionReason: `Needs about ${totalRequiredMinutes} minutes and the gap is only ${gap.durationMinutes} minutes.`,
        travelTimeMinutes,
        totalRequiredMinutes,
      };
    }

    const priorityScore = {
      low: 1,
      medium: 3,
      high: 5,
    }[task.priority];

    const urgencyScore = this.getUrgencyScore(task.dueDate);
    const durationFitScore = Math.max(1, gap.durationMinutes - totalRequiredMinutes <= 20 ? 4 : 2);
    const timeOfDayScore = (task.bestTimeOfDay ?? []).includes(getTimeOfDay(now)) ? 2 : 0;
    const energyMatchScore = this.getEnergyMatchScore(task.energyRequired, now);
    const travelFeasibilityScore = task.requiresLocation ? Math.max(1, 4 - Math.round(travelTimeMinutes / 10)) : 4;

    const score =
      priorityScore + urgencyScore + durationFitScore + timeOfDayScore + energyMatchScore + travelFeasibilityScore;

    const reasonParts = [
      `It takes about ${task.estimatedDurationMinutes} minutes`,
      task.requiresLocation
        ? `travel looks manageable at roughly ${travelTimeMinutes * 2} minutes round trip`
        : 'it can be done remotely',
      `and you have ${gap.durationMinutes} free minutes in this gap`,
    ];

    return {
      taskId: task.id,
      gapId: gap.id,
      score,
      feasible: true,
      reason: `Good fit because ${reasonParts.join(', ')}.`,
      travelTimeMinutes,
      totalRequiredMinutes,
    };
  }

  private getUrgencyScore(dueDate?: string): number {
    if (!dueDate) {
      return 0;
    }

    const now = new Date();
    const due = new Date(dueDate);
    const daysAway = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);

    if (daysAway <= 0) {
      return 5;
    }

    if (daysAway === 1) {
      return 3;
    }

    if (daysAway <= 7) {
      return 1;
    }

    return 0;
  }

  private getEnergyMatchScore(energy: Task['energyRequired'], now: Date): number {
    const timeOfDay = getTimeOfDay(now);
    const preferredEnergy =
      timeOfDay === 'morning' ? 'high' : timeOfDay === 'afternoon' ? 'medium' : 'low';

    return energy === preferredEnergy ? 2 : energy === 'medium' ? 1 : 0;
  }
}
