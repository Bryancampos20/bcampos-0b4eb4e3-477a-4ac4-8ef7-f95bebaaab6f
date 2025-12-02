import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthUser } from '@shared/auth';
import { Role } from '@shared/data';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/audit-log.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly auditLogService: AuditLogService,
  ) {}

  // GET
  findAll(user: AuthUser) {
    return this.taskRepo.find({
      where: {
        organizationId: user.organizationId,
      },
    });
  }

  // CREATE
  async create(dto: CreateTaskDto, user: AuthUser): Promise<Task> {
    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      category: dto.category,
      status: dto.status ?? 'TODO',
      ownerId: user.id,
      organizationId: user.organizationId,
    });

    const saved = await this.taskRepo.save(task);

    await this.auditLogService.logTaskAction(
      user,
      AuditAction.TASK_CREATED,
      saved.id,
      {
        title: saved.title,
        category: saved.category,
        status: saved.status,
      },
    );

    return saved;
  }

  // FIND ONE (helper)
  async findOneOrFail(id: string, orgId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id, organizationId: orgId },
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // UPDATE
  async update(id: string, dto: UpdateTaskDto, user: AuthUser): Promise<Task> {
    const task = await this.findOneOrFail(id, user.organizationId);

    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('VIEWER cannot update tasks');
    }

    // Protección contra intentos maliciosos
    delete (dto as any).ownerId;
    delete (dto as any).organizationId;

    const before = { ...task };

    const updated = Object.assign(task, dto);
    const saved = await this.taskRepo.save(updated);

    await this.auditLogService.logTaskAction(
      user,
      AuditAction.TASK_UPDATED,
      saved.id,
      {
        before: {
          title: before.title,
          status: before.status,
          category: before.category,
        },
        after: {
          title: saved.title,
          status: saved.status,
          category: saved.category,
        },
      },
    );

    return saved;
  }

  // DELETE
  async delete(id: string, user: AuthUser): Promise<void> {
    const task = await this.findOneOrFail(id, user.organizationId);

    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('VIEWER cannot delete tasks');
    }

    // Guardar id antes de borrar
    const taskId = task.id;

    await this.taskRepo.remove(task);

    await this.auditLogService.logTaskAction(
      user,
      AuditAction.TASK_DELETED,
      taskId,
      {
        title: task.title,
        status: task.status,
        category: task.category,
      },
    );
  }
}
