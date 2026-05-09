import { Component } from '@angular/core';
import { ASSISTANT_PROFILE } from '../../shared/constants/assistant-profile';
import { AssistantMessage } from '../../shared/models/assistant-message.model';
import { AssistantService } from '../assistant.service';
import { SuggestionAction } from '../../shared/components/suggestion-card/suggestion-card.component';

@Component({
  selector: 'app-assistant-chat',
  templateUrl: './assistant-chat.page.html',
  styleUrls: ['./assistant-chat.page.scss'],
  standalone: false,
})
export class AssistantChatPage {
  readonly assistantProfile = ASSISTANT_PROFILE;
  draftMessage = '';
  isSending = false;
  avatarState: 'idle' | 'listening' | 'thinking' | 'suggesting' | 'success' | 'warning' = 'idle';

  constructor(private readonly assistantService: AssistantService) {}

  get messages(): AssistantMessage[] {
    return this.assistantService.getMessages();
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
}
