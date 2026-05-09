import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Task } from '../shared/models/domain.models';

type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: Task['status'];
};

const STORAGE_KEY = 'ai-day-assistant.tasks.v1';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly tasksSubject = new BehaviorSubject<Task[]>(this.loadTasks());

  readonly tasks$ = this.tasksSubject.asObservable();

  createTask(taskInput: CreateTaskInput): Task {
    const now = new Date().toISOString();
    const task: Task = {
      ...taskInput,
      id: crypto.randomUUID(),
      status: taskInput.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const next = [task, ...this.tasksSubject.value];
    this.persist(next);
    return task;
  }

  updateTask(taskId: string, updates: Partial<Task>): Task | null {
    let updatedTask: Task | null = null;

    const next = this.tasksSubject.value.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      updatedTask = {
        ...task,
        ...updates,
        id: task.id,
        updatedAt: new Date().toISOString(),
      };

      return updatedTask;
    });

    this.persist(next);
    return updatedTask;
  }

  markTaskDone(taskId: string): Task | null {
    return this.updateTask(taskId, { status: 'done' });
  }

  getPendingTasks(): Task[] {
    return this.tasksSubject.value.filter((task) => task.status === 'pending');
  }

  getAllTasks(): Task[] {
    return [...this.tasksSubject.value];
  }

  findTaskByText(query: string): Task | null {
    const normalizedQuery = query.toLowerCase();
    const queryTokens = normalizedQuery.split(/\W+/).filter(Boolean);

    return this.getPendingTasks().find((task) => {
      const normalizedTitle = this.normalizeText(task.title);
      return (
        queryTokens.some((token) => normalizedTitle.includes(token)) ||
        normalizedQuery.includes(normalizedTitle) ||
        normalizedTitle.includes(this.normalizeText(normalizedQuery))
      );
    }) ?? null;
  }

  getTaskById(taskId: string): Task | null {
    return this.tasksSubject.value.find((task) => task.id === taskId) ?? null;
  }

  findLikelyTaskForUpdate(query: string, preferredTaskId?: string | null): Task | null {
    if (preferredTaskId) {
      const preferredTask = this.getTaskById(preferredTaskId);
      if (preferredTask && preferredTask.status === 'pending') {
        return preferredTask;
      }
    }

    return this.findTaskByText(query) ?? this.getPendingTasks()[0] ?? null;
  }

  private loadTasks(): Task[] {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Task[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    this.tasksSubject.next(tasks);
  }

  private normalizeText(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
