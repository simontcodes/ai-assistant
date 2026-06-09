import { TaskBacklogPage } from './task-backlog.page';
import { TaskService } from '../task.service';
import { Task } from '../../shared/models/domain.models';

describe('TaskBacklogPage', () => {
  let page: TaskBacklogPage;
  let taskService: jasmine.SpyObj<TaskService>;

  beforeEach(() => {
    taskService = jasmine.createSpyObj<TaskService>('TaskService', [
      'getAllTasks',
      'syncFromBackend',
      'markTaskDone',
      'markTaskDoneWithBackend',
      'getTaskById',
      'updateTask',
      'updateTaskWithBackend',
    ]);
    taskService.getAllTasks.and.returnValue([]);
    taskService.syncFromBackend.and.resolveTo([]);
    taskService.markTaskDoneWithBackend.and.resolveTo(null);
    taskService.updateTaskWithBackend.and.resolveTo(null);
    page = new TaskBacklogPage(taskService);
  });

  it('syncs tasks from the backend when the backlog page is entered', async () => {
    await page.ionViewWillEnter();

    expect(taskService.syncFromBackend).toHaveBeenCalledOnceWith();
    expect(page.isSyncingTasks).toBeFalse();
  });

  it('keeps local tasks available when backend sync fails', async () => {
    const localTask = buildTask({ id: 'local', title: 'Local task' });
    spyOn(console, 'warn');
    taskService.getAllTasks.and.returnValue([localTask]);
    taskService.syncFromBackend.and.rejectWith(new Error('Backend unavailable'));

    await page.ionViewWillEnter();

    expect(console.warn).toHaveBeenCalled();
    expect(page.tasks).toEqual([localTask]);
    expect(page.isSyncingTasks).toBeFalse();
  });

  it('shows pending tasks by default', () => {
    const pendingTask = buildTask({ id: 'pending', title: 'Pending task', status: 'pending' });
    const doneTask = buildTask({ id: 'done', title: 'Done task', status: 'done' });
    taskService.getAllTasks.and.returnValue([pendingTask, doneTask]);

    expect(page.selectedStatusFilter).toBe('pending');
    expect(page.tasks).toEqual([pendingTask]);
  });

  it('can show done tasks', () => {
    const pendingTask = buildTask({ id: 'pending', title: 'Pending task', status: 'pending' });
    const doneTask = buildTask({ id: 'done', title: 'Done task', status: 'done' });
    taskService.getAllTasks.and.returnValue([pendingTask, doneTask]);

    page.selectedStatusFilter = 'done';

    expect(page.tasks).toEqual([doneTask]);
  });

  it('can show all task statuses', () => {
    const pendingTask = buildTask({ id: 'pending', title: 'Pending task', status: 'pending' });
    const doneTask = buildTask({ id: 'done', title: 'Done task', status: 'done' });
    taskService.getAllTasks.and.returnValue([pendingTask, doneTask]);

    page.selectedStatusFilter = 'all';

    expect(page.tasks).toEqual([pendingTask, doneTask]);
  });

  it('applies detail filters after status filtering', () => {
    const highPendingTask = buildTask({
      id: 'high-pending',
      title: 'High pending task',
      priority: 'high',
      status: 'pending',
    });
    const highDoneTask = buildTask({
      id: 'high-done',
      title: 'High done task',
      priority: 'high',
      status: 'done',
    });
    const mediumPendingTask = buildTask({
      id: 'medium-pending',
      title: 'Medium pending task',
      priority: 'medium',
      status: 'pending',
    });
    taskService.getAllTasks.and.returnValue([highPendingTask, highDoneTask, mediumPendingTask]);

    page.selectedStatusFilter = 'pending';
    page.selectedFilter = 'high';

    expect(page.tasks).toEqual([highPendingTask]);
  });

  it('marks tasks done through the backend-backed task service method', async () => {
    await page.markDone('task-1');

    expect(taskService.markTaskDoneWithBackend).toHaveBeenCalledOnceWith('task-1');
  });

  it('saves editor changes through the backend-backed task service method', async () => {
    page.editorTask = buildTask({ id: 'task-1', title: 'Old title' });
    page.editorForm = {
      id: 'task-1',
      title: 'Updated title',
      description: 'Updated description',
      estimatedDurationMinutes: 25,
      estimatedDurationConfidence: 'high',
      priority: 'high',
      status: 'pending',
      canDoRemotely: true,
      requiresLocation: false,
      locationType: '',
      locationAddress: '',
      bestTimeOfDay: 'morning',
      energyRequired: 'low',
      dueDate: '',
    };

    await page.saveEditor();

    expect(taskService.updateTaskWithBackend).toHaveBeenCalledOnceWith('task-1', {
      title: 'Updated title',
      description: 'Updated description',
      estimatedDurationMinutes: 25,
      estimatedDurationConfidence: 'high',
      priority: 'high',
      status: 'pending',
      canDoRemotely: true,
      requiresLocation: false,
      locationType: undefined,
      locationAddress: undefined,
      bestTimeOfDay: ['morning'],
      energyRequired: 'low',
      dueDate: undefined,
    });
    expect(page.editorForm).toBeNull();
  });

  function buildTask(overrides: Partial<Task>): Task {
    return {
      id: 'task',
      title: 'Task',
      estimatedDurationMinutes: 20,
      estimatedDurationConfidence: 'medium',
      priority: 'medium',
      status: 'pending',
      canDoRemotely: true,
      requiresLocation: false,
      bestTimeOfDay: ['morning', 'afternoon', 'evening'],
      energyRequired: 'low',
      createdAt: '2026-06-08T12:00:00.000Z',
      updatedAt: '2026-06-08T12:00:00.000Z',
      ...overrides,
    };
  }
});
