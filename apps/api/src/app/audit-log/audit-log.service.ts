import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';
import { AuthUser } from '@shared/auth';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

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
      entity: 'task',
      entityId: taskId,
      details: details ? JSON.stringify(details) : null,
    });

    await this.auditRepo.save(log);
  }

  async findByOrganization(orgId: string): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }
}
