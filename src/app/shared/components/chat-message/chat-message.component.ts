import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AssistantMessage } from '../../models/assistant-message.model';
import { SuggestionAction } from '../suggestion-card/suggestion-card.component';

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss'],
  standalone: false,
})
export class ChatMessageComponent {
  @Input({ required: true }) message!: AssistantMessage;
  @Output() suggestionAction = new EventEmitter<{ taskId: string; action: SuggestionAction }>();

  get displayContent(): string {
    const content = this.message.content?.trim();
    if (content) {
      return content;
    }

    return this.message.role === 'user' ? '' : 'I have an update, but the message text was empty.';
  }
}
