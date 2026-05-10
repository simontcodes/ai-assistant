import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../../models/domain.models';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
  standalone: false,
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Output() markDone = new EventEmitter<string>();
  @Output() editTask = new EventEmitter<string>();

  get badgeLabel(): string {
    if (this.task.status === 'done') {
      return 'Done';
    }

    if (this.task.priority === 'high') {
      return 'High priority';
    }

    if (this.task.priority === 'low') {
      return 'Low priority';
    }

    return 'Medium priority';
  }

  get visualClass(): string {
    if (/grocery|shop|buy/i.test(this.task.title)) {
      return 'market';
    }

    if (/yoga|exercise|work out/i.test(this.task.title)) {
      return 'wellness';
    }

    return 'desk';
  }
}
