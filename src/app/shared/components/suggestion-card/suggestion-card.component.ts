import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AssistantSuggestionCard } from '../../models/assistant-message.model';

export type SuggestionAction = 'do-now' | 'done' | 'later';

@Component({
  selector: 'app-suggestion-card',
  templateUrl: './suggestion-card.component.html',
  styleUrls: ['./suggestion-card.component.scss'],
  standalone: false,
})
export class SuggestionCardComponent {
  @Input({ required: true }) suggestion!: AssistantSuggestionCard;
  @Input() rank = 1;
  @Output() actionSelected = new EventEmitter<{ taskId: string; action: SuggestionAction }>();

  onAction(action: SuggestionAction): void {
    this.actionSelected.emit({
      taskId: this.suggestion.taskId,
      action,
    });
  }
}
