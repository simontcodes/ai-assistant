import { Component, Input } from '@angular/core';
import { CalendarGap } from '../../models/domain.models';

@Component({
  selector: 'app-timeline-gap-card',
  templateUrl: './timeline-gap-card.component.html',
  styleUrls: ['./timeline-gap-card.component.scss'],
  standalone: false,
})
export class TimelineGapCardComponent {
  @Input({ required: true }) gap!: CalendarGap;
  @Input() recommendationTitle?: string;
  @Input() recommendationCta = 'Open Task';
}
