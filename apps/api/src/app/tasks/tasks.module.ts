import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { RolesGuard } from '@shared/auth';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Organization]),
    AuditLogModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, RolesGuard],
  exports: [TasksService],
})
export class TasksModule {}
