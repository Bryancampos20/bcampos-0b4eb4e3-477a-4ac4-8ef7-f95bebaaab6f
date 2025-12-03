import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthUser } from '@shared/auth';
import { Role, TaskStatus } from '@shared/data';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/audit-log.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,

    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Determines which organization IDs the user is authorized to access.
   *
   * Access rules:
   * - OWNER (parent org): access to its own org + direct children
   * - OWNER (child org): only its own org (child orgs typically have no children)
   * - ADMIN: only its own org
   * - VIEWER: only its own org
   *
   * This ensures multi-tenant isolation and prevents cross-organization reads.
   */
  private async getAllowedOrganizationIds(user: AuthUser): Promise<string[]> {
    // ADMIN and VIEWER roles are restricted to their single organization
    if (user.role !== Role.OWNER) {
      return [user.organizationId];
    }

    // OWNER may have access to a parent org and its children
    const org = await this.orgRepo.findOne({
      where: { id: user.organizationId },
      relations: ['children'],
    });

    // Fallback: if org does not exist, restrict scope to user org
    if (!org) {
      return [user.organizationId];
    }

    const ids = [org.id];

    // Include child organizations if present
    if (org.children && org.children.length > 0) {
      ids.push(...org.children.map((child) => child.id));
    }

    return ids;
  }

  /**
   * Returns all tasks visible to the current user, based on allowed organizations.
   * Tasks are sorted from newest to oldest.
   */
  async findAll(user: AuthUser): Promise<Task[]> {
    const allowedOrgIds = await this.getAllowedOrganizationIds(user);

    return this.taskRepo.find({
      where: {
        organizationId: In(allowedOrgIds),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Creates a new task within the user's organization.
   *
   * VIEWER users are strictly read-only and therefore cannot create tasks.
   * After creation, the action is logged to the audit log for traceability.
   */
  async create(dto: CreateTaskDto, user: AuthUser): Promise<Task> {
    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('VIEWER cannot create tasks');
    }

    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      category: dto.category,
      status: dto.status ?? TaskStatus.OPEN, // Default initial state
      ownerId: user.id,
      organizationId: user.organizationId,
    });

    const saved = await this.taskRepo.save(task);

    // Register audit entry
    await this.auditLogService.logTaskAction(
      user,
      AuditAction.TASK_CREATED,
      saved.id,
      {
        title: saved.title,
        description: saved.description,
        category: saved.category,
        status: saved.status,
      },
    );

    return saved;
  }

  /**
   * Retrieves a single task only if it belongs to an organization
   * the user is authorized to access.
   *
   * Ensures strict tenant isolation. Throws NotFoundException if either:
   * - the task does not exist
   * - OR the task exists but is outside the user's scope
   */
  private async findOneOrFailForUser(
    id: string,
    user: AuthUser,
  ): Promise<Task> {
    const allowedOrgIds = await this.getAllowedOrganizationIds(user);

    const task = await this.taskRepo.findOne({
      where: { id, organizationId: In(allowedOrgIds) },
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  /**
   * Updates an existing task.
   *
   * VIEWERs cannot modify tasks. OWNER and ADMIN users must also respect
   * organization scoping via findOneOrFailForUser().
   *
   * We explicitly strip ownerId and organizationId from the DTO to prevent
   * privilege escalation or malicious attempts to reassign ownership.
   *
   * The update operation is fully audited with before/after snapshots.
   */
  async update(id: string, dto: UpdateTaskDto, user: AuthUser): Promise<Task> {
    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('VIEWER cannot update tasks');
    }

    const task = await this.findOneOrFailForUser(id, user);

    // Hard-protection: never allow clients to modify ownership fields
    delete (dto as any).ownerId;
    delete (dto as any).organizationId;

    const before = { ...task };

    // Apply partial updates
    const updated = Object.assign(task, dto);
    const saved = await this.taskRepo.save(updated);

    // Audit logging with before/after diff
    await this.auditLogService.logTaskAction(
      user,
      AuditAction.TASK_UPDATED,
      saved.id,
      {
        before: {
          title: before.title,
          description: before.description,
          status: before.status,
          category: before.category,
        },
        after: {
          title: saved.title,
          description: saved.description,
          status: saved.status,
          category: saved.category,
        },
      },
    );

    return saved;
  }

  /**
   * Deletes a task.
   *
   * VIEWER users cannot perform destructive operations.
   *
   * Before deletion, ensure the task exists and belongs to an organization
   * within the user's permission scope.
   *
   * The delete is fully audited to preserve traceability even after removal.
   */
  async delete(id: string, user: AuthUser): Promise<void> {
    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('VIEWER cannot delete tasks');
    }

    const task = await this.findOneOrFailForUser(id, user);
    const taskId = task.id;

    await this.taskRepo.remove(task);

    // Log the deletion with last known state
    await this.auditLogService.logTaskAction(
      user,
      AuditAction.TASK_DELETED,
      taskId,
      {
        title: task.title,
        description: task.description,
        status: task.status,
        category: task.category,
      },
    );
  }
}
