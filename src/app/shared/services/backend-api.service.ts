import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task } from '../models/domain.models';

export interface AssistantMessageResponse {
  reply: string;
  task?: Task;
  source?: 'openai' | 'fallback';
}

@Injectable({
  providedIn: 'root',
})
export class BackendApiService {
  private readonly baseUrl = this.resolveBaseUrl();

  constructor(private readonly http: HttpClient) {}

  postAssistantMessage(message: string): Promise<AssistantMessageResponse> {
    return firstValueFrom(
      this.http.post<AssistantMessageResponse>(`${this.baseUrl}/assistant/message`, {
        message,
      }),
    );
  }

  getTasks(): Promise<Task[]> {
    return firstValueFrom(this.http.get<Task[]>(`${this.baseUrl}/tasks`));
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    return firstValueFrom(this.http.post<Task>(`${this.baseUrl}/tasks`, task));
  }

  updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    return firstValueFrom(this.http.patch<Task>(`${this.baseUrl}/tasks/${taskId}`, updates));
  }

  deleteTask(taskId: string): Promise<{ ok: boolean }> {
    return firstValueFrom(this.http.delete<{ ok: boolean }>(`${this.baseUrl}/tasks/${taskId}`));
  }

  getTodaySchedule(): Promise<unknown> {
    return firstValueFrom(this.http.get<unknown>(`${this.baseUrl}/schedule/today`));
  }

  getTodayCalendar(): Promise<unknown> {
    return firstValueFrom(this.http.get<unknown>(`${this.baseUrl}/calendar/today`));
  }

  private resolveBaseUrl(): string {
    if (Capacitor.getPlatform() === 'android' && environment.backend.androidApiBaseUrl) {
      return environment.backend.androidApiBaseUrl;
    }

    return environment.backend.apiBaseUrl;
  }
}
