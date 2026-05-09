import { Injectable } from '@angular/core';
import { Task, TimeOfDay } from '../shared/models/domain.models';

export type TaskExtractionResult = Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

@Injectable({
  providedIn: 'root',
})
export class TaskExtractionService {
  async extractTaskFromMessage(message: string): Promise<TaskExtractionResult> {
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

  private buildTitle(message: string): string {
    const cleaned = message
      .replace(/^(i need to|remind me to|i want to|please remind me to)\s+/i, '')
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
    if (/(urgent|asap|today|tonight)/i.test(message)) {
      return 'high';
    }

    if (/(this week|soon|important)/i.test(message)) {
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

    return {
      ...result,
      estimatedDurationMinutes: Math.max(5, result.estimatedDurationMinutes),
      bestTimeOfDay,
    };
  }
}
