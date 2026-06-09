import { TaskService } from './task.service';
import { BackendApiService } from '../shared/services/backend-api.service';
import { Task } from '../shared/models/domain.models';

describe('TaskService', () => {
  let backendApiService: jasmine.SpyObj<BackendApiService>;

  beforeEach(() => {
    localStorage.clear();
    backendApiService = jasmine.createSpyObj<BackendApiService>('BackendApiService', ['getTasks', 'updateTask']);
  });

  it('syncs tasks from the backend and replaces local task state', async () => {
    const localTask = buildTask({ id: 'local', title: 'Local task' });
    const backendTask = buildTask({ id: 'backend', title: 'Backend task' });
    const service = new TaskService(backendApiService);

    service.importTask(localTask);
    backendApiService.getTasks.and.resolveTo([backendTask]);

    const syncedTasks = await service.syncFromBackend();

    expect(backendApiService.getTasks).toHaveBeenCalledOnceWith();
    expect(syncedTasks).toEqual([backendTask]);
    expect(service.getAllTasks()).toEqual([backendTask]);
    expect(service.getTaskById('local')).toBeNull();
  });

  it('returns local tasks when no backend client is available', async () => {
    const service = new TaskService();
    const localTask = service.importTask(buildTask({ id: 'local', title: 'Local task' }));

    const syncedTasks = await service.syncFromBackend();

    expect(syncedTasks).toEqual([localTask]);
  });

  it('updates tasks through the backend and imports the returned task', async () => {
    const service = new TaskService(backendApiService);
    const localTask = service.importTask(buildTask({ id: 'task-1', title: 'Old title' }));
    const backendTask = {
      ...localTask,
      title: 'Backend title',
      updatedAt: '2026-06-08T13:00:00.000Z',
    };

    backendApiService.updateTask.and.resolveTo(backendTask);

    const updatedTask = await service.updateTaskWithBackend('task-1', { title: 'Backend title' });

    expect(backendApiService.updateTask).toHaveBeenCalledOnceWith('task-1', { title: 'Backend title' });
    expect(updatedTask).toEqual(backendTask);
    expect(service.getTaskById('task-1')).toEqual(backendTask);
  });

  it('falls back to local update when backend update fails', async () => {
    spyOn(console, 'warn');
    const service = new TaskService(backendApiService);
    service.importTask(buildTask({ id: 'task-1', title: 'Old title' }));
    backendApiService.updateTask.and.rejectWith(new Error('Backend unavailable'));

    const updatedTask = await service.updateTaskWithBackend('task-1', { title: 'Local title' });

    expect(console.warn).toHaveBeenCalled();
    expect(updatedTask?.title).toBe('Local title');
    expect(service.getTaskById('task-1')?.title).toBe('Local title');
  });

  it('marks tasks done through the backend helper', async () => {
    const service = new TaskService(backendApiService);
    const localTask = service.importTask(buildTask({ id: 'task-1', status: 'pending' }));
    const backendTask = {
      ...localTask,
      status: 'done' as const,
      updatedAt: '2026-06-08T13:00:00.000Z',
    };
    backendApiService.updateTask.and.resolveTo(backendTask);

    const updatedTask = await service.markTaskDoneWithBackend('task-1');

    expect(backendApiService.updateTask).toHaveBeenCalledOnceWith('task-1', { status: 'done' });
    expect(updatedTask?.status).toBe('done');
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
