import { Component } from '@angular/core';
import { Task } from '../../shared/models/domain.models';
import { TaskService } from '../task.service';

@Component({
  selector: 'app-task-backlog',
  templateUrl: './task-backlog.page.html',
  styleUrls: ['./task-backlog.page.scss'],
  standalone: false,
})
export class TaskBacklogPage {
  selectedFilter: 'all' | 'high' | 'remote' = 'all';

  constructor(private readonly taskService: TaskService) {}

  get tasks(): Task[] {
    const allTasks = this.taskService.getAllTasks();

    if (this.selectedFilter === 'high') {
      return allTasks.filter((task) => task.priority === 'high');
    }

    if (this.selectedFilter === 'remote') {
      return allTasks.filter((task) => task.canDoRemotely);
    }

    return allTasks;
  }

  markDone(taskId: string): void {
    this.taskService.markTaskDone(taskId);
  }
}
