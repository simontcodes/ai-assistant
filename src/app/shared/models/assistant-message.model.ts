export interface AssistantSuggestionCard {
  taskId: string;
  title: string;
  reason: string;
  score: number;
  totalRequiredMinutes: number;
  travelTimeMinutes?: number;
  state?: 'active' | 'accepted' | 'deferred' | 'done';
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  suggestions?: AssistantSuggestionCard[];
}
