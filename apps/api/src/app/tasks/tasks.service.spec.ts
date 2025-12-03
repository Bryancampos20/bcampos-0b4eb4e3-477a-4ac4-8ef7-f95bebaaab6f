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
import { Role, TaskCategory, TaskStatus } from '@shared/data';
import { Organization } from '../entities/organization.entity';
import { AuditAction } from '../audit-log/audit-log.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TasksService', () => {
  let tasksService: TasksService;
  let taskRepo: Repository<Task>;
  let orgRepo: Repository<Organization>;
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
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
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
    orgRepo = moduleRef.get(getRepositoryToken(Organization));
    auditLogService = moduleRef.get(AuditLogService);
  });

  describe('findAll', () => {
    it('should filter tasks by allowed organizationIds', async () => {
      (taskRepo.find as jest.Mock).mockResolvedValue([]);

      (orgRepo.findOne as jest.Mock).mockResolvedValue({
        id: userOwner.organizationId,
        children: [],
      });

      await tasksService.findAll(userOwner);

      expect(taskRepo.find).toHaveBeenCalledTimes(1);
      const callArgs = (taskRepo.find as jest.Mock).mock.calls[0][0];

      expect(callArgs.order).toEqual({ createdAt: 'DESC' });
      expect(callArgs.where).toBeDefined();
      expect(callArgs.where.organizationId).toBeDefined();
      expect(callArgs.where.organizationId.value).toEqual(['org-1']);
    });
  });

  describe('create', () => {
    it('should create a task with ownerId and organizationId and log audit', async () => {
      const dto: CreateTaskDto = {
        title: 'Test task',
        description: 'Desc',
        category: TaskCategory.CORE,
        status: TaskStatus.OPEN,
      };

      const createdTask: Task = {
        id: 'task-1',
        title: dto.title,
        description: dto.description!,
        category: dto.category,
        status: dto.status ?? TaskStatus.OPEN,
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
        status: dto.status ?? TaskStatus.OPEN,
        ownerId: userOwner.id,
        organizationId: userOwner.organizationId,
      });

      expect(taskRepo.save).toHaveBeenCalledWith(createdTask);

      expect(auditLogService.logTaskAction).toHaveBeenCalledWith(
        userOwner,
        AuditAction.TASK_CREATED,
        createdTask.id,
        expect.objectContaining({
          title: createdTask.title,
          description: createdTask.description,
          category: createdTask.category,
          status: createdTask.status,
        }),
      );

      expect(result).toBe(createdTask);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException for VIEWER', async () => {
      const updateDto: UpdateTaskDto = {
        title: 'New',
        description: 'Some desc',
        category: TaskCategory.CORE,
        status: TaskStatus.OPEN,
      };

      await expect(
        tasksService.update('task-1', updateDto, userViewer),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue({
        id: userOwner.organizationId,
        children: [],
      });

      (taskRepo.findOne as jest.Mock).mockResolvedValue(null);

      const updateDto: UpdateTaskDto = {
        title: 'New',
        description: 'Some desc',
        category: TaskCategory.CORE,
        status: TaskStatus.OPEN,
      };

      await expect(
        tasksService.update('unknown-id', updateDto, userOwner),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should throw ForbiddenException for VIEWER', async () => {
      await expect(
        tasksService.delete('task-1', userViewer),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should remove task and log audit for OWNER', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'To delete',
        description: 'Desc',
        category: TaskCategory.CORE,
        status: TaskStatus.OPEN,
        ownerId: userOwner.id,
        organizationId: userOwner.organizationId,
        owner: null,
        organization: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (orgRepo.findOne as jest.Mock).mockResolvedValue({
        id: userOwner.organizationId,
        children: [],
      });

      (taskRepo.findOne as jest.Mock).mockResolvedValue(task);

      await tasksService.delete('task-1', userOwner);

      expect(taskRepo.remove).toHaveBeenCalledWith(task);

      expect(auditLogService.logTaskAction).toHaveBeenCalledWith(
        userOwner,
        AuditAction.TASK_DELETED,
        task.id,
        expect.objectContaining({
          title: task.title,
          description: task.description,
          status: task.status,
          category: task.category,
        }),
      );
    });
  });
});
