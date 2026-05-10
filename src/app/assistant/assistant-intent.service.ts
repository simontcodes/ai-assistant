import { Injectable } from '@angular/core';

export type AssistantIntent =
  | 'CREATE_TASK'
  | 'ASK_FOR_SUGGESTION'
  | 'MARK_TASK_DONE'
  | 'UPDATE_TASK'
  | 'GENERAL_CHAT'
  | 'UNKNOWN';

@Injectable({
  providedIn: 'root',
})
export class AssistantIntentService {
  detectIntent(message: string): AssistantIntent {
    const normalized = message.toLowerCase().trim();

    if (
      /(i need to|remind me to|remember to|i want to|add task|add a task|add todo|add a todo|save .* for later|put .* in (my )?backlog)/i.test(
        normalized,
      )
    ) {
      return 'CREATE_TASK';
    }

    if (/(what can i do now|what should i do|do i have time)/i.test(normalized)) {
      return 'ASK_FOR_SUGGESTION';
    }

    if (/(done with|finished|i did|completed)/i.test(normalized)) {
      return 'MARK_TASK_DONE';
    }

    if (/(actually|update|change|make .* priority|takes? .*minute|takes? .*hour|set .* due)/i.test(normalized)) {
      return 'UPDATE_TASK';
    }

    if (normalized.length > 0) {
      return 'GENERAL_CHAT';
    }

    return 'UNKNOWN';
  }
}
