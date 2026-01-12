import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';
import { AuthUser } from '@shared/auth';
import { Organization } from '../entities/organization.entity';
import { Role } from '@shared/data';

export interface AuditLogWithUserEmail extends AuditLog {
  userEmail?: string | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,

    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  /**
   * Computes the list of organization IDs that the current user
   * is allowed to access based on their role and organizational hierarchy.
   *
   * Visibility rules:
   * - OWNER (parent org): can access its own org + all direct child orgs
   * - OWNER (child org): only its own org (child orgs typically don't have children)
   * - ADMIN: only its own org
   * - VIEWER: never reaches this service (blocked via @Roles), but for consistency: only its own org
   *
   * This method ensures RBAC integrity by preventing users from querying logs
   * for organizations they do not belong to.
   */
  private async getAllowedOrganizationIds(user: AuthUser): Promise<string[]> {
    const org = await this.orgRepo.findOne({
      where: { id: user.organizationId },
      relations: ['children'],
    });

    if (!org) return [user.organizationId];

    // If this org has children, it's a parent org → scope includes children too
    if (org.children && org.children.length > 0) {
      return [org.id, ...org.children.map((child) => child.id)];
    }

    // Otherwise, child org (or no children) → scope is just itself
    return [org.id];
  }

  /**
   * Persists a new audit log entry for task-related actions.
   * 
   * This is typically invoked whenever a task is created, updated, or deleted.
   * 
   * @param user    - Authenticated user performing the action
   * @param action  - Enum describing the type of action executed
   * @param taskId  - ID of the affected task entity
   * @param details - Optional structured metadata describing "before/after" payloads,
   *                  validation diffs, or any additional context
   */
  async logTaskAction(
    user: AuthUser,
    action: AuditAction,
    taskId: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    const log = this.auditRepo.create({
      userId: user.id,
      organizationId: user.organizationId,
      action,
      entity: 'TASK',
      entityId: taskId,
      // Details are persisted as JSON for flexibility and versioning
      details: details ? JSON.stringify(details) : null,
    });

    await this.auditRepo.save(log);
  }

  /**
   * Retrieves all audit logs the current user is authorized to view.
   *
   * The visibility scope is determined by the user's role:
   * - Parent OWNER → logs from parent org + child orgs
   * - Child OWNER  → logs only from their org
   * - ADMIN        → logs only from their org
   *
   * This method also enriches the audit data by attaching the user's email
   * (via a manual join against the users table), which is useful for UI rendering.
   */
  async findByOrganization(user: AuthUser): Promise<AuditLogWithUserEmail[]> {
    const allowedOrgIds = await this.getAllowedOrganizationIds(user);

    // Using a raw query builder to explicitly control the selection + join behavior.
    // This ensures performance and avoids unnecessary hydration of TypeORM entities.
    const rows = await this.auditRepo
      .createQueryBuilder('log')
      .leftJoin('users', 'user', 'user.id = log.userId')
      .where('log.organizationId IN (:...orgIds)', { orgIds: allowedOrgIds })
      .select([
        'log.id AS id',
        'log.createdAt AS createdAt',
        'log.userId AS userId',
        'log.organizationId AS organizationId',
        'log.action AS action',
        'log.entity AS entity',
        'log.entityId AS entityId',
        'log.details AS details',
        'user.email AS userEmail',
      ])
      .orderBy('log.createdAt', 'DESC')
      .getRawMany();

    return rows as AuditLogWithUserEmail[];
  }
}
