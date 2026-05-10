import { Injectable } from '@angular/core';
import { Task, TimeOfDay } from '../shared/models/domain.models';
import { environment } from '../../environments/environment';
import { OPENAI_API_KEY_STORAGE_KEY } from '../shared/constants/openai-config';

export type TaskExtractionResult = Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

type AiTaskExtractionResult = {
  title: string;
  description: string | null;
  estimatedDurationMinutes: number;
  estimatedDurationConfidence: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  canDoRemotely: boolean;
  requiresLocation: boolean;
  locationType: string | null;
  locationAddress: string | null;
  bestTimeOfDay: TimeOfDay[];
  energyRequired: 'low' | 'medium' | 'high';
  dueDate: string | null;
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

@Injectable({
  providedIn: 'root',
})
export class TaskExtractionService {
  async extractTaskFromMessage(message: string): Promise<TaskExtractionResult> {
    const aiResult = await this.tryExtractTaskWithOpenAi(message);
    if (aiResult) {
      return aiResult;
    }

    return this.extractTaskWithHeuristics(message);
  }

  private async tryExtractTaskWithOpenAi(message: string): Promise<TaskExtractionResult | null> {
    const apiKey = this.getOpenAiApiKey();
    if (!environment.openAi.enabled || !apiKey) {
      return null;
    }

    try {
      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: environment.openAi.model,
          input: [
            {
              role: 'system',
              content: this.buildExtractionSystemPrompt(),
            },
            {
              role: 'user',
              content: message,
            },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'task_extraction',
              strict: true,
              schema: this.buildTaskExtractionSchema(),
            },
          },
        }),
      });

      if (!response.ok) {
        console.warn('OpenAI task extraction failed', response.status, await response.text());
        return null;
      }

      const payload = (await response.json()) as OpenAiResponse;
      const outputText = this.getOpenAiOutputText(payload);
      if (!outputText) {
        return null;
      }

      return this.validate(this.normalizeAiResult(JSON.parse(outputText) as AiTaskExtractionResult));
    } catch (error) {
      console.warn('OpenAI task extraction unavailable. Falling back to local extraction.', error);
      return null;
    }
  }

  private extractTaskWithHeuristics(message: string): TaskExtractionResult {
    const cleanedMessage = message.trim();
    const lower = cleanedMessage.toLowerCase();

    const title = this.buildTitle(cleanedMessage);
    const estimatedDurationMinutes = this.estimateDuration(lower);
    const requiresLocation = this.detectLocationRequirement(lower);
    const canDoRemotely = !requiresLocation;
    const bestTimeOfDay = this.estimateBestTimeOfDay(lower);
    const description = cleanedMessage.endsWith('.') ? cleanedMessage : `${cleanedMessage}.`;

    const result: TaskExtractionResult = {
      title,
      description,
      estimatedDurationMinutes,
      estimatedDurationConfidence: estimatedDurationMinutes >= 45 ? 'medium' : 'high',
      priority: this.estimatePriority(lower),
      canDoRemotely,
      requiresLocation,
      locationType: requiresLocation ? this.estimateLocationType(lower) : undefined,
      bestTimeOfDay,
      energyRequired: this.estimateEnergy(lower),
      dueDate: this.estimateDueDate(lower) ?? undefined,
    };

    return this.validate(result);
  }

  private buildExtractionSystemPrompt(): string {
    return [
      'You are a task extraction engine for a personal Android planning assistant.',
      'Convert the user message into structured task metadata.',
      'The app uses this metadata to decide whether a task fits into calendar gaps.',
      'Rules:',
      '- Always estimate duration in minutes.',
      '- If uncertain, choose a conservative estimate.',
      '- Do not invent exact addresses.',
      '- Use null for unknown optional values.',
      '- Determine if the task can be done remotely.',
      '- Determine if the task requires a location or travel.',
      '- Determine best time of day if relevant.',
      '- Determine energy required.',
      '- Set dueDate only when the user clearly says or strongly implies a deadline.',
      '- Return ISO 8601 strings for dueDate when known.',
    ].join('\n');
  }

  private buildTaskExtractionSchema(): Record<string, unknown> {
    return {
      type: 'object',
      additionalProperties: false,
      required: [
        'title',
        'description',
        'estimatedDurationMinutes',
        'estimatedDurationConfidence',
        'priority',
        'canDoRemotely',
        'requiresLocation',
        'locationType',
        'locationAddress',
        'bestTimeOfDay',
        'energyRequired',
        'dueDate',
      ],
      properties: {
        title: { type: 'string' },
        description: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
        },
        estimatedDurationMinutes: { type: 'integer' },
        estimatedDurationConfidence: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
        },
        canDoRemotely: { type: 'boolean' },
        requiresLocation: { type: 'boolean' },
        locationType: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
        },
        locationAddress: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
        },
        bestTimeOfDay: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['morning', 'afternoon', 'evening', 'night'],
          },
        },
        energyRequired: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
        },
        dueDate: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
        },
      },
    };
  }

  private normalizeAiResult(result: AiTaskExtractionResult): TaskExtractionResult {
    return {
      title: result.title,
      description: result.description ?? undefined,
      estimatedDurationMinutes: result.estimatedDurationMinutes,
      estimatedDurationConfidence: result.estimatedDurationConfidence,
      priority: result.priority,
      canDoRemotely: result.canDoRemotely,
      requiresLocation: result.requiresLocation,
      locationType: result.locationType ?? undefined,
      locationAddress: result.locationAddress ?? undefined,
      bestTimeOfDay: result.bestTimeOfDay,
      energyRequired: result.energyRequired,
      dueDate: result.dueDate ?? undefined,
    };
  }

  private getOpenAiApiKey(): string {
    return environment.openAi.apiKey || localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) || '';
  }

  private getOpenAiOutputText(response: OpenAiResponse): string | null {
    if (response.output_text) {
      return response.output_text;
    }

    for (const output of response.output ?? []) {
      const text = output.content?.find((content) => content.type === 'output_text' && content.text)?.text;
      if (text) {
        return text;
      }
    }

    return null;
  }

  private buildTitle(message: string): string {
    const cleaned = message
      .replace(
        /^(i need to|remind me to|remember to|i want to|please remind me to|add task|add a task|add todo|add a todo)\s+/i,
        '',
      )
      .replace(/^save\s+/i, '')
      .replace(/\s+for later$/i, '')
      .replace(/^put\s+/i, '')
      .replace(/\s+in (my )?backlog$/i, '')
      .replace(/[.?!]+$/g, '')
      .trim();

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  private estimateDuration(message: string): number {
    const explicitMinutes = message.match(/(\d+)\s*(minute|min)/i);
    if (explicitMinutes) {
      return Number(explicitMinutes[1]);
    }

    const explicitHours = message.match(/(\d+)\s*(hour|hr)/i);
    if (explicitHours) {
      return Number(explicitHours[1]) * 60;
    }

    if (/(pay|bill|email|reply|call)/i.test(message)) {
      return 15;
    }

    if (/(return|drop off|pickup|pick up|errand|grocer)/i.test(message)) {
      return 30;
    }

    if (/(exercise|work out|gym)/i.test(message)) {
      return 45;
    }

    if (/(side project|project|study|write)/i.test(message)) {
      return 60;
    }

    return 25;
  }

  private estimatePriority(message: string): 'low' | 'medium' | 'high' {
    if (/(high priority|urgent|asap|today|tonight)/i.test(message)) {
      return 'high';
    }

    if (/(low priority|not urgent|whenever|someday|eventually)/i.test(message)) {
      return 'low';
    }

    if (/(medium priority|normal priority|this week|soon|important)/i.test(message)) {
      return 'medium';
    }

    return 'medium';
  }

  private detectLocationRequirement(message: string): boolean {
    return /(return|drop off|pickup|pick up|buy|grocer|store|office|bank|mail)/i.test(message);
  }

  private estimateLocationType(message: string): string | undefined {
    if (/amazon/i.test(message)) {
      return 'Amazon return drop-off';
    }

    if (/bank/i.test(message)) {
      return 'Bank';
    }

    if (/store|buy|grocer/i.test(message)) {
      return 'Store';
    }

    return 'Errand location';
  }

  private estimateBestTimeOfDay(message: string): TimeOfDay[] {
    if (/(morning)/i.test(message)) {
      return ['morning'];
    }

    if (/(evening|tonight)/i.test(message)) {
      return ['evening'];
    }

    if (/(bank|store|return|drop off)/i.test(message)) {
      return ['afternoon'];
    }

    return ['morning', 'afternoon', 'evening'];
  }

  private estimateEnergy(message: string): 'low' | 'medium' | 'high' {
    if (/(exercise|work out|deep work|study)/i.test(message)) {
      return 'high';
    }

    if (/(plan|project|write)/i.test(message)) {
      return 'medium';
    }

    return 'low';
  }

  private estimateDueDate(message: string): string | null {
    const today = new Date();

    if (/today|tonight/i.test(message)) {
      return today.toISOString();
    }

    if (/tomorrow/i.test(message)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString();
    }

    if (/this week/i.test(message)) {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 5);
      return endOfWeek.toISOString();
    }

    return null;
  }

  private validate(result: TaskExtractionResult): TaskExtractionResult {
    const validTimeOfDay: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
    const bestTimeOfDay = (result.bestTimeOfDay ?? []).filter((time) => validTimeOfDay.includes(time));
    const validConfidence = ['low', 'medium', 'high'].includes(result.estimatedDurationConfidence)
      ? result.estimatedDurationConfidence
      : 'low';
    const validPriority = ['low', 'medium', 'high'].includes(result.priority) ? result.priority : 'medium';
    const validEnergy = ['low', 'medium', 'high'].includes(result.energyRequired ?? '')
      ? result.energyRequired
      : 'medium';
    const validDueDate = result.dueDate && !Number.isNaN(new Date(result.dueDate).getTime())
      ? new Date(result.dueDate).toISOString()
      : undefined;

    return {
      ...result,
      title: result.title?.trim() || 'Untitled task',
      estimatedDurationConfidence: validConfidence,
      priority: validPriority,
      canDoRemotely: Boolean(result.canDoRemotely),
      requiresLocation: Boolean(result.requiresLocation),
      estimatedDurationMinutes: Math.max(5, result.estimatedDurationMinutes),
      bestTimeOfDay,
      energyRequired: validEnergy,
      dueDate: validDueDate,
    };
  }
}
