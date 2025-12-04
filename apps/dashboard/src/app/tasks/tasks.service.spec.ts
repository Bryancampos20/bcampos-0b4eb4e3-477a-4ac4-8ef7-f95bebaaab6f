import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TasksService, Task, CreateTaskDto, UpdateTaskDto } from './tasks.service';
import { environment } from '../../environments/environment';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;

  const BASE_URL = `${environment.apiUrl}/tasks`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TasksService],
    });

    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET tasks from backend', () => {
    const mockTasks: Task[] = [
      {
        id: 't1',
        title: 'Task 1',
        description: 'Desc 1',
        category: 'CORE',
        status: 'OPEN',
        ownerId: 'u1',
        organizationId: 'org-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    let received: Task[] = [];
    service.getTasks().subscribe((tasks) => (received = tasks));

    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');

    req.flush(mockTasks);

    expect(received).toEqual(mockTasks);
  });

  it('should POST new task to backend', () => {
    const dto: CreateTaskDto = {
      title: 'New task',
      description: 'Something',
      category: 'QA',
      status: 'OPEN',
    };

    const created: Task = {
      id: 'created-id',
      title: dto.title,
      description: dto.description,
      category: dto.category,
      status: dto.status!,
      ownerId: 'user-1',
      organizationId: 'org-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let received: Task | null = null;
    service.createTask(dto).subscribe((task) => (received = task));

    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);

    req.flush(created);

    expect(received).toEqual(created);
  });

  it('should PUT updated task to backend', () => {
    const id = 'task-1';
    const dto: UpdateTaskDto = {
      title: 'Updated',
      status: 'DONE',
    };

    const updated: Task = {
      id,
      title: 'Updated',
      description: 'Old desc',
      category: 'CORE',
      status: 'DONE',
      ownerId: 'user-1',
      organizationId: 'org-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let received: Task | null = null;
    service.updateTask(id, dto).subscribe((task) => (received = task));

    const req = httpMock.expectOne(`${BASE_URL}/${id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);

    req.flush(updated);

    expect(received).toEqual(updated);
  });

  it('should DELETE task in backend', () => {
    const id = 'task-1';

    let completed = false;
    service.deleteTask(id).subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne(`${BASE_URL}/${id}`);
    expect(req.request.method).toBe('DELETE');

    req.flush(null);
    expect(completed).toBe(true);
  });
});
