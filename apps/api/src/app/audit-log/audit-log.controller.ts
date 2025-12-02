import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@shared/auth';
import { Role } from '@shared/data';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from './audit-log.entity';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  getOrgAuditLog(@CurrentUser() user: AuthUser): Promise<AuditLog[]> {
    return this.auditLogService.findByOrganization(user.organizationId);
  }
}
