import { Component } from '@angular/core';
import { Task, TimeOfDay } from '../../shared/models/domain.models';
import { TaskService } from '../task.service';

interface TaskEditorForm {
  id: string;
  title: string;
  description: string;
  estimatedDurationMinutes: number;
  estimatedDurationConfidence: Task['estimatedDurationConfidence'];
  priority: Task['priority'];
  status: Task['status'];
  canDoRemotely: boolean;
  requiresLocation: boolean;
  locationType: string;
  locationAddress: string;
  bestTimeOfDay: TimeOfDay | 'flexible';
  energyRequired: Task['energyRequired'] | 'unspecified';
  dueDate: string;
}

@Component({
  selector: 'app-task-backlog',
  templateUrl: './task-backlog.page.html',
  styleUrls: ['./task-backlog.page.scss'],
  standalone: false,
})
export class TaskBacklogPage {
  selectedStatusFilter: 'pending' | 'done' | 'all' = 'pending';
  selectedFilter: 'all' | 'high' | 'medium' | 'low' | 'remote' = 'all';
  editorTask: Task | null = null;
  editorForm: TaskEditorForm | null = null;
  isSyncingTasks = false;

  constructor(private readonly taskService: TaskService) {}

  async ionViewWillEnter(): Promise<void> {
    this.isSyncingTasks = true;

    try {
      await this.taskService.syncFromBackend();
    } catch (error) {
      console.warn('Backend task sync failed. Using locally saved tasks.', error);
    } finally {
      this.isSyncingTasks = false;
    }
  }

  get tasks(): Task[] {
    const allTasks = this.taskService.getAllTasks().filter((task) => {
      if (this.selectedStatusFilter === 'all') {
        return true;
      }

      return task.status === this.selectedStatusFilter;
    });

    if (this.selectedFilter === 'high') {
      return allTasks.filter((task) => task.priority === 'high');
    }

    if (this.selectedFilter === 'medium') {
      return allTasks.filter((task) => task.priority === 'medium');
    }

    if (this.selectedFilter === 'low') {
      return allTasks.filter((task) => task.priority === 'low');
    }

    if (this.selectedFilter === 'remote') {
      return allTasks.filter((task) => task.canDoRemotely);
    }

    return allTasks;
  }

  async markDone(taskId: string): Promise<void> {
    await this.taskService.markTaskDoneWithBackend(taskId);

    if (this.editorForm?.id === taskId) {
      this.closeEditor();
    }
  }

  openEditor(taskId: string): void {
    const task = this.taskService.getTaskById(taskId);

    if (!task) {
      return;
    }

    this.editorTask = task;
    this.editorForm = {
      id: task.id,
      title: task.title,
      description: task.description ?? '',
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      estimatedDurationConfidence: task.estimatedDurationConfidence,
      priority: task.priority,
      status: task.status,
      canDoRemotely: task.canDoRemotely,
      requiresLocation: task.requiresLocation,
      locationType: task.locationType ?? '',
      locationAddress: task.locationAddress ?? '',
      bestTimeOfDay: task.bestTimeOfDay?.[0] ?? 'flexible',
      energyRequired: task.energyRequired ?? 'unspecified',
      dueDate: this.toDateTimeLocal(task.dueDate),
    };
  }

  closeEditor(): void {
    this.editorTask = null;
    this.editorForm = null;
  }

  async saveEditor(): Promise<void> {
    if (!this.editorForm) {
      return;
    }

    const title = this.editorForm.title.trim();

    if (!title) {
      return;
    }

    const duration = Math.max(5, Math.round(Number(this.editorForm.estimatedDurationMinutes) || 30));
    const description = this.editorForm.description.trim();
    const locationType = this.editorForm.locationType.trim();
    const locationAddress = this.editorForm.locationAddress.trim();

    await this.taskService.updateTaskWithBackend(this.editorForm.id, {
      title,
      description: description || undefined,
      estimatedDurationMinutes: duration,
      estimatedDurationConfidence: this.editorForm.estimatedDurationConfidence,
      priority: this.editorForm.priority,
      status: this.editorForm.status,
      canDoRemotely: this.editorForm.canDoRemotely,
      requiresLocation: this.editorForm.requiresLocation,
      locationType: locationType || undefined,
      locationAddress: locationAddress || undefined,
      bestTimeOfDay: this.editorForm.bestTimeOfDay === 'flexible' ? undefined : [this.editorForm.bestTimeOfDay],
      energyRequired: this.editorForm.energyRequired === 'unspecified' ? undefined : this.editorForm.energyRequired,
      dueDate: this.editorForm.dueDate ? new Date(this.editorForm.dueDate).toISOString() : undefined,
    });

    this.closeEditor();
  }

  private toDateTimeLocal(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return offsetDate.toISOString().slice(0, 16);
  }
}
