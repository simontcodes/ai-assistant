import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CalendarGap, GapRecommendation } from '../../models/domain.models';

export type TimelineGapAction = 'do-now' | 'later' | 'done';

@Component({
  selector: 'app-timeline-gap-card',
  templateUrl: './timeline-gap-card.component.html',
  styleUrls: ['./timeline-gap-card.component.scss'],
  standalone: false,
})
export class TimelineGapCardComponent {
  @Input({ required: true }) gap!: CalendarGap;
  @Input() recommendation?: GapRecommendation;
  @Input() recommendationCta = 'Open Task';
  @Output() actionSelected = new EventEmitter<TimelineGapAction>();
  @Output() taskSelected = new EventEmitter<string>();

  get priorityLabel(): string {
    return this.recommendation?.task ? `${this.recommendation.task.priority} priority` : 'Task backlog';
  }

  get actionLabel(): string {
    return this.recommendation?.state === 'accepted' ? 'In Focus' : 'Do This';
  }

  get extraOptionCount(): number {
    return Math.max(0, (this.recommendation?.alternatives?.length ?? 0) - 1);
  }
}
