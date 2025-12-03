import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@shared/auth';
import { Role } from '@shared/data';
import { AuditLogService, AuditLogWithUserEmail } from './audit-log.service';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  getOrgAuditLog(
    @CurrentUser() user: AuthUser,
  ): Promise<AuditLogWithUserEmail[]> {
    return this.auditLogService.findByOrganization(user);
  }
}
