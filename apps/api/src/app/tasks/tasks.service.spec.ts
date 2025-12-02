import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { TasksService } from './tasks.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuthUser } from '@shared/auth';
import { Role } from '@shared/data';

describe('TasksService', () => {
  let tasksService: TasksService;
  let taskRepo: Repository<Task>;
  let auditLogService: AuditLogService;

  const userOwner: AuthUser = {
    id: 'user-owner-1',
    email: 'owner@example.com',
    role: Role.OWNER,
    organizationId: 'org-1',
  };

  const userViewer: AuthUser = {
    id: 'user-viewer-1',
    email: 'viewer@example.com',
    role: Role.VIEWER,
    organizationId: 'org-1',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            logTaskAction: jest.fn(),
          },
        },
      ],
    }).compile();

    tasksService = moduleRef.get(TasksService);
    taskRepo = moduleRef.get(getRepositoryToken(Task));
    auditLogService = moduleRef.get(AuditLogService);
  });

  describe('findAll', () => {
    it('should filter tasks by organizationId', async () => {
      (taskRepo.find as jest.Mock).mockResolvedValue([]);

      await tasksService.findAll(userOwner);

      expect(taskRepo.find).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      });
    });
  });

  describe('create', () => {
    it('should create a task with ownerId and organizationId and log audit', async () => {
      const dto = {
        title: 'Test task',
        description: 'Desc',
        category: 'WORK' as const,
      };

      const createdTask: Task = {
        id: 'task-1',
        title: dto.title,
        description: dto.description,
        category: dto.category,
        status: 'TODO',
        ownerId: userOwner.id,
        organizationId: userOwner.organizationId,
        owner: null,
        organization: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (taskRepo.create as jest.Mock).mockReturnValue(createdTask);
      (taskRepo.save as jest.Mock).mockResolvedValue(createdTask);

      const result = await tasksService.create(dto, userOwner);

      expect(taskRepo.create).toHaveBeenCalledWith({
        title: dto.title,
        description: dto.description,
        category: dto.category,
        status: 'TODO',
        ownerId: userOwner.id,
        organizationId: userOwner.organizationId,
      });

      expect(taskRepo.save).toHaveBeenCalledWith(createdTask);

      expect(auditLogService.logTaskAction).toHaveBeenCalledWith(
        userOwner,
        expect.any(String), // AuditAction.TASK_CREATED
        createdTask.id,
        expect.any(Object),
      );

      expect(result).toBe(createdTask);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException for VIEWER', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Old',
        description: 'Old desc',
        category: 'WORK',
        status: 'TODO',
        ownerId: userOwner.id,
        organizationId: userOwner.organizationId,
        owner: null,
        organization: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (taskRepo.findOne as jest.Mock).mockResolvedValue(task);

      await expect(
        tasksService.update('task-1', { title: 'New' }, userViewer),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      (taskRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        tasksService.update('unknown-id', { title: 'New' }, userOwner),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should throw ForbiddenException for VIEWER', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'To delete',
        description: 'Desc',
        category: 'WORK',
        status: 'TODO',
        ownerId: userOwner.id,
        organizationId: userOwner.organizationId,
        owner: null,
        organization: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (taskRepo.findOne as jest.Mock).mockResolvedValue(task);

      await expect(
        tasksService.delete('task-1', userViewer),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should remove task and log audit for OWNER', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'To delete',
        description: 'Desc',
        category: 'WORK',
        status: 'TODO',
        ownerId: userOwner.id,
        organizationId: userOwner.organizationId,
        owner: null,
        organization: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (taskRepo.findOne as jest.Mock).mockResolvedValue(task);

      await tasksService.delete('task-1', userOwner);

      expect(taskRepo.remove).toHaveBeenCalledWith(task);

      expect(auditLogService.logTaskAction).toHaveBeenCalledWith(
        userOwner,
        expect.any(String), // AuditAction.TASK_DELETED
        task.id,
        expect.any(Object),
      );
    });
  });
});
